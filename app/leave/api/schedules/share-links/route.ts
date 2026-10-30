import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { applyEmployeeScope } from "@/lib/auth/requireScopedAccess";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getLeaveSchedulePeriod } from "@/lib/leave-schedule-period";
import {
  newScheduleShareToken,
  scheduleShareTokenHash,
} from "@/lib/leave-schedule-share";

export const dynamic = "force-dynamic";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const auth = await requirePermission("leave.view");
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { year, month, branchId, departmentId, divisionId, unitId } = body;
    getLeaveSchedulePeriod(year, month);
    if (![branchId, departmentId].every((id) => typeof id === "string" && uuid.test(id)) ||
        [divisionId, unitId].some((id) => id && (typeof id !== "string" || !uuid.test(id)))) {
      return NextResponse.json({ success: false, error: "เลือกสังกัดและแผนกให้ถูกต้อง" }, { status: 400 });
    }

    const baseQuery = () => {
      let query = supabaseAdmin.from("employees")
        .select("id", { count: "exact", head: true })
        .eq("is_deleted", false).eq("status", "active")
        .eq("branch_id", branchId).eq("department_id", departmentId);
      if (divisionId) query = query.eq("division_id", divisionId);
      if (unitId) query = query.eq("unit_id", unitId);
      return query;
    };
    const { count: totalInDepartment, error: totalError } = await baseQuery();
    if (totalError) throw totalError;
    const scopedQuery = applyEmployeeScope(baseQuery(), auth.access, { permission: "leave.view" });
    const { count, error: scopeError } = await scopedQuery;
    if (scopeError) throw scopeError;
    if (!count || count > 500 || count !== totalInDepartment) {
      return NextResponse.json({ success: false, error: "ต้องมีสิทธิ์ดูพนักงานทุกคนในขอบเขตที่เลือก (ไม่เกิน 500 คน)" }, { status: 403 });
    }

    const token = newScheduleShareToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("leave_schedule_share_links").insert({
      token_hash: scheduleShareTokenHash(token),
      year, month, branch_id: branchId, department_id: departmentId,
      division_id: divisionId || null, unit_id: unitId || null,
      created_by: auth.user.id, expires_at: expiresAt,
    });
    if (error) throw error;
    return NextResponse.json({
      success: true,
      url: new URL(`/schedule-share/${token}`, request.url).toString(),
      expiresAt,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Create schedule share link failed:", error);
    return NextResponse.json({ success: false, error: "สร้างลิงก์ไม่สำเร็จ" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requirePermission("leave.view");
  if (!auth.ok) return auth.response;
  const { data, error } = await supabaseAdmin.from("leave_schedule_share_links")
    .select("id, year, month, branch_id, department_id, division_id, unit_id, created_at, expires_at, revoked_at")
    .eq("created_by", auth.user.id).is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false }).limit(50);
  if (error) return NextResponse.json({ success: false, error: "โหลดลิงก์ไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ success: true, links: data || [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  const auth = await requirePermission("leave.view");
  if (!auth.ok) return auth.response;
  const { id } = await request.json().catch(() => ({ id: null }));
  if (typeof id !== "string" || !uuid.test(id)) {
    return NextResponse.json({ success: false, error: "ลิงก์ไม่ถูกต้อง" }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from("leave_schedule_share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id).eq("created_by", auth.user.id).is("revoked_at", null)
    .select("id").maybeSingle();
  if (error) return NextResponse.json({ success: false, error: "ยกเลิกลิงก์ไม่สำเร็จ" }, { status: 500 });
  return NextResponse.json({ success: Boolean(data) }, { status: data ? 200 : 404 });
}
