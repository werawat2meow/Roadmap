import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  ensureEmployeeAccessible,
  getActorRoleId,
  getActorUserAccountId,
  requireCompensationAccess,
} from "@/lib/compensation/compensationAccess";
import {
  cleanText,
  insertApprovalLog,
  loadAdjustment,
} from "@/lib/compensation/compensationService";

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
        { success: false, error: "Reject ได้เฉพาะรายการสถานะ pending" },
        { status: 409 }
      );
    }

    const reason = cleanText(body?.reason);
    if (!reason) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุเหตุผลที่ Reject" },
        { status: 400 }
      );
    }

    const actorId = getActorUserAccountId(guard);
    const actorRoleId = getActorRoleId(guard);
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("employee_compensation_adjustments")
      .update({
        status: "rejected",
        rejected_by: actorId,
        rejected_at: now,
        rejection_reason: reason,
        updated_by: actorId,
        updated_at: now,
      })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .single();

    if (error) throw error;

    await insertApprovalLog({
      adjustmentId: id,
      action: "rejected",
      fromStatus: "pending",
      toStatus: "rejected",
      actorUserAccountId: actorId,
      actorRoleId,
      comment: reason,
    });

    return NextResponse.json({
      success: true,
      message: "Reject รายการปรับเงินเดือนเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("REJECT compensation adjustment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถ Reject รายการปรับเงินเดือนได้",
      },
      { status: 500 }
    );
  }
}
