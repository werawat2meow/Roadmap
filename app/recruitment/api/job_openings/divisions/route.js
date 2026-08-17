import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const departmentId = searchParams.get("department_id");
  const q = searchParams.get("q") || "";

  let query = supabaseAdmin
    .from("recruit_job_description")
    .select(`
      division_id,
      divisions!inner (
        id,
        division_name,
        department_id,
        status
      )
    `)
    .eq("divisions.department_id", departmentId)
    .eq("divisions.status", "active");

  if (q) {
    query = query.ilike(
      "divisions.division_name",
      `%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // กัน division ซ้ำ
  const uniqueDivisions = new Map();

  (data || []).forEach((row) => {
    const division = row.divisions;

    if (division && !uniqueDivisions.has(division.id)) {
      uniqueDivisions.set(division.id, {
        id: division.id,
        label: division.division_name,
      });
    }
  });

  return NextResponse.json(
    Array.from(uniqueDivisions.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  );
}