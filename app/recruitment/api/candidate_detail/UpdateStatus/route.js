import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserIdFromRequest } from "@/app/recruitment/lib/getUserId";

export async function PUT(request) {
  try {
    const { id, status, interview_datetime, interview_type, location, meeting_url } = await request.json();

    const userId = await getUserIdFromRequest();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", },
        { status: 401, }
      );
    }

    if (!id) {
      return NextResponse.json(
        { message: "ไม่พบ Application ID",},
        { status: 400,}
      );
    }

    const { error } = await supabaseAdmin
      .from("recruit_job_applications")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { message: error.message,},
        { status: 500,}
      );
    }

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
      { message: err.message,},
      { status: 500,}
    );
  }
}