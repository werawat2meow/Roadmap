import { supabaseAdmin } from "@/lib/supabaseServer";
import JobDescriptionForm from "@/app/recruitment/components/JobDescriptionFormPage";

export default async function NewJobDescriptionPage() {
  const [
    { data: branches, error: branchesError },
    { data: departments, error: departmentsError },
    { data: branchDepartments, error: branchDepartmentsError },
    { data: divisions, error: divisionsError },
    { data: units, error: unitsError },
    { data: positions, error: positionsError },
    { data: unitPositions, error: unitPositionsError },
    { data: languages, error: languagesError },
    { data: emptype, error: emptypeError },
  ] = await Promise.all([
    supabaseAdmin.from("branches").select("id, branch_name").order("branch_name", { ascending: true }),
    supabaseAdmin.from("departments").select("id, department_name").order("department_name", { ascending: true }),
    supabaseAdmin
      .from("branch_departments")
      .select("id, branch_id, department_id")
      .order("id", { ascending: true }),
    supabaseAdmin.from("divisions").select("id, division_name, department_id").order("division_name", { ascending: true }),
    supabaseAdmin.from("units").select("id, unit_name, division_id").order("unit_name", { ascending: true }),
    supabaseAdmin
      .from("positions")
      .select("id, position_name, position_level")
      .order("position_name", { ascending: true }),
    supabaseAdmin
      .from("unit_positions")
      .select("unit_id, position_id"),
    supabaseAdmin
      .from("recruit_language")
      .select("id, language_slug, language_name")
      .order("id", { ascending: true }),
    supabaseAdmin
      .from("employment_types")
      .select("id, type_name, type_code")
      .order("id", { ascending: true }),
  ]);

  if (branchesError) return <div>{branchesError.message}</div>;
  if (departmentsError) return <div>{departmentsError.message}</div>;
  if (branchDepartmentsError) return <div>{branchDepartmentsError.message}</div>;
  if (divisionsError) return <div>{divisionsError.message}</div>;
  if (unitsError) return <div>{unitsError.message}</div>;
  if (positionsError) return <div>{positionsError.message}</div>;
  if (unitPositionsError) return <div>{unitPositionsError.message}</div>;
  if (languagesError) return <div>{languagesError.message}</div>;
  if (emptypeError) return <div>{emptypeError.message}</div>;

  return (
    <JobDescriptionForm
      mode="create"
      branches={branches || []}
      departments={departments || []}
      branchDepartments={branchDepartments || []}
      divisions={divisions || []}
      units={units || []}
      positions={positions || []}
      unitPositions={unitPositions || []}
      languages={languages || []}
      emptype={emptype || []}
    />
  );
}