import { NextResponse } from "next/server";
import { db, safeError } from "@/lib/employeeMovements";
import { movementSharedViewGate } from "@/lib/employeeMovementAuditAccess";

// Scope-aware, lazy-load employee picker; 20 records per search.
export async function GET(req) {
  try {
    const access = await movementSharedViewGate(req);
    if (access.response) return access.response;

    const params = new URL(req.url).searchParams;
    const search = String(params.get("search") || "")
      .trim().slice(0, 100).replace(/[,()%*]/g, " ").trim();
    const pageSize = 20;

    let query = db.from("employees")
      .select("id,employee_code,first_name_th,last_name_th")
      .eq("is_deleted", false)
      .order("employee_code", { ascending: true })
      .limit(pageSize);

    if (!access.guard.hasAllScope) {
      if (typeof access.guard.applyEmployeeScope !== "function") {
        return NextResponse.json({ success: false, error: "Employee Scope unavailable" }, { status: 403 });
      }
      query = access.guard.applyEmployeeScope(query);
    }

    if (search) {
      query = query.or([
        `employee_code.ilike.%${search}%`,
        `first_name_th.ilike.%${search}%`,
        `last_name_th.ilike.%${search}%`,
      ].join(","));
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return safeError(error);
  }
}
