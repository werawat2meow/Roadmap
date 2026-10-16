import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { formatBangkokTime, parseActivityFilters } from "../../../lib/activity/report";
import { findActivityUserIds } from "../../../lib/activity/reportUserSearch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth?.user || auth.error) return json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, 401);
    // Report-specific permissions are intentionally left for the project owner.
    let filters;
    try { filters = parseActivityFilters(new URL(request.url).searchParams); }
    catch (error) { return json({ success: false, message: error.message }, 400); }
    const matchingUserIds = filters.userSearch ? await findActivityUserIds(supabaseAdmin, filters.userSearch) : null;
    if (matchingUserIds && !matchingUserIds.length) {
      return json({ success: true, data: [], total: 0, page: filters.page, pageSize: filters.pageSize, timezone: "Asia/Bangkok" });
    }
    let query = supabaseAdmin.from("recruitment_activity_logs")
      .select("id, created_at, user_id, page_path, action, ip_address, status, resource_type, resource_id", { count: "exact" });
    if (filters.start) query = query.gte("created_at", filters.start);
    if (filters.end) query = query.lt("created_at", filters.end);
    if (filters.action) query = query.eq("action", filters.action);
    if (filters.status) query = query.eq("status", filters.status);
    if (matchingUserIds) query = query.in("user_id", matchingUserIds);
    if (filters.pagePath) query = query.eq("page_path", filters.pagePath);
    const offset = (filters.page - 1) * filters.pageSize;
    const { data, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + filters.pageSize - 1);
    if (error) throw error;
    const rows = data || [];
    const ids = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
    const users = new Map();
    if (ids.length) {
      const { data: accounts, error: accountError } = await supabaseAdmin.from("user_accounts").select("id, username, employee_id").in("id", ids);
      if (accountError) throw accountError;
      const employeeIds = [...new Set((accounts || []).map((account) => account.employee_id).filter(Boolean))];
      const employeeNames = new Map();
      if (employeeIds.length) {
        const { data: employees, error: employeeError } = await supabaseAdmin.from("employees")
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
    return json({ success: true, data: rows.map((row) => ({ ...row, username: users.get(row.user_id)?.username || null, employee_name: users.get(row.user_id)?.employee_name || null, created_at_bangkok: formatBangkokTime(row.created_at) })), total: count || 0, page: filters.page, pageSize: filters.pageSize, timezone: "Asia/Bangkok" });
  } catch (error) {
    console.error("RECRUITMENT_ACTIVITY_REPORT_FAILED", { code: error?.code || "REPORT_ERROR" });
    return json({ success: false, message: "ไม่สามารถโหลดรายงานกิจกรรมได้ กรุณาลองใหม่" }, 500);
  }
}
