import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PUT(request) {
  try {
    const { application_id, status } = await request.json();

    if (!application_id) {
      return NextResponse.json(
        { error: "ไม่พบ Application ID" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("recruit_job_applications")
      .update({
        status: Number(status),
        updated_at: new Date().toISOString(),
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

      console.log(interview);      

    if (findError || !interview) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลการสัมภาษณ์" },
        { status: 404 }
      );
    }

    // อัปเดต interview_round
    const { error: updateError } = await supabaseAdmin
      .from("recruit_job_interviews")
      .update({
        status: Number(status),
      })
      .eq("id", interview.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}