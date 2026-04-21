import { supabaseAdmin } from "@/lib/supabaseServer";

export async function writeActivityLog({
  user_id = null,
  module_name,
  action_type,
  reference_table = null,
  reference_id = null,
  description = null,
  old_data = null,
  new_data = null,
}) {
  const { error } = await supabaseAdmin.from("activity_logs").insert([
    {
      user_id,
      module_name,
      action_type,
      reference_table,
      reference_id,
      description,
      old_data,
      new_data,
    },
  ]);

  if (error) {
    console.error("WRITE_ACTIVITY_LOG_ERROR:", error);
  }
}