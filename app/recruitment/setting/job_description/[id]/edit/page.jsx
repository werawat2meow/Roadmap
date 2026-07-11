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
  ] = await Promise.all([

    supabaseAdmin
      .from("branches")
      .select("id, branch_name"),

    supabaseAdmin
      .from("departments")
      .select("id, department_name"),

    supabaseAdmin
      .from("branch_departments")
      .select("branch_id, department_id"),

    supabaseAdmin
      .from("divisions")
      .select("id, division_name, department_id"),

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
      .select("id, requirement_text, sort_order")
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
  ]);
  
  if (descriptionRes.error || !descriptionRes.data) {
    notFound();
  }
  
  const initialData = {
    ...descriptionRes.data,
    requirements: reqRes.data || [],
    responsibilities: respRes.data || [],
    benefits: benRes.data || [],
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
      />
  );
}