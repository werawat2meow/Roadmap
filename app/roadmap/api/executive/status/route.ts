import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { evaluationId, action } = await req.json();

    if (!evaluationId || !action) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // กำหนดสถานะตามปุ่มที่กด
    // อนุมัติ -> Completed, ไม่อนุมัติ -> Rejected (หรือตามที่คุณต้องการ)
    const newStatus = action === "approve" ? "Completed" : "Rejected";

    const { error } = await supabaseAdmin
      .from("rm_evaluations")
      .update({ 
        status: newStatus,
        completedAt: action === "approve" ? new Date().toISOString() : null 
      })
      .eq("id", evaluationId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: `เปลี่ยนสถานะเป็น ${newStatus} เรียบร้อย` });
  } catch (error: any) {
    console.error("Update Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}