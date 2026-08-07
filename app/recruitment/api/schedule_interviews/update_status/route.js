import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PUT(request) {
  try {
    const {
      application_id,
      status,
      interviewer_id,
      interview_datetime,
      sort_order,
    } = await request.json();

    if (!application_id) {
      return NextResponse.json(
        { error: "ไม่พบ Application ID" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("recruit_job_applications")
      .update({ status: Number(status), updated_at: new Date().toISOString(),})
      .eq("id", application_id);

    if (error) throw error;

    // หา Interview ล่าสุดของ Application นี้
    const { data: interview, error: findError } = await supabaseAdmin
      .from("recruit_job_interviews")
      .select("id")
      .eq("application_id", application_id)
      .order("interview_round", { ascending: false })
      .limit(1)
      .single();

    if (findError || !interview) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลการสัมภาษณ์" },
        { status: 404 }
      );
    }

    // เตรียม payload สำหรับอัปเดต recruit_job_interviews
    const interviewUpdate = { status: Number(status), updated_at: new Date().toISOString(), };

    if (interviewer_id) { interviewUpdate.reviewer = interviewer_id; }

    // ลำดับสัมภาษณ์ (เดิมอยู่ที่ endpoint update_order แยกต่างหาก)
    if (sort_order !== undefined && sort_order !== null) { interviewUpdate.interview_order = Number(sort_order); }

    // วันเวลานัดสัมภาษณ์ใหม่ (กรณีเลื่อนสัมภาษณ์ / status = 6)
    if (interview_datetime) { interviewUpdate.interview_datetime = interview_datetime; }

    const { error: updateError } = await supabaseAdmin
      .from("recruit_job_interviews")
      .update(interviewUpdate)
      .eq("id", interview.id);

    if (updateError) { throw updateError; }

    return NextResponse.json({ success: true, });
  } catch (err) {
    return NextResponse.json(
      { error: err.message, },
      { status: 500, }
    );
  }
}