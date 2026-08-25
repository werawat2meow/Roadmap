import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();

    if (!auth?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { evaluationId, action, rejectionNote } = body;

    if (!evaluationId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "ข้อมูลไม่ครบหรือ action ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updatePayload: any = {
      status: action === "approve" ? "Completed" : "Rejected",
      completedAt: action === "approve" ? now : null,
    };

    if (action === "approve") {
      updatePayload.approved_by = auth.user.id;
      updatePayload.approved_at = now;
      updatePayload.rejected_by = null;
      updatePayload.rejected_at = null;
      updatePayload.rejection_note = null;
    } else {
      updatePayload.rejected_by = auth.user.id;
      updatePayload.rejected_at = now;
      updatePayload.rejection_note = rejectionNote || null;
      updatePayload.approved_by = null;
      updatePayload.approved_at = null;
    }

    const { error } = await supabaseAdmin
      .from("rm_evaluations")
      .update(updatePayload)
      .eq("id", evaluationId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "อนุมัติเรียบร้อยแล้ว"
          : "ปฏิเสธการอนุมัติเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    console.error("Executive status update failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}