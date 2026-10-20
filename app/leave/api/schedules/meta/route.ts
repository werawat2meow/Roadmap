import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { readAllScheduleRows } from "@/lib/leave-schedule-query";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requirePermission("leave.view");

    if (!auth.ok) {
      return auth.response;
    }

    const [
      branches,
      departments,
      branchDepartments,
      divisions,
      units,
      shifts,
    ] = await Promise.all([
      readAllScheduleRows(
        supabaseAdmin
          .from("branches")
          .select("id, branch_name")
          .eq("status", "active")
          .order("id"),
      ),

      readAllScheduleRows(
        supabaseAdmin
          .from("departments")
          .select("id, department_name")
          .eq("status", "active")
          .order("id"),
      ),

      readAllScheduleRows(
        supabaseAdmin
          .from("branch_departments")
          .select("id, branch_id, department_id")
          .eq("status", "active")
          .order("id"),
      ),

      readAllScheduleRows(
        supabaseAdmin
          .from("divisions")
          .select("id, department_id, division_name")
          .eq("status", "active")
          .order("id"),
      ),

      readAllScheduleRows(
        supabaseAdmin
          .from("units")
          .select("id, division_id, unit_name")
          .eq("status", "active")
          .order("id"),
      ),

      readAllScheduleRows(
        supabaseAdmin
          .from("leave_work_shifts")
          .select("id, name, color, definition, active")
          .eq("active", true)
          .order("id"),
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        branches,
        departments,
        branchDepartments,
        divisions,
        units,
        shifts,
      },
    });
  } catch (error: unknown) {
    console.error("Load schedule metadata failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "โหลดตัวกรองตารางงานไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}