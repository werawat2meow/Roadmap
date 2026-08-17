import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function normalizeJobLanguageRows(rows, positions) {
  const positionMap = new Map(positions.map((p) => [p.id, p]));

  return rows.map((row) => {
    const position = positionMap.get(row.position_id);
    return {
      id: row.id,
      position_id: row.position_id,
      position_name: position?.position_name ?? "",
      job_to_language: row.job_to_language ?? {},
    };
  });
}

export async function GET() {
  const [positionsRes, languagesRes, mixRes] = await Promise.all([
    supabaseAdmin
      .from("positions")
      .select("id, position_name")
      .order("id", { ascending: true }),
    supabaseAdmin
      .from("recruit_language")
      .select("id, language_name , language_slug")
      .order("id", { ascending: true }),
    supabaseAdmin
      .from("recruit_job_mix_language")
      .select("id, position_id, job_to_language")
      .order("id", { ascending: true }),
  ]);

  if (positionsRes.error) {
    return NextResponse.json({ message: positionsRes.error.message }, { status: 500 });
  }
  if (languagesRes.error) {
    return NextResponse.json({ message: languagesRes.error.message }, { status: 500 });
  }
  if (mixRes.error) {
    return NextResponse.json({ message: mixRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    positions: positionsRes.data ?? [],
    languages: languagesRes.data ?? [],
    items: normalizeJobLanguageRows(mixRes.data ?? [], positionsRes.data ?? []),
  });
}

export async function POST(request) {
  const body = await request.json();
  
  const position_id = body.position_id;
  const job_to_language = body.job_to_language ?? {};
  const updated_at = new Date().toISOString();
  
  if (!position_id) {
    return NextResponse.json({ message: "position_id is required" }, { status: 400 });
  }

  const existing = await supabaseAdmin
    .from("recruit_job_mix_language")
    .select("id")
    .eq("position_id", position_id)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json({ message: existing.error.message }, { status: 500 });
  }

  if (existing.data?.id) {
    const updated = await supabaseAdmin
      .from("recruit_job_mix_language")
      .update({ job_to_language , updated_at })
      .eq("id", existing.data.id)
      .select("id, position_id, job_to_language")
      .single();

    if (updated.error) {
      return NextResponse.json({ message: updated.error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "updated", data: updated.data });
  }

  const inserted = await supabaseAdmin
    .from("recruit_job_mix_language")
    .insert([{ position_id, job_to_language , updated_at }])
    .select("id, position_id, job_to_language")
    .single();

  if (inserted.error) {
    return NextResponse.json({ message: inserted.error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "created", data: inserted.data }, { status: 201 });
}