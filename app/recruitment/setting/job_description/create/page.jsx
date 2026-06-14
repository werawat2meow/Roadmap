import { supabaseAdmin } from "@/lib/supabaseServer";
import JobDescriptionForm from "@/app/recruitment/components/JobDescriptionFormPage";

export default async function NewJobDescriptionPage() {
  const [
    { data: positions, error: positionsError },
    { data: languages, error: languagesError },
  ] = await Promise.all([
    supabaseAdmin
      .from("positions")
      .select("id, position_name, position_level"),

    supabaseAdmin
      .from("recruit_language")
      .select("language_slug, language_name")
      .order("id", { ascending: true }),
  ]);

  if (positionsError) {
    return <div className="p-6 text-red-600">{positionsError.message}</div>;
  }

  if (languagesError) {
    return <div className="p-6 text-red-600">{languagesError.message}</div>;
  }

  return (
    <JobDescriptionForm mode="create" positions={positions || []} languages={languages || []} />
  );
}