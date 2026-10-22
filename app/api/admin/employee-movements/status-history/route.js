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
    // Resolve audit actor IDs to human-readable usernames and employee names.
    // Fetch only actors appearing in this employee's authorized history.
    const actorIds = [...new Set((data || [])
      .map((entry) => entry.actor_user_account_id)
      .filter((id) => id && UUID.test(id)))];
    const actorsById = {};
    if (actorIds.length) {
      const accounts = await db.from("user_accounts")
        .select("id,username,employee_id")
        .in("id", actorIds);
      if (accounts.error) throw accounts.error;

      const actorEmployeeIds = [...new Set((accounts.data || [])
        .map((account) => account.employee_id).filter(Boolean))];
      const employeeNamesById = {};
      if (actorEmployeeIds.length) {
        const employees = await db.from("employees")
          .select("id,first_name_th,last_name_th")
          .in("id", actorEmployeeIds);
        if (employees.error) throw employees.error;
        for (const employee of employees.data || []) {
          employeeNamesById[employee.id] = [employee.first_name_th, employee.last_name_th]
            .filter(Boolean).join(" ").trim();
        }
      }
      for (const account of accounts.data || []) {
        const fullName = employeeNamesById[account.employee_id] || "";
        actorsById[account.id] = {
          username: account.username || "",
          displayName: fullName || account.username || "",
        };
      }
    }
    return NextResponse.json({ success: true, data: (data || []).map(x => ({
      ...x,
      actor_username: actorsById[x.actor_user_account_id]?.username || "",
      actor_display_name: actorsById[x.actor_user_account_id]?.displayName || "",
      old_status_name: byId[x.old_status_id]?.status_name || "-",
      new_status_name: byId[x.new_status_id]?.status_name || "-",
    })) });
  } catch (error) { return safeError(error); }
}
