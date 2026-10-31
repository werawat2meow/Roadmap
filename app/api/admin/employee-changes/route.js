import { NextResponse } from "next/server";
import { supabaseAdmin as db } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { getVerifiedAuditActor } from "@/lib/audit/authActor";
import { authorizedEmployee, visibleEmployeeIds } from "@/lib/employeeMovements";

const TYPES = new Set(["ORG_TRANSFER", "POSITION_TRANSFER", "PROMOTION", "DEMOTION", "SALARY_ADJUSTMENT"]);
const ORG_FIELDS = ["company_id", "branch_group_id", "branch_id", "department_id", "division_id", "unit_id"];
const JOB_FIELDS = ["position_id", "position_level_id"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT_EMPLOYEE = "id,employee_code,first_name_th,last_name_th,company_id,branch_group_id,branch_id,department_id,division_id,unit_id,position_id,position_level_id";
const err = (error, status = 400) => NextResponse.json({ success: false, error }, { status });
async function gate(action) {
  const guard = await requireScopedAccess("ems.employee_changes", action, { scopeType: "employee" });
  if (!guard.ok) return { response: guard.response };
  return { guard };
}
async function fetchAll(table, select, order = "id") {
  const { data, error } = await db.from(table).select(select).order(order).limit(2000);
  if (error) throw error;
  return data || [];
}
export async function GET() {
  try {
    const access = await gate("view"); if (access.response) return access.response;
    const ids = await visibleEmployeeIds(access.guard);
    // Do not query all employee changes if user scope is empty.
    const employeeQuery = db.from("employees").select(SELECT_EMPLOYEE).order("employee_code").limit(2000);
    const { data: employees, error: empErr } = await (ids === null ? employeeQuery : ids.length ? employeeQuery.in("id", ids) : Promise.resolve({ data: [], error: null }));
    if (empErr) throw empErr;
    const visible = (employees || []).map(x => x.id);
    let history = [];
    if (visible.length) {
      const { data, error } = await db.from("employee_change_requests")
        .select("id,employee_id,change_type,effective_date,old_snapshot,new_snapshot,reason,status,created_at")
        .in("employee_id", visible).order("created_at", { ascending: false }).limit(1000);
      if (error) throw error; history = data || [];
    }
    const [companies, branch_groups, branches, departments, divisions, units, positions, levels] = await Promise.all([
      fetchAll("companies", "id,company_name_th"), fetchAll("branch_groups", "id,group_name"),
      fetchAll("branches", "id,branch_name,company_id"), fetchAll("departments", "id,department_name"),
      fetchAll("divisions", "id,division_name,department_id"), fetchAll("units", "id,unit_name,division_id"),
      fetchAll("positions", "id,position_name"), fetchAll("position_levels", "id,level_code,level_name,sort_order", "sort_order")
    ]);
    return NextResponse.json({ success: true, employees: employees || [], history, masters: { companies, branch_groups, branches, departments, divisions, units, positions, levels } });
  } catch (e) { console.error("EMPLOYEE_CHANGES_GET", e); return err("ไม่สามารถโหลดข้อมูลการเปลี่ยนแปลงพนักงานได้", 500) }
}
export async function POST(req) {
  try {
    const access = await gate("create"); if (access.response) return access.response;
    const actor = getVerifiedAuditActor(req);
    if (!actor?.user_account_id) return err("กรุณาเข้าสู่ระบบใหม่", 401);
    const body = await req.json().catch(() => null);
    if (!body || !UUID.test(String(body.employee_id || "")) || !TYPES.has(body.change_type)) return err("ข้อมูลพนักงานหรือประเภทการเปลี่ยนแปลงไม่ถูกต้อง");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.effective_date || "")) || Number.isNaN(Date.parse(`${body.effective_date}T00:00:00Z`))) return err("วันที่มีผลไม่ถูกต้อง");
    const reason = String(body.reason || "").trim(); if (reason.length < 5 || reason.length > 1000) return err("กรุณาระบุเหตุผล 5–1000 ตัวอักษร");
    const employee = await authorizedEmployee(access.guard, body.employee_id);
    if (!employee) return err("ไม่มีสิทธิ์เข้าถึงพนักงานรายนี้", 403);
    const { data: current, error: currentErr } = await db.from("employees").select(SELECT_EMPLOYEE).eq("id", body.employee_id).maybeSingle();
    if (currentErr) throw currentErr;
    if (!current) return err("ไม่พบพนักงาน", 404);
    const keys = body.change_type === "ORG_TRANSFER" ? ORG_FIELDS : body.change_type === "SALARY_ADJUSTMENT" ? [] : JOB_FIELDS;
    let oldSnapshot = {}, newSnapshot = {};
    if (body.change_type === "SALARY_ADJUSTMENT") {
      // Salary is recorded as a proposed change only; no direct payroll mutation.
      const next = Number(body.new_salary);
      if (!Number.isFinite(next) || next < 0 || next > 100000000) return err("จำนวนเงินเดือนใหม่ไม่ถูกต้อง");
      newSnapshot = { proposed_salary: next };
    } else {
      const input = body.changes || {};
      for (const key of keys) {
        if (!Object.prototype.hasOwnProperty.call(input, key)) continue;
        const next = input[key] || null;
        if (next !== null && !UUID.test(String(next))) return err(`ค่า ${key} ไม่ถูกต้อง`);
        oldSnapshot[key] = current[key] || null;
        newSnapshot[key] = next;
      }
      if (!Object.keys(newSnapshot).length) return err("กรุณาเลือกข้อมูลที่ต้องการเปลี่ยน");
      if (Object.keys(newSnapshot).every(key => String(oldSnapshot[key] || "") === String(newSnapshot[key] || ""))) return err("ข้อมูลใหม่ต้องแตกต่างจากข้อมูลเดิม");
      const mapping = { company_id: "companies", branch_group_id: "branch_groups", branch_id: "branches", department_id: "departments", division_id: "divisions", unit_id: "units", position_id: "positions", position_level_id: "position_levels" };
      for (const [key, id] of Object.entries(newSnapshot)) {
        if (!id) continue;
        const { data, error } = await db.from(mapping[key]).select("id").eq("id", id).maybeSingle();
        if (error) throw error;
        if (!data) return err(`ไม่พบข้อมูล Master สำหรับ ${key}`);
      }
      if (body.change_type === "PROMOTION" || body.change_type === "DEMOTION") {
        if (!newSnapshot.position_level_id || !current.position_level_id) return err("การเลื่อน/ลดตำแหน่งต้องระบุระดับ P เดิมและใหม่");
        const { data, error } = await db.from("position_levels").select("id,sort_order,level_code").in("id", [current.position_level_id, newSnapshot.position_level_id]);
        if (error) throw error;
        const old = data?.find(x => x.id === current.position_level_id), next = data?.find(x => x.id === newSnapshot.position_level_id);
        if (!old || !next || old.sort_order === next.sort_order) return err("ระดับ P เดิมและใหม่ต้องแตกต่างกัน");
        // Use the configured ranking; ensure HR verifies orientation of sort_order.
        const higher = Number(next.sort_order) > Number(old.sort_order);
        if (body.change_type === "PROMOTION" && !higher || body.change_type === "DEMOTION" && higher) return err("ลำดับระดับ P ไม่สอดคล้องกับประเภทที่เลือก (ตรวจสอบ sort_order)");
      }
    }
    const { data, error } = await db.from("employee_change_requests").insert({
      employee_id: current.id, change_type: body.change_type, effective_date: body.effective_date,
      old_snapshot: oldSnapshot, new_snapshot: newSnapshot, reason, status: "RECORDED", created_by: actor.user_account_id,
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ success: true, id: data.id, message: "บันทึกรายการเสนอเปลี่ยนแปลงแล้ว (ยังไม่ได้อัปเดต Employee Master / Payroll)" });
  } catch (e) { console.error("EMPLOYEE_CHANGES_POST", e); return err("บันทึกรายการไม่สำเร็จ", 500) }
}
