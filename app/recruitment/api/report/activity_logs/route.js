import { supabaseAdmin } from "@/lib/supabaseServer";
import { getAuthenticatedUser } from "@/lib/auth/getAuthenticatedUser";
import { parseActivityFilters } from "../../../lib/activity/report";
import { findActivityUserIds } from "../../../lib/activity/reportUserSearch";

import { loadActivityRows } from "../../../lib/activity/reportData";

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
    const result = await loadActivityRows(supabaseAdmin, filters, matchingUserIds, { offset: (filters.page - 1) * filters.pageSize, pageSize: filters.pageSize });
    return json({ success: true, ...result, page: filters.page, pageSize: filters.pageSize, timezone: "Asia/Bangkok" });
  } catch (error) {
    console.error("RECRUITMENT_ACTIVITY_REPORT_FAILED", { code: error?.code || "REPORT_ERROR" });
    return json({ success: false, message: "ไม่สามารถโหลดรายงานกิจกรรมได้ กรุณาลองใหม่" }, 500);
  }
}
