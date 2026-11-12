import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const value = (input) => String(input ?? "").trim();
const nullable = (input) => value(input) || null;
const fail = (message, status = 400) => NextResponse.json({ success: false, error: message }, { status });

async function getOne(table, id, columns) {
  const { data, error } = await supabaseAdmin.from(table).select(columns).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

async function getSalary(employeeId) {
  const { data, error } = await supabaseAdmin.from("employee_compensations")
    .select("id,base_salary").eq("employee_id", employeeId).eq("status", "active")
    .is("effective_to", null).order("effective_from", { ascending: false })
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function GET(_request, { params }) {
  const guard = await requireScopedAccess("ems.employees", "edit");
  if (!guard.ok) return guard.response;
  try {
    const { id } = await params;
    const employee = await getOne("employees", id,
      "id,employee_code,first_name_th,last_name_th,first_name_en,last_name_en,nickname_th,title_id,gender_id,birth_date,citizen_id,passport_no,start_work_date,hire_date,branch_id,department_id,division_id,unit_id,position_id,position_level_id,employee_photo_url,employee_photo_path,company_id,branch_group_id");
    if (!employee) return fail("ไม่พบพนักงาน", 404);
    if (!guard.canAccessEmployee(employee)) return fail("ไม่มีสิทธิ์ดูพนักงานคนนี้", 403);
    const { data: codes, error } = await supabaseAdmin.from("employee_legacy_codes")
      .select("legacy_code").eq("employee_id", id).order("legacy_code");
    if (error) throw error;
    const salary = await getSalary(id);
    return NextResponse.json({ success: true, data: {
      employee: { ...employee, base_salary: salary?.base_salary ?? null },
      legacy_codes: (codes || []).map((item) => item.legacy_code),
    } });
  } catch (error) {
    console.error("Load employee for edit failed", error);
    return fail("โหลดข้อมูลพนักงานไม่สำเร็จ", 500);
  }
}

export async function PATCH(request, { params }) {
  const guard = await requireScopedAccess("ems.employees", "edit");
  if (!guard.ok) return guard.response;
  try {
    const { id } = await params;
    const current = await getOne("employees", id,
      "id,company_id,branch_group_id,branch_id,department_id,division_id,unit_id");
    if (!current) return fail("ไม่พบพนักงาน", 404);
    if (!guard.canAccessEmployee(current)) return fail("ไม่มีสิทธิ์แก้ไขพนักงานคนนี้", 403);
    const body = await request.json();
    const hasSalary = Object.prototype.hasOwnProperty.call(body, "base_salary");
    const salaryText = value(body.base_salary);
    if (hasSalary && salaryText && !/^\d{1,12}(\.\d{1,2})?$/.test(salaryText)) {
      return fail("เงินเดือนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป และมีทศนิยมไม่เกิน 2 ตำแหน่ง");
    }
    const salary = hasSalary ? await getSalary(id) : null;
    if (salary && !salaryText) {
      return fail("กรุณากรอกเงินเดือน หากไม่มีเงินเดือนให้ระบุ 0");
    }
    const employeeCode = value(body.employee_code);
    const legacyCodes = (Array.isArray(body.legacy_codes) ? body.legacy_codes : []).map(value).filter(Boolean);
    if (!employeeCode || !value(body.first_name_th) || !value(body.last_name_th) ||
        !value(body.start_work_date) || !value(body.branch_id) || !value(body.department_id) ||
        !value(body.position_id) || !value(body.position_level_id)) {
      return fail("กรอกรหัสพนักงาน ชื่อ นามสกุล วันเริ่มงาน สังกัด แผนก ตำแหน่ง และ Level P");
    }
    if (legacyCodes.length !== new Set(legacyCodes).size || legacyCodes.includes(employeeCode))
      return fail("รหัสเก่าต้องไม่ซ้ำกันหรือซ้ำรหัสปัจจุบัน");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value(body.start_work_date)) ||
        (body.birth_date && !/^\d{4}-\d{2}-\d{2}$/.test(value(body.birth_date))))
      return fail("รูปแบบวันที่ไม่ถูกต้อง");

    const branch = await getOne("branches", body.branch_id, "id,company_id,group_id,status");
    const department = await getOne("departments", body.department_id, "id,status");
    const level = await getOne("position_levels", body.position_level_id, "id,level_code,status");
    const creatingPosition = body.position_id === "__new__";
    const newPositionName = value(body.new_position_name);
    let position = creatingPosition ? null : await getOne("positions", body.position_id, "id,position_family_id,job_id,status");
    if (!branch || !department || !level || (!creatingPosition && !position) ||
        branch.status !== "active" || department.status !== "active" ||
        (!creatingPosition && position.status !== "active") || !/^P\d+$/i.test(level.level_code ?? ""))
      return fail("สังกัด แผนก ตำแหน่ง หรือ Level P ไม่ถูกต้อง");
    if (creatingPosition && (!newPositionName || newPositionName.length > 200))
      return fail("กรอกชื่อตำแหน่งใหม่ไม่เกิน 200 ตัวอักษร");
    const target = { company_id: branch.company_id, branch_id: branch.id,
      department_id: department.id, division_id: nullable(body.division_id), unit_id: nullable(body.unit_id) };
    if (!guard.canAccessEmployee(target)) return fail("ไม่มีสิทธิ์ย้ายพนักงานไปหน่วยงานนี้", 403);
    const { data: link, error: linkError } = await supabaseAdmin.from("branch_departments")
      .select("id").eq("branch_id", branch.id).eq("department_id", department.id).maybeSingle();
    if (linkError) throw linkError;
    if (!link) return fail("แผนกไม่อยู่ในสังกัดที่เลือก");
    if (body.division_id) {
      const division = await getOne("divisions", body.division_id, "id,department_id,status");
      if (!division || division.department_id !== department.id || division.status !== "active") return fail("ฝ่ายไม่อยู่ในแผนกที่เลือก");
    }
    if (body.unit_id) {
      const unit = await getOne("units", body.unit_id, "id,division_id,status");
      if (!body.division_id || !unit || unit.division_id !== body.division_id || unit.status !== "active") return fail("หน่วยไม่อยู่ในฝ่ายที่เลือก");
    }
    const { data: sameCode, error: sameCodeError } = await supabaseAdmin.from("employees")
      .select("id").eq("employee_code", employeeCode).neq("id", id).limit(1);
    if (sameCodeError) throw sameCodeError;
    if (sameCode?.length) return fail("รหัสพนักงานถูกใช้แล้ว", 409);
    const { data: codeInLegacy, error: codeInLegacyError } = await supabaseAdmin.from("employee_legacy_codes")
      .select("employee_id").eq("legacy_code", employeeCode).limit(1);
    if (codeInLegacyError) throw codeInLegacyError;
    if (codeInLegacy?.length) return fail("รหัสพนักงานถูกใช้เป็นรหัสเก่าแล้ว", 409);
    if (legacyCodes.length) {
      const { data: currentMatches, error: currentError } = await supabaseAdmin.from("employees")
        .select("employee_code").in("employee_code", legacyCodes).limit(1);
      if (currentError) throw currentError;
      if (currentMatches?.length) return fail(`รหัสเก่า ${currentMatches[0].employee_code} เป็นรหัสปัจจุบันของพนักงาน`, 409);
      const { data: taken, error: takenError } = await supabaseAdmin.from("employee_legacy_codes")
        .select("employee_id,legacy_code").in("legacy_code", legacyCodes).neq("employee_id", id).limit(1);
      if (takenError) throw takenError;
      if (taken?.length) return fail(`รหัสเก่า ${taken[0].legacy_code} ถูกใช้แล้ว`, 409);
    }
    const { data: oldCodes, error: oldError } = await supabaseAdmin.from("employee_legacy_codes")
      .select("legacy_code").eq("employee_id", id);
    if (oldError) throw oldError;
    const previousCodes = new Set((oldCodes || []).map((row) => row.legacy_code));
    const additions = legacyCodes.filter((code) => !previousCodes.has(code));
    const removals = [...previousCodes].filter((code) => !legacyCodes.includes(code));

    let createdPositionId = null;
    if (creatingPosition) {
      const { data: matches, error } = await supabaseAdmin.from("positions")
        .select("id,position_family_id,job_id,status").ilike("position_name", newPositionName).limit(1);
      if (error) throw error;
      if (matches?.length) {
        if (matches[0].status !== "active") return fail("ตำแหน่งนี้ถูกปิดใช้งาน");
        position = matches[0];
      } else {
        const { data: created, error: createError } = await supabaseAdmin.from("positions")
          .insert({ position_code: `POS-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
            position_name: newPositionName, status: "active" })
          .select("id,position_family_id,job_id,status").single();
        if (createError) throw createError;
        position = created;
        createdPositionId = created.id;
      }
      const { error: mapError } = await supabaseAdmin.from("position_level_mappings")
        .upsert({ position_id: position.id, position_level_id: level.id,
          is_default: Boolean(createdPositionId) }, { onConflict: "position_id,position_level_id", ignoreDuplicates: true });
      if (mapError) throw mapError;
    }
    const row = {
      employee_code: employeeCode, first_name_th: value(body.first_name_th), last_name_th: value(body.last_name_th),
      first_name_en: nullable(body.first_name_en), last_name_en: nullable(body.last_name_en),
      nickname_th: nullable(body.nickname_th), nick_name: nullable(body.nickname_th),
      title_id: nullable(body.title_id), gender_id: nullable(body.gender_id), birth_date: nullable(body.birth_date),
      citizen_id: nullable(body.citizen_id), passport_no: nullable(body.passport_no),
      start_work_date: value(body.start_work_date), hire_date: value(body.start_work_date),
      company_id: branch.company_id, branch_group_id: branch.group_id, branch_id: branch.id,
      department_id: department.id, division_id: nullable(body.division_id), unit_id: nullable(body.unit_id),
      position_id: position.id, position_family_id: position.position_family_id,
      job_id: position.job_id, position_level_id: level.id,
      employee_photo_url: nullable(body.employee_photo_url), employee_photo_path: nullable(body.employee_photo_path),
    };
    const { data: saved, error: saveError } = await supabaseAdmin.from("employees")
      .update(row).eq("id", id).select("id,employee_code").single();
    if (saveError) {
      if (createdPositionId) await supabaseAdmin.from("positions").delete().eq("id", createdPositionId);
      if (saveError.code === "23505") return fail("รหัสพนักงานถูกใช้แล้ว", 409);
      throw saveError;
    }
    if (additions.length) {
      const { error } = await supabaseAdmin.from("employee_legacy_codes").insert(additions.map((legacy_code) => ({
        employee_id: id, company_id: branch.company_id, source_system: "LEGACY_EXCEL", legacy_code,
      })));
      if (error) throw error;
    }
    if (removals.length) {
      const { error } = await supabaseAdmin.from("employee_legacy_codes")
        .delete().eq("employee_id", id).in("legacy_code", removals);
      if (error) throw error;
    }
    if (current.company_id !== branch.company_id && legacyCodes.length) {
      const { error } = await supabaseAdmin.from("employee_legacy_codes")
        .update({ company_id: branch.company_id }).eq("employee_id", id);
      if (error) throw error;
    }
    if (hasSalary && salaryText) {
      if (salary) {
        if (Number(salary.base_salary) !== Number(salaryText)) {
          const { error: salaryError } = await supabaseAdmin.from("employee_compensations")
            .update({ base_salary: salaryText, updated_at: new Date().toISOString() })
            .eq("id", salary.id).eq("employee_id", id);
          if (salaryError) throw salaryError;
        }
      } else {
        const { error: salaryError } = await supabaseAdmin.from("employee_compensations").insert({
          employee_id: id,
          position_id: position.id,
          position_level_id: level.id,
          base_salary: salaryText,
          currency_code: "THB",
          effective_from: value(body.start_work_date),
          source_type: "initial",
          status: "active",
          reason: "Initial employee compensation",
        });
        if (salaryError) throw salaryError;
      }
    }
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error("Update employee failed", error);
    return fail("บันทึกการแก้ไขไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองอีกครั้ง", 500);
  }
}
