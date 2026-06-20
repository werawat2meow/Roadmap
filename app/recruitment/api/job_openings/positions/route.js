import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const unitId = searchParams.get("unit_id");
  const q = searchParams.get("q") || "";

  let query = supabaseAdmin
    .from("recruit_job_description")
    .select(`
      positions_id,
      positions!inner (
        id,
        position_name,
        position_level,
        status,
        unit_positions!inner (
          unit_id,
          status
        )
      )
    `)
    .eq("positions.status", "active")
    .eq("positions.unit_positions.unit_id", unitId)
    .eq("positions.unit_positions.status", "active");

  if (q) {
    query = query.ilike(
      "positions.position_name",
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

  // ป้องกันข้อมูลซ้ำ
  const uniquePositions = new Map();

  (data || []).forEach((row) => {
    const position = row.positions;

    if (position && !uniquePositions.has(position.id)) {
      uniquePositions.set(position.id, {
        id: position.id,
        label: position.position_name,
        level: position.position_level,
      });
    }
  });

  return NextResponse.json(
    Array.from(uniquePositions.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  );
}