import "server-only";
import { formatBangkokTime } from "./report";

export async function loadActivityRows(db, filters, matchingUserIds, { offset = 0, pageSize = 20, snapshot = null } = {}) {
    let query = db.from("recruitment_activity_logs")
      .select("id, created_at, user_id, page_path, action, ip_address, status, resource_type, resource_id", { count: "exact" });
    if (snapshot) query = query.lte("created_at", snapshot);
    if (filters.start) query = query.gte("created_at", filters.start);
    if (filters.end) query = query.lt("created_at", filters.end);
    if (filters.action) query = query.eq("action", filters.action);
    if (filters.status) query = query.eq("status", filters.status);
    if (matchingUserIds) query = query.in("user_id", matchingUserIds);
    if (filters.pagePath) query = query.eq("page_path", filters.pagePath);
    const { data, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + pageSize - 1);
    if (error) throw error;
    const rows = data || [];
    const ids = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
    const users = new Map();
    if (ids.length) {
      const { data: accounts, error: accountError } = await db.from("user_accounts").select("id, username, employee_id").in("id", ids);
      if (accountError) throw accountError;
      const employeeIds = [...new Set((accounts || []).map((account) => account.employee_id).filter(Boolean))];
      const employeeNames = new Map();
      if (employeeIds.length) {
        const { data: employees, error: employeeError } = await db.from("employees")
          .select("id, first_name_th, last_name_th, first_name_en, last_name_en").in("id", employeeIds);
        if (employeeError) throw employeeError;
        for (const employee of employees || []) {
          const thaiName = [employee.first_name_th, employee.last_name_th].map((name) => name?.trim()).filter(Boolean).join(" ");
          const englishName = [employee.first_name_en, employee.last_name_en].map((name) => name?.trim()).filter(Boolean).join(" ");
          employeeNames.set(employee.id, thaiName || englishName || null);
        }
      }
      for (const account of accounts || []) users.set(account.id, { username: account.username, employee_name: employeeNames.get(account.employee_id) || null });
    }
    return { data: rows.map((row) => ({ ...row, username: users.get(row.user_id)?.username || null, employee_name: users.get(row.user_id)?.employee_name || null, created_at_bangkok: formatBangkokTime(row.created_at) })), total: count || 0 };
}
