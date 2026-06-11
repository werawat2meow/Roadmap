import { supabaseAdmin } from "@/lib/supabaseServer";
import JobDescriptionForm from "@/app/recruitment/components/JobDescriptionFormPage";

export default async function NewJobDescriptionPage() {
  const { data: positions, error } = await supabaseAdmin
    .from("positions")
    .select("id, position_name, position_level");

  if (error) {
    return <div className="p-6 text-red-600">{error.message}</div>;
  }

  return (
    <JobDescriptionForm mode="create" positions={positions || []} />
  );
}