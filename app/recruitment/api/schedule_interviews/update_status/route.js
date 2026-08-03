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