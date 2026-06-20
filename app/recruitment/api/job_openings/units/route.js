import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const divisionId = searchParams.get("division_id");
  const q = searchParams.get("q") || "";

  let query = supabaseAdmin
    .from("recruit_job_description")
    .select(`
      unit_id,
      units!inner (
        id,
        unit_name,
        division_id,
        status
      )
    `)
    .eq("units.division_id", divisionId)
    .eq("units.status", "active");

  if (q) {
    query = query.ilike(
      "units.unit_name",
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

  // ป้องกัน unit ซ้ำ
  const uniqueUnits = new Map();

  (data || []).forEach((row) => {
    const unit = row.units;

    if (unit && !uniqueUnits.has(unit.id)) {
      uniqueUnits.set(unit.id, {
        id: unit.id,
        label: unit.unit_name,
      });
    }
  });

  return NextResponse.json(
    Array.from(uniqueUnits.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  );
}