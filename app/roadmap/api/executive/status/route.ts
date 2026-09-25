import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const {
      evaluationId,
      action,
      rejectionNote,
      approvalNote,
      salaryEffectiveMonth,
    } = body;

    if (
      !evaluationId ||
      !action ||
      !["approve", "reject", "return"].includes(action)
    ) {
      return NextResponse.json(
        { success: false, error: "ข้อมูลไม่ครบหรือ action ไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    if (action === "approve" && !approvalNote?.trim()) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุหมายเหตุการอนุมัติ" },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const updatePayload: any = {
      status:
        action === "approve"
          ? "Completed"
          : action === "reject"
            ? "Rejected"
            : "Returned",
      completedAt: action === "approve" ? now : null,
    };

    if (action === "approve") {
      updatePayload.approved_by = auth.user.id;
      updatePayload.approved_at = now;
      updatePayload.approval_note = approvalNote?.trim() || null;
      updatePayload.salary_effective_month =
        salaryEffectiveMonth?.trim() || null;

      updatePayload.rejected_by = null;
      updatePayload.rejected_at = null;
      updatePayload.rejection_note = null;
    } else {
      updatePayload.rejected_by = auth.user.id;
      updatePayload.rejected_at = now;
      updatePayload.rejection_note = rejectionNote || null;
      updatePayload.approved_by = null;
      updatePayload.approved_at = null;
      updatePayload.approval_note = null;
      updatePayload.salary_effective_month = null;
    }

    const { error } = await supabaseAdmin
      .from("rm_evaluations")
      .update(updatePayload)
      .eq("id", evaluationId);

    if (error) throw error;

    if (action === "approve") {
      const { data: evaluation, error: evalFetchError } = await supabaseAdmin
        .from("rm_evaluations")
        .select(
          `
      id,
      employee_id,
      extra_data,
      evaluation_period_continued,
      rm_evaluation_types(name)
    `,
        )
        .eq("id", evaluationId)
        .maybeSingle();

      if (evalFetchError) throw evalFetchError;

      const evaluationTypeName =
        (evaluation?.rm_evaluation_types as any)?.name ?? "";

      const isProbationExtended =
        evaluationTypeName === "Probation" &&
        Boolean(
          evaluation?.evaluation_period_continued?.trim() ||
          evaluation?.extra_data?.isProbationExtended,
        );

      if (isProbationExtended) {
        const continuedEndDate =
          evaluation?.evaluation_period_continued?.split(" - ")?.[1] || null;

        await supabaseAdmin
          .from("employees")
          .update({
            probation_status: "extended",
            probation_end_date: continuedEndDate,
            updated_at: now,
          })
          .eq("id", evaluation.employee_id);
      }
    }

    // 🔥 เพิ่มส่วนนี้: ถ้าเป็นการตีกลับแก้ไข ให้รีเซ็ตสถานะของผู้ประเมินทุกคนกลับเป็น Draft
    if (action === "return") {
      await supabaseAdmin
        .from("rm_evaluation_reviewers")
        .update({
          status: "Draft",
          completedAt: null,
        })
        .eq("evaluation_id", evaluationId);
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "อนุมัติเรียบร้อยแล้ว"
          : action === "reject"
            ? "ไม่อนุมัติเรียบร้อยแล้ว"
            : "ตีกลับให้แก้ไขเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Executive status update failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
