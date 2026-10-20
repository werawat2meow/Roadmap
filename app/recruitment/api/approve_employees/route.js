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
    const startDateFrom = searchParams.get("start_date_from");
    const startDateTo = searchParams.get("start_date_to");
    const isDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };

    if (
      !Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
      (startDateFrom && !isDate(startDateFrom)) ||
      (startDateTo && !isDate(startDateTo)) ||
      (startDateFrom && startDateTo && startDateFrom > startDateTo) ||
      (status && ![10, 12, 13, 14, 15, 17].includes(Number(status)))
    ) {
      return NextResponse.json(
        { success: false, message: "ตัวกรองหรือช่วงวันที่ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("recruit_job_applications")
      .select(
        `
        id,
        first_name,
        last_name,
        position_id,
        start_date,
        status,
        positions(position_name),
        recruit_job_interviews(
          interview_round,
          interview_datetime
        )
      `,
        {
          count: "exact",
        }
      );

    // Status Filter
    if (status) {
      query = query.eq("status", Number(status));
    } else {
      query = query.in("status", [12, 13, 17]);
    }

    // Position Filter
    if (position_id) {
      query = query.eq(
        "position_id",
        position_id
      );
    }

    // Keyword Filter
    if (keyword) {
      query = query.or(
        `first_name.ilike.%${keyword}%,last_name.ilike.%${keyword}%`
      );
    }

    if (startDateFrom) query = query.gte("start_date", startDateFrom);
    if (startDateTo) query = query.lte("start_date", startDateTo);

    // One parent row per application, with only its latest interview round.
    // Apply all filters before counting/paging; id provides stable page ordering.
    query = query
      .order("interview_round", { referencedTable: "recruit_job_interviews", ascending: false, nullsFirst: false })
      .order("interview_datetime", { referencedTable: "recruit_job_interviews", ascending: false, nullsFirst: false })
      .limit(1, { referencedTable: "recruit_job_interviews" })
      .order("id", { ascending: true })
      .range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error(error);

      return NextResponse.json(
        { success: false, message: error.message, },
        { status: 500, }
      );
    }

    const result = (data || []).map((item) => ({
      application_id: item.id,
      first_name: item.first_name || "",
      last_name: item.last_name || "",
      position_id: item.position_id || null,
      position_name: item.positions?.position_name || "",
      start_date: item.start_date || null,
      interview_round: item.recruit_job_interviews?.[0]?.interview_round ?? null,
      interview_datetime: item.recruit_job_interviews?.[0]?.interview_datetime ?? null,
      status: Number(item.status),
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
