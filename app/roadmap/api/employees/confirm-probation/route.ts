import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, evaluationId } = body;

    if (!employeeId || !evaluationId) {
      return NextResponse.json(
        { success: false, error: "Missing employeeId or evaluationId" },
        { status: 400 },
      );
    }

    const { data: evaluation, error: evalError } = await supabaseAdmin
      .from("rm_evaluations")
      .select(
        `
        id,
        employee_id,
        status,
        evaluation_period_continued,
        extra_data,
        rm_evaluation_types(name)
      `,
      )
      .eq("id", evaluationId)
      .eq("employee_id", employeeId)
      .maybeSingle();

    if (evalError) throw evalError;

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลประเมิน" },
        { status: 404 },
      );
    }

    const evaluationTypeName =
      (evaluation.rm_evaluation_types as any)?.name ?? "";

    if (evaluation.status !== "Completed" || evaluationTypeName !== "Probation") {
      return NextResponse.json(
        {
          success: false,
          error: "รายการนี้ยังไม่ใช่ Probation ที่อนุมัติแล้ว",
        },
        { status: 400 },
      );
    }

    const isExtended = Boolean(
      evaluation.evaluation_period_continued?.trim() ||
        evaluation.extra_data?.isProbationExtended,
    );

    if (isExtended) {
      return NextResponse.json(
        {
          success: false,
          error: "รายการนี้เป็นเคสต่อโปร ยังไม่สามารถอัปเดตเป็นพนักงานประจำได้",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({
        probation_status: "passed",
        confirmation_date: now,
        updated_at: now,
      })
      .eq("id", employeeId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      message: "อัปเดตเป็นพนักงานประจำเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Confirm probation failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Confirm probation failed" },
      { status: 500 },
    );
  }
}