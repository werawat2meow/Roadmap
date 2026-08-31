import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// สถานะที่บังคับต้องมีเหตุผล (remark)
const STATUS_REQUIRE_REMARK = [6, 7, 11];

export async function PUT(request) {
  try {
    const {
      application_id,
      status,
      interviewer_id,
      interview_datetime,
      sort_order,
      remark, // เพิ่ม
    } = await request.json();

    if (!application_id) {
      return NextResponse.json(
        { error: "ไม่พบ Application ID" },
        { status: 400 }
      );
    }

    const statusNum = Number(status);

    // ตรวจสอบว่ากรอกเหตุผลมาหรือยัง เมื่อ status อยู่ในกลุ่มที่บังคับ
    if (STATUS_REQUIRE_REMARK.includes(statusNum) && !remark?.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุเหตุผล" },
        { status: 400 }
      );
    }

    // เมื่อ status = 6 (เลื่อนสัมภาษณ์) ต้องมีวันเวลานัดใหม่ด้วย
    if (statusNum === 6 && !interview_datetime) {
      return NextResponse.json(
        { error: "กรุณาเลือกวันและเวลานัดสัมภาษณ์" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("recruit_job_applications")
      .update({ 
        status: statusNum, 
        status_reason: remark.trim() ?? null , 
        updated_at: new Date().toISOString() 
      })
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
    const interviewUpdate = {
      status: statusNum,
      updated_at: new Date().toISOString(),
    };

    if (interviewer_id) { interviewUpdate.reviewer = interviewer_id; }

    // ลำดับสัมภาษณ์ (เดิมอยู่ที่ endpoint update_order แยกต่างหาก)
    if (sort_order !== undefined && sort_order !== null) { interviewUpdate.interview_order = Number(sort_order); }

    // วันเวลานัดสัมภาษณ์ใหม่ (กรณีเลื่อนสัมภาษณ์ / status = 6)
    if (interview_datetime) { interviewUpdate.interview_datetime = interview_datetime; }

    // เหตุผล (เลื่อนสัมภาษณ์ / ขาดสัมภาษณ์ / ไม่ผ่านการคัดเลือก)
    if (STATUS_REQUIRE_REMARK.includes(statusNum)) {
      interviewUpdate.remark = remark.trim();
    }

    const { error: updateError } = await supabaseAdmin
      .from("recruit_job_interviews")
      .update(interviewUpdate)
      .eq("id", interview.id);

    if (updateError) { throw updateError; }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}