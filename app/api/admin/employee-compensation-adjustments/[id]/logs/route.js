import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  ensureEmployeeAccessible,
  requireCompensationAccess,
} from "@/lib/compensation/compensationAccess";
import { loadAdjustment } from "@/lib/compensation/compensationService";

export async function GET(req, { params }) {
  try {
    const guard = await requireCompensationAccess("view");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const adjustment = await loadAdjustment(id);

    if (!adjustment) {
      return NextResponse.json(
        { success: false, error: "ไม่พบรายการปรับเงินเดือน" },
        { status: 404 }
      );
    }

    const access = await ensureEmployeeAccessible(
      guard,
      adjustment.employee_id
    );
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("employee_compensation_approval_logs")
      .select("*, actor:user_accounts(id, username), role:roles(id, role_code, role_name)")
      .eq("adjustment_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("GET compensation approval logs error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลด Approval Logs ได้" },
      { status: 500 }
    );
  }
}
