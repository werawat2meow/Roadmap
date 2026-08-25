import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  ensureEmployeeAccessible,
  getActorRoleId,
  getActorUserAccountId,
  requireCompensationAccess,
} from "@/lib/compensation/compensationAccess";
import {
  insertApprovalLog,
  loadAdjustment,
  loadCurrentCompensation,
} from "@/lib/compensation/compensationService";

export async function POST(req, { params }) {
  try {
    const guard = await requireCompensationAccess("adjust");
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

    if (adjustment.status !== "draft") {
      return NextResponse.json(
        { success: false, error: "ส่งอนุมัติได้เฉพาะสถานะ draft" },
        { status: 409 }
      );
    }

    const current = await loadCurrentCompensation(adjustment.employee_id);
    if (!current || current.id !== adjustment.current_compensation_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Current Compensation เปลี่ยนไปแล้ว กรุณาสร้าง Adjustment ใหม่",
        },
        { status: 409 }
      );
    }

    const actorId = getActorUserAccountId(guard);
    const actorRoleId = getActorRoleId(guard);
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("employee_compensation_adjustments")
      .update({
        status: "pending",
        requested_by: actorId,
        requested_at: now,
        updated_by: actorId,
        updated_at: now,
      })
      .eq("id", id)
      .eq("status", "draft")
      .select("*")
      .single();

    if (error) throw error;

    await insertApprovalLog({
      adjustmentId: id,
      action: "submitted",
      fromStatus: "draft",
      toStatus: "pending",
      actorUserAccountId: actorId,
      actorRoleId,
      comment: body?.comment,
    });

    return NextResponse.json({
      success: true,
      message: "ส่งรายการปรับเงินเดือนเพื่ออนุมัติเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("SUBMIT compensation adjustment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถส่งอนุมัติได้",
      },
      { status: 500 }
    );
  }
}
