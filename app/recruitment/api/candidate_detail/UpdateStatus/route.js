import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserIdFromRequest } from "@/app/recruitment/lib/getUserId";

export async function PUT(request) {
  try {
    const {
      id,
      status,
      remark,
      interview_datetime,
      interview_type,
      location,
      meeting_url,
      position_id,
      postpone_date,
    } = await request.json();

    const userId = await getUserIdFromRequest();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { message: "ไม่พบ Application ID" },
        { status: 400 }
      );
    }

    // ดึงข้อมูล application ปัจจุบัน เพื่อเช็ค status ก่อนอัปเดต
    const { data: currentApplication, error: currentApplicationError } =
      await supabaseAdmin
        .from("recruit_job_applications")
        .select("status")
        .eq("id", id)
        .maybeSingle();

    if (currentApplicationError) {
      return NextResponse.json(
        { message: currentApplicationError.message },
        { status: 500 }
      );
    }

    if (!currentApplication) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูล Application" },
        { status: 404 }
      );
    }

    // status เดิม = 4 (นัดสัมภาษณ์) หรือ 6 (เลื่อนสัมภาษณ์ครั้งก่อนหน้า) ถือว่ามีรอบสัมภาษณ์ที่ต้องอัปเดตอยู่
    const hasActiveInterviewRecord =
      currentApplication.status === 4 || currentApplication.status === 6;

    const data_update = {
      status,
      status_reason: remark ?? null,
      updated_at: new Date().toISOString(),
    };

    if (status === 18) {
      if (!position_id) {
        return NextResponse.json(
          {
            success: false,
            message: "กรุณาระบุตำแหน่ง",
          },
          { status: 400 }
        );
      }

      data_update.position_id = position_id;
    }

    // 1) อัปเดต recruit_job_applications เสมอ (status, status_reason = remark)
    const { error } = await supabaseAdmin
      .from("recruit_job_applications")
      .update(data_update)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    // 2) ถ้า status เดิม (ก่อนอัปเดต) เป็น 4 หรือ 6 -> อัปเดตรอบสัมภาษณ์ล่าสุดใน recruit_job_interviews ด้วย
    if (hasActiveInterviewRecord) {
      const { data: latestInterview, error: latestInterviewError } =
        await supabaseAdmin
          .from("recruit_job_interviews")
          .select("id, interview_datetime, status")
          .eq("application_id", id)
          .order("interview_round", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (latestInterviewError) {
        return NextResponse.json(
          { message: latestInterviewError.message },
          { status: 500 }
        );
      }

      if (latestInterview) {
        // เก็บค่าก่อนอัปเดตไว้ใช้เป็น old_data ของ log
        const previousInterviewDatetime = latestInterview.interview_datetime;
        const previousStatus = latestInterview.status;

        const interviewUpdatePayload = {
          status,
          remark: remark ?? null,
        };

        // ถ้าเลื่อนสัมภาษณ์ (status = 6) ให้อัปเดต interview_datetime เป็นวันที่เลื่อนใหม่ด้วย
        if (status === 6) {
          interviewUpdatePayload.interview_datetime = postpone_date ?? null;
        }

        const { error: updateInterviewError } = await supabaseAdmin
          .from("recruit_job_interviews")
          .update(interviewUpdatePayload)
          .eq("id", latestInterview.id);

        if (updateInterviewError) {
          return NextResponse.json(
            { message: updateInterviewError.message },
            { status: 500 }
          );
        }

        // 2.1) ถ้า status ใหม่เป็น 6 (เลื่อนการสัมภาษณ์ ไม่ว่าจะครั้งที่เท่าไหร่) -> บันทึก log ลง recruit_job_interview_logs
        if (status === 6) {
          const { error: logError } = await supabaseAdmin
            .from("recruit_job_interview_logs")
            .insert({
              interview_id: latestInterview.id,
              created_by: userId,
              old_data: {
                interview_datetime: previousInterviewDatetime,
                status: previousStatus,
              },
              new_data: {
                postpone_date,
                status,
              },
            });

          if (logError) {
            return NextResponse.json(
              { message: logError.message },
              { status: 500 }
            );
          }
        }
      }
    }

    // 3) ถ้า status ใหม่ เป็น 4 -> สร้างรอบสัมภาษณ์ใหม่ (นัดสัมภาษณ์)
    if (status === 4) {
      // ดึงรอบสัมภาษณ์ล่าสุด
      const { data: latestInterview, error: interviewError } =
        await supabaseAdmin
          .from("recruit_job_interviews")
          .select("interview_round")
          .eq("application_id", id)
          .order("interview_round", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (interviewError) {
        return NextResponse.json(
          { message: interviewError.message },
          { status: 500 }
        );
      }

      const nextRound = latestInterview ? latestInterview.interview_round + 1 : 1;

      const { error: insertError } = await supabaseAdmin
        .from("recruit_job_interviews")
        .insert({
          application_id: id,
          interview_round: nextRound,
          interview_type,
          interview_datetime,
          location,
          meeting_url,
          created_by: userId,
          reviewer: null,
          status,
        });

      if (insertError) {
        return NextResponse.json(
          { message: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลเรียบร้อย",
    });
  } catch (err) {
    return NextResponse.json(
      { message: err.message },
      { status: 500 }
    );
  }
}