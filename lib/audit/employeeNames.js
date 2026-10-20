import { supabaseAdmin } from "@/lib/supabaseServer";

// Enrich audit responses with employee names; never mutate stored audit history.
export async function attachAuditEmployeeNames(rows = []) {
  if (!rows.length) return rows;

  const accountIds = [...new Set(rows
    .filter((row) => !row.employee_id && row.user_account_id)
    .map((row) => row.user_account_id))];
  const employeeByAccount = new Map();

  for (let i = 0; i < accountIds.length; i += 200) {
    const { data, error } = await supabaseAdmin
      .from("user_accounts")
      .select("id,employee_id")
      .in("id", accountIds.slice(i, i + 200));
    if (error) throw new Error(`ไม่สามารถค้นหาบัญชีพนักงาน: ${error.message}`);
    for (const account of data || []) {
      if (account.employee_id) employeeByAccount.set(account.id, account.employee_id);
    }
  }

  const employeeIds = [...new Set(rows.map((row) =>
    row.employee_id || employeeByAccount.get(row.user_account_id)).filter(Boolean))];
  const employeeNames = new Map();
  for (let i = 0; i < employeeIds.length; i += 200) {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("id,first_name_th,last_name_th")
      .in("id", employeeIds.slice(i, i + 200));
    if (error) throw new Error(`ไม่สามารถค้นหาชื่อพนักงาน: ${error.message}`);
    for (const employee of data || []) {
      const fullName = [employee.first_name_th, employee.last_name_th]
        .filter(Boolean).map((value) => String(value).trim()).join(" ").trim();
      if (fullName) employeeNames.set(employee.id, fullName);
    }
  }

  return rows.map((row) => ({
    ...row,
    employee_full_name: employeeNames.get(
      row.employee_id || employeeByAccount.get(row.user_account_id)
    ) || null,
  }));
}
