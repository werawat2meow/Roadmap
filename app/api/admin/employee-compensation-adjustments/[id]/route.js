import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  ensureEmployeeAccessible,
  getActorUserAccountId,
  requireCompensationAccess,
} from "@/lib/compensation/compensationAccess";
import {
  ADJUSTMENT_SELECT,
  calculateAdjustment,
  cleanText,
  loadAdjustment,
  loadCurrentCompensation,
} from "@/lib/compensation/compensationService";

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
      .from("employee_compensation_adjustments")
      .select(ADJUSTMENT_SELECT)
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET compensation adjustment detail error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลดรายการปรับเงินเดือนได้" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const guard = await requireCompensationAccess("adjust");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await req.json();
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
        {
          success: false,
          error: "แก้ไขได้เฉพาะรายการที่มีสถานะ draft เท่านั้น",
        },
        { status: 409 }
      );
    }

    const current = await loadCurrentCompensation(adjustment.employee_id);
    if (!current || current.id !== adjustment.current_compensation_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Current Compensation เปลี่ยนไปแล้ว กรุณายกเลิกรายการนี้และสร้าง Adjustment ใหม่",
        },
        { status: 409 }
      );
    }

    const calculated = calculateAdjustment({
      currentSalary: current.base_salary,
      adjustmentAmount:
        body?.adjustment_amount ?? adjustment.adjustment_amount,
      adjustmentPercent:
        body?.adjustment_percent ?? adjustment.adjustment_percent,
      proposedSalary: body?.proposed_salary ?? adjustment.proposed_salary,
    });

    const payload = {
      adjustment_type:
        cleanText(body?.adjustment_type) || adjustment.adjustment_type,
      ...calculated,
      performance_rating:
        Object.prototype.hasOwnProperty.call(body, "performance_rating")
          ? cleanText(body.performance_rating)
          : adjustment.performance_rating,
      performance_score:
        Object.prototype.hasOwnProperty.call(body, "performance_score")
          ? body.performance_score === "" || body.performance_score == null
            ? null
            : Number(body.performance_score)
          : adjustment.performance_score,
      review_cycle:
        Object.prototype.hasOwnProperty.call(body, "review_cycle")
          ? cleanText(body.review_cycle)
          : adjustment.review_cycle,
      evaluation_reference_id:
        Object.prototype.hasOwnProperty.call(body, "evaluation_reference_id")
          ? cleanText(body.evaluation_reference_id)
          : adjustment.evaluation_reference_id,
      effective_date:
        cleanText(body?.effective_date) || adjustment.effective_date,
      reason:
        Object.prototype.hasOwnProperty.call(body, "reason")
          ? cleanText(body.reason)
          : adjustment.reason,
      remark:
        Object.prototype.hasOwnProperty.call(body, "remark")
          ? cleanText(body.remark)
          : adjustment.remark,
      updated_by: getActorUserAccountId(guard),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("employee_compensation_adjustments")
      .update(payload)
      .eq("id", id)
      .select(ADJUSTMENT_SELECT)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "แก้ไขรายการปรับเงินเดือนเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("PATCH compensation adjustment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถแก้ไขรายการปรับเงินเดือนได้",
      },
      { status: 500 }
    );
  }
}
