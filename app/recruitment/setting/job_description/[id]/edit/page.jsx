import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseServer";
import JobDescriptionForm from "@/app/recruitment/components/JobDescriptionFormPage";

export default async function EditJobDescriptionPage({ params }) {
  const { id } = await params;

  const [positionsRes, descriptionRes, reqRes, respRes, benRes , lang] = await Promise.all([
    supabaseAdmin
      .from("positions")
      .select("id, position_name, position_level")
      .order("sort_order", { ascending: true }),

    supabaseAdmin
      .from("recruit_job_description")
      .select("id, positions_id, salary_min, salary_max, salary_note, type_of_work, status, updated_at")
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
      .select("id, language_name, language_slug"),
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
        positions={positionsRes.data || []}
        languages={lang.data || []}
        initialData={initialData}
      />
  );
}