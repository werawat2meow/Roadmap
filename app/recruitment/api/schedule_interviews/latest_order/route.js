import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const datetime = searchParams.get("datetime");
    
    if (!datetime) {
      return NextResponse.json(
        { error: "datetime is required" },
        { status: 400 }
      );
    }

    // ใช้เฉพาะวันที่
    const date = new Date(datetime);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabaseAdmin
      .from("recruit_job_interviews")
      .select("interview_order")
      .gte("interview_datetime", start.toISOString())
      .lte("interview_datetime", end.toISOString())
      .order("interview_order", { ascending: false })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      latest_order: data?.[0]?.interview_order ?? 0,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}