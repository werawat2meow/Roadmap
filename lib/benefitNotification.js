import { supabaseAdmin } from "@/lib/supabaseServer";

export async function createNotification({
  employeeId,
  userAccountId,
  title,
  message,
  type,
  refTable = null,
  refId = null,
}) {
  try {
    await supabaseAdmin
      .from("benefit_notifications")
      .insert({
        employee_id: employeeId,
        user_account_id: userAccountId,

        title,
        message,

        notification_type: type,

        ref_table: refTable,
        ref_id: refId,
      });
  } catch (error) {
    console.error(
      "CREATE_NOTIFICATION_ERROR:",
      error
    );
  }
}