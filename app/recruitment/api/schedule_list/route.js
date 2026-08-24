import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get("reviewer_id");

    const selectQuery = `
      id,
      first_name,
      last_name,
      profile_image_url,
      position_id,
      positions (
        id,
        position_name
      ),
      recruit_job_interviews${reviewerId ? "!inner" : ""} (
        id,
        reviewer,
        employees:reviewer (
          id,
          first_name_th,
          last_name_th
        )
      )
    `;

    let query = supabaseAdmin
      .from("recruit_job_applications")
      .select(selectQuery)
      .eq("status", 5)
      .order("created_at", { ascending: false });

    if (reviewerId) {      
      query = query.eq("recruit_job_interviews.reviewer", reviewerId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}