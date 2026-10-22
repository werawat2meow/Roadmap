import { NextResponse } from "next/server";
import { db, gate, safeError, authorizedEmployee } from "@/lib/employeeMovements";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function GET(req) {
  try {
    const access = await gate(req, "view");
    if (access.response) return access.response;
    const employeeId = new URL(req.url).searchParams.get("employee_id");
    if (!employeeId || !UUID.test(employeeId)) {
      return NextResponse.json({ success: false, error: "Invalid employee ID" }, { status: 400 });
    }
    if (!(await authorizedEmployee(access.guard, employeeId))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    const { data, error } = await db.from("employee_status_change_history")
      .select("id,old_status_id,new_status_id,effective_date,reason,actor_user_account_id,change_source,changed_at")
      .eq("employee_id", employeeId).order("changed_at", { ascending: false }).limit(100);
    if (error) throw error;
    const ids = [...new Set((data || []).flatMap(x => [x.old_status_id, x.new_status_id]).filter(Boolean))];
    let byId = {};
    if (ids.length) {
      const result = await db.from("employee_statuses").select("id,status_code,status_name").in("id", ids);
      if (result.error) throw result.error;
      byId = Object.fromEntries((result.data || []).map(x => [x.id, x]));
    }
    return NextResponse.json({ success: true, data: (data || []).map(x => ({
      ...x, old_status_name: byId[x.old_status_id]?.status_name || "-",
      new_status_name: byId[x.new_status_id]?.status_name || "-",
    })) });
  } catch (error) { return safeError(error); }
}
