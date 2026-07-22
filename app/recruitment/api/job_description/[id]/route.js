import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// function cleanRows(items) {
//   return (items || [])
//     .map((item, index) => ({
//       text: item,
//       sort_order: index + 1,
//     }))
//     .filter((item) =>
//       Object.values(item.text || {}).some(
//         (v) => String(v || "").trim().length > 0
//       )
//     );
// }

function cleanRows(rows = []) {
  return rows.filter((row) => {
    const texts = Object.values(row?.text || {});
    // เก็บไว้เฉพาะแถวที่มีอย่างน้อย 1 ภาษาไม่ว่าง
    return texts.some((t) => typeof t === "string" && t.trim() !== "");
  });
}

export async function GET(_request, { params }) {
  
  const { id } = await params;

  const { data: description, error: descError } = await supabaseAdmin
    .from("recruit_job_description")
    .select("id, branch_id, department_id, division_id, unit_id, positions_id, salary_min, salary_max, salary_note, type_of_work, status, updated_at, description")
    .eq("id", id)
    .single();

  if (descError) {
    return NextResponse.json({ message: descError.message }, { status: 500 });
  }

  const [requirementsRes, responsibilitiesRes, benefitsRes] = await Promise.all([
    supabaseAdmin
      .from("recruit_job_description_requirements")
      .select("id, requirement_text, sort_order , showpage")
      .eq("job_description_id", id)
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("recruit_job_description_responsibilities")
      .select("id, responsibility_text, sort_order")
      .eq("job_description_id", id)
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("recruit_job_description_benefits")
      .select("id, benefit_text, sort_order")
      .eq("job_description_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  return NextResponse.json({
    ...description,
    requirements: requirementsRes.data || [],
    responsibilities: responsibilitiesRes.data || [],
    benefits: benefitsRes.data || [],
  });
}

export async function PUT(request, { params }) {  
  try {
    const { id } = await params;

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
      description: body.description ?? null,
      workDay: body.workDay ?? null,
      workOff: body.workOff ?? null,
      remark: body.remark?? null,
    };
    
    const { error: updateError } = await supabaseAdmin
      .from("recruit_job_description")
      .update(descriptionPayload)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ message: updateError.message }, { status: 500 });
    }

    const { error: delBranchError } = await supabaseAdmin
      .from("recruit_job_description_branches")
      .delete()
      .eq("job_description_id", id);

    if (delBranchError) {
      return NextResponse.json({ message: delBranchError.message }, { status: 500 });
    }

    const branchRows = (body.branch_id || []).map((branchId) => ({
      job_description_id: id,
      branch_id: branchId,
    }));

    if (branchRows.length) {
      const { error } = await supabaseAdmin
        .from("recruit_job_description_branches")
        .insert(branchRows);

      if (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }
    }

    const requirements = cleanRows(body.requirements, "requirement_text").map((item) => ({
      job_description_id: id,
      requirement_text: item.text,
      sort_order: item.sort_order,
      showpage: item.showpage,
    }));

    // delete + insert เป็นคู่ ไม่แยกลำดับ
    const { error: delReqError } = await supabaseAdmin
      .from("recruit_job_description_requirements")
      .delete()
      .eq("job_description_id", id);
    if (delReqError) return NextResponse.json({ message: delReqError.message }, { status: 500 });

    if (requirements.length) {
      const { error } = await supabaseAdmin
        .from("recruit_job_description_requirements")
        .insert(requirements);
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const responsibilities = cleanRows(body.responsibilities, "responsibility_text").map((item) => ({
      job_description_id: id,
      responsibility_text: item.text,
      sort_order: item.sort_order,
    }));

    
    // delete + insert เป็นคู่ ไม่แยกลำดับ
    const { error: delRESError } = await supabaseAdmin
      .from("recruit_job_description_responsibilities")
      .delete()
      .eq("job_description_id", id);
    if (delRESError) return NextResponse.json({ message: delRESError.message }, { status: 500 });

    if (requirements.length) {
      const { error } = await supabaseAdmin
        .from("recruit_job_description_responsibilities")
        .insert(responsibilities);
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    }

    const benefits = cleanRows(body.benefits, "benefit_text").map((item) => ({
      job_description_id: id,
      benefit_text: item.text,
      sort_order: item.sort_order,
    }));

    // delete + insert เป็นคู่ ไม่แยกลำดับ
    const { error: delBenError } = await supabaseAdmin
      .from("recruit_job_description_benefits")
      .delete()
      .eq("job_description_id", id);
    if (delBenError) return NextResponse.json({ message: delBenError.message }, { status: 500 });

    if (requirements.length) {
      const { error } = await supabaseAdmin
        .from("recruit_job_description_benefits")
        .insert(benefits);
      if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const { id } = await params;

  await supabaseAdmin
    .from("recruit_job_description_requirements")
    .delete()
    .eq("job_description_id", id);

  await supabaseAdmin
    .from("recruit_job_description_responsibilities")
    .delete()
    .eq("job_description_id", id);

  await supabaseAdmin
    .from("recruit_job_description_benefits")
    .delete()
    .eq("job_description_id", id);

  const { error } = await supabaseAdmin
    .from("recruit_job_description")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Deleted successfully" });
}