import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);

    const keyword = searchParams.get("keyword") || "";
    const status = searchParams.get("status");
    const position_id = searchParams.get("position_id");

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("recruit_job_interviews")
      .select(
        `
        application_id,
        interview_round,
        interview_datetime,
        status,

        recruit_job_applications!inner(
          id,
          first_name,
          last_name,
          position_id,

          positions(
            position_name
          )
        )
      `,
        {
          count: "exact",
        }
      )
      .in("status", [12, 13, 17]);

    // Status Filter
    if (status) {
      query = query.eq("status", Number(status));
    }

    // Position Filter
    if (position_id) {
      query = query.eq(
        "recruit_job_applications.position_id",
        position_id
      );
    }

    // Keyword Filter
    if (keyword) {
      query = query.or(
        `first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%`,
        {
          foreignTable: "recruit_job_applications",
        }
      );
    }

    query = query .order("interview_datetime", { ascending: true, }) .range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error(error);

      return NextResponse.json(
        { success: false, message: error.message, },
        { status: 500, }
      );
    }

    const result = (data || []).map((item) => ({
      application_id: item.application_id,
      first_name: item.recruit_job_applications?.first_name || "",
      last_name: item.recruit_job_applications?.last_name || "",
      position_id: item.recruit_job_applications?.position_id || null,
      position_name: item.recruit_job_applications?.positions?.position_name || "",
      interview_round: item.interview_round,
      interview_datetime: item.interview_datetime,
      status: item.status,
    }));

    return NextResponse.json({
      success: true,
      data: result,
      total: count || 0,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { success: false, message: err.message, },
      { status: 500, }
    );
  }
}