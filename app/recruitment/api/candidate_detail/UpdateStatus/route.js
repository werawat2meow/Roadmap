import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PUT(request) {
  try {
    const { id, status, interview_datetime, interview_type } = await request.json();


    if (!id) {
      return NextResponse.json(
        {
          message: "ไม่พบ Application ID",
        },
        {
          status: 400,
        }
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
        {
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    if(status == 4){
      const { error } = await supabaseAdmin
        .from("recruit_job_interviews")
        .insert({
          application_id:id,
          interview_round:1,
          interview_type:interview_type,
          interview_datetime:interview_datetime,
          status,
        });

      if (error) {
        return NextResponse.json(
          {
            message: error.message,
          },
          {
            status: 500,
          }
        );
      }
      
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลเรียบร้อย",
    });
  } catch (err) {
    return NextResponse.json(
      {
        message: err.message,
      },
      {
        status: 500,
      }
    );
  }
}