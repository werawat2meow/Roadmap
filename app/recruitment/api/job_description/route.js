import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanRows(items) {
  return (items || [])
    .map((item, index) => ({
      text: item,
      sort_order: index + 1,
    }))
    .filter((item) =>
      Object.values(item.text || {}).some(
        (v) => String(v || "").trim().length > 0
      )
    );
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("recruit_job_description")
    .select(`
      id,
      positions_id,
      salary_min,
      salary_max,
      type_of_work,
      updated_at,
      positions ( position_name , position_level ),
      description
    `)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  
  const rows = (data || []).map((row) => ({
    id: row.id,
    positions_id: row.positions_id,
    positions_name: row.positions?.position_name || "-",
    position_level: row.positions?.position_level || "-",
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    type_of_work: row.type_of_work,
    updated_at: row.updated_at,
    description: row.description,
  }));

  return NextResponse.json(rows);
}

export async function POST(request) {
  try {
    const body = await request.json();

    const descriptionPayload = {
      positions_id: body.positions_id,
      branch_id: body.branch_id,
      department_id: body.department_id,
      division_id: body.division_id,
      unit_id: body.unit_id,
      salary_min: toNumberOrNull(body.salary_min),
      salary_max: toNumberOrNull(body.salary_max),
      salary_note: body.salary_note ?? null,
      type_of_work: body.type_of_work ?? "monthly",
      workLocation: body.workLocation,
      status: true,
      updated_at:new Date().toISOString(),
      description: body.descriptionซ ?? null,
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("recruit_job_description")
      .insert(descriptionPayload)
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ message: insertError.message }, { status: 500 });
    }

    const descriptionId = inserted.id;

    const requirements = cleanRows(body.requirements).map((item) => ({
      job_description_id: descriptionId,
      requirement_text: item.text,
      sort_order: item.sort_order,
      updated_at:new Date().toISOString(),
    }));

    const responsibilities = cleanRows(body.responsibilities).map((item) => ({
      job_description_id: descriptionId,
      responsibility_text: item.text,
      sort_order: item.sort_order,
      updated_at:new Date().toISOString(),
    }));

    const benefits = cleanRows(body.benefits).map((item) => ({
      job_description_id: descriptionId,
      benefit_text: item.text,
      sort_order: item.sort_order,
      updated_at:new Date().toISOString(),
    }));

    if (requirements.length) {
      const { error } = await supabaseAdmin
        .from("recruit_job_description_requirements")
        .insert(requirements);
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    }

    if (responsibilities.length) {
      const { error } = await supabaseAdmin
        .from("recruit_job_description_responsibilities")
        .insert(responsibilities);
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    }

    if (benefits.length) {
      const { error } = await supabaseAdmin
        .from("recruit_job_description_benefits")
        .insert(benefits);
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Created successfully", id: descriptionId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}