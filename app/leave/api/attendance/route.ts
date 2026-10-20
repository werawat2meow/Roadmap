import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const matchStatus = searchParams.get("matchStatus");

  let query = supabaseAdmin
    .from("leave_attendance_import_rows")
    .select(`
      id,
      import_batch_id,
      external_employee_code,
      employee_id,
      employee_code,
      work_date,
      check_in,
      check_out,
      match_status,
      error_message,
      created_at
    `)
    .order("work_date", { ascending: false });

  if (from) query = query.gte("work_date", from);
  if (to) query = query.lte("work_date", to);
  if (matchStatus) query = query.eq("match_status", matchStatus);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: data || [],
  });
}