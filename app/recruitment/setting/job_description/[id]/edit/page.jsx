import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import JobDescriptionForm from "@/app/recruitment/components/JobDescriptionFormPage";

export default async function EditJobDescriptionPage({ params }) {
  const { id } = await params;

  const [
    branchesRes,
    departmentsRes,
    branchDepartmentsRes,
    divisionsRes,
    unitsRes,
    unitPositionsRes,
    positionsRes,
    descriptionRes,
    reqRes,
    respRes,
    benRes,
    lang,
    jobDescriptionBranches,
    emptype,
  ] = await Promise.all([

    supabaseAdmin
      .from("branches")
      .select("id, branch_name")
      .order("branch_name", { ascending: true }),

    supabaseAdmin
      .from("departments")
      .select("id, department_name")
      .order("department_name", { ascending: true }),

    supabaseAdmin
      .from("branch_departments")
      .select("branch_id, department_id"),

    supabaseAdmin
      .from("divisions")
      .select("id, division_name, department_id")
      .order("division_name", { ascending: true }),

    supabaseAdmin
      .from("units")
      .select("id, unit_name, division_id"),

    supabaseAdmin
      .from("unit_positions")
      .select("unit_id, position_id"),

    supabaseAdmin
      .from("positions")
      .select("id, position_name, position_level")
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("recruit_job_description")
      .select("*")
      .eq("id", id)
      .single(),

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

    supabaseAdmin
      .from("recruit_language")
      .select("id, language_name, language_slug")
      .order("id", { ascending: true }),

    supabaseAdmin
      .from("recruit_job_description_branches")
      .select("job_description_id, branch_id")
      .eq("job_description_id", id),

    supabaseAdmin
      .from("employment_types")
      .select("id, type_name, type_code")
      .order("id", { ascending: true }),
  ]);
  
  if (descriptionRes.error || !descriptionRes.data) {
    notFound();
  }
  
  const initialData = {
    ...descriptionRes.data,
    requirements: (reqRes.data || []).map((item) => ({
    id: item.id,
    text: item.requirement_text ?? {},
    sort_order: item.sort_order,
    showpage: item.showpage ?? false,
  })),
  responsibilities: (respRes.data || []).map((item) => ({
    id: item.id,
    text: item.responsibility_text ?? {},
    sort_order: item.sort_order,
  })),
  benefits: (benRes.data || []).map((item) => ({
    id: item.id,
    text: item.benefit_text ?? {},
    sort_order: item.sort_order,
  })),
    jobDescriptionBranches : jobDescriptionBranches.data || [],
  };

  return (
      <JobDescriptionForm
        mode="edit"
        branches={branchesRes.data || []}
        departments={departmentsRes.data || []}
        branchDepartments={branchDepartmentsRes.data || []}
        divisions={divisionsRes.data || []}
        units={unitsRes.data || []}
        unitPositions={unitPositionsRes.data || []}
        positions={positionsRes.data || []}
        languages={lang.data || []}
        initialData={initialData}
        emptype={emptype.data || []}
      />
  );
}