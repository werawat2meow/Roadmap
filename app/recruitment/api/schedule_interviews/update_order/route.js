import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PUT(request) {
  try {
    const { application_id, sort_order } = await request.json();

    if (!application_id) {
      return NextResponse.json(
        { error: "ไม่พบ Application ID" },
        { status: 400 }
      );
    }

    if (
      sort_order === undefined ||
      sort_order === null ||
      Number(sort_order) < 1
    ) {
      return NextResponse.json(
        { error: "ลำดับไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    // หา Interview ล่าสุดของ Application นี้
    const { data: interview, error: findError } = await supabaseAdmin
      .from("recruit_job_interviews")
      .select("id")
      .eq("application_id", application_id)
      .order("interview_datetime", { ascending: false })
      .limit(1)
      .single();

    if (findError || !interview) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลการสัมภาษณ์" },
        { status: 404 }
      );
    }

    // อัปเดต sort_order
    const { error: updateError } = await supabaseAdmin
      .from("recruit_job_interviews")
      .update({
        interview_order: Number(sort_order),
      })
      .eq("id", interview.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตลำดับเรียบร้อย",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message || "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}