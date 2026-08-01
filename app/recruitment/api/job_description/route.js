import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanRows(rows = []) {
  return rows.filter((row) => {
    const texts = Object.values(row?.text || {});
    // เก็บไว้เฉพาะแถวที่มีอย่างน้อย 1 ภาษาไม่ว่าง
    return texts.some((t) => typeof t === "string" && t.trim() !== "");
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("pageSize")) || 10;
  const positionId = searchParams.get("position_id");

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("recruit_job_description")
    .select(
      `
      id,
      positions_id,
      salary_min,
      salary_max,
      type_of_work,
      updated_at,
      description,
      positions (
        position_name
      ),
      recruit_job_description_branches (
        branch_id,
        branches (
          branch_name
        )
      )
    `,
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (positionId) {
    query = query.eq("positions_id", positionId);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  const rows = (data || []).map((row) => ({
    id: row.id,
    positions_id: row.positions_id,
    positions_name: row.positions?.position_name || "-",
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    type_of_work: row.type_of_work,
    updated_at: row.updated_at,
    description: row.description,

    branches:
      row.recruit_job_description_branches?.map((item) => ({
        branch_id: item.branch_id,
        branch_name: item.branches?.branch_name || "-",
      })) || [],

    branch_names:
      row.recruit_job_description_branches
        ?.map((item) => item.branches?.branch_name)
        .filter(Boolean)
        .join(", ") || "-",
  }));

  return NextResponse.json({
    data: rows,
    total: count ?? 0,
    page,
    pageSize,
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const descriptionPayload = {
      positions_id: body.positions_id,
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
      description: body.description ?? null,
      workDay: body.workDay ?? null,
      workOff: body.workOff ?? null,
      remark: body.remark ?? null,
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

    const branchRows = (body.branch_id || []).map((branchId) => ({      
      job_description_id: descriptionId,
      branch_id: branchId,
    }));

    if (branchRows.length) {
      const { error } = await supabaseAdmin
        .from("recruit_job_description_branches")
        .insert(branchRows);

      if (error) {
        return NextResponse.json(
          { message: error.message },
          { status: 500 }
        );
      }
    }

    const requirements = cleanRows(body.requirements).map((item) => ({
      job_description_id: descriptionId,
      requirement_text: item.text,
      sort_order: item.sort_order ?? 1,
      showpage: item.showpage ?? false,
    }));

    const responsibilities = cleanRows(body.responsibilities).map((item) => ({
      job_description_id: descriptionId,
      responsibility_text: item.text,
      sort_order: item.sort_order,
    }));

    const benefits = cleanRows(body.benefits).map((item) => ({
      job_description_id: descriptionId,
      benefit_text: item.text,
      sort_order: item.sort_order,
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