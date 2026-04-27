import { supabaseAdmin } from "@/lib/supabaseServer";

export async function logActivity({
  userId = null,
  moduleName,
  actionType,
  referenceTable = null,
  referenceId = null,
  description = null,
  oldData = null,
  newData = null,
}) {
  try {
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      module_name: moduleName,
      action_type: actionType,
      reference_table: referenceTable,
      reference_id: referenceId,
      description,
      old_data: oldData,
      new_data: newData,
    });
  } catch (error) {
    console.error("logActivity error:", error);
  }
}