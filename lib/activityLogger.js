import { supabaseAdmin } from "@/lib/supabaseServer";
import { redactAudit, getAuditRequestContext } from "@/lib/audit/logger";

export async function writeActivityLog({
  user_id = null,
  module_name,
  action_type,
  reference_table = null,
  reference_id = null,
  description = null,
  old_data = null,
  new_data = null,
  // Optional context for Enterprise audit; existing callers need no changes.
  actor = null,
  request = null,
  system_code = null,
  event_status = null,
  severity = null,
  scope_snapshot = null,
}) {
  const { error } = await supabaseAdmin.from("activity_logs").insert([
    {
      user_id,
      module_name,
      action_type,
      reference_table,
      reference_id,
      description,
      old_data: redactAudit(old_data),
      new_data: redactAudit(new_data),
      ...(actor?.user_account_id ? { user_account_id: actor.user_account_id } : {}),
      ...(actor?.employee_id ? { employee_id: actor.employee_id } : {}),
      ...(actor?.username ? { username: actor.username } : {}),
      ...(actor?.role_code ? { role_code: actor.role_code } : {}),
      ...(system_code ? { system_code } : {}),
      ...(event_status ? { event_status } : {}),
      ...(severity ? { severity } : {}),
      ...(scope_snapshot ? { scope_snapshot: redactAudit(scope_snapshot) } : {}),
      ...(request ? getAuditRequestContext(request) : {}),
    },
  ]);

  if (error) {
    console.error("WRITE_ACTIVITY_LOG_ERROR:", error);
  }
}