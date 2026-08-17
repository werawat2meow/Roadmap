import { NextResponse } from "next/server";
import {
  ensureEmployeeAccessible,
  getActorRoleId,
  getActorUserAccountId,
  requireCompensationAccess,
} from "@/lib/compensation/compensationAccess";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { loadAdjustment } from "@/lib/compensation/compensationService";

export async function POST(req, { params }) {
  try {
    const guard = await requireCompensationAccess("approve");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
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

    if (adjustment.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "อนุมัติได้เฉพาะรายการสถานะ pending" },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc(
      "approve_employee_compensation_adjustment",
      {
        p_adjustment_id: id,
        p_actor_user_account_id: getActorUserAccountId(guard),
        p_actor_role_id: getActorRoleId(guard),
        p_comment: body?.comment || null,
      }
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "อนุมัติการปรับเงินเดือนเรียบร้อยแล้ว",
      data: {
        adjustment_id: id,
        resulting_compensation_id: data,
      },
    });
  } catch (error) {
    console.error("APPROVE compensation adjustment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถอนุมัติการปรับเงินเดือนได้",
      },
      { status: 500 }
    );
  }
}
