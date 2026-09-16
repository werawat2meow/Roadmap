import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { MANAGEMENT_LEVELS } from "@/lib/managementAssignments";

import {
  EMPLOYEE_SCOPE_SELECT,
  createActionGuard,
  jsonError,
  cleanText,
  mapEmployeeOption,
} from "../_helpers";

const DEFAULT_PAGE_SIZE = 20;
const MAX_ROWS = 5000;
const ALLOWED_ACTIONS = ["view", "create", "edit"];

function matchesSearch(item, search) {
  if (!search) return true;

  return [
    item.employee_code,
    item.employee_name,
    item.position_code,
    item.position_name,
    item.job_code,
    item.job_name,
    item.management_level,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(search));
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const requestedAction = cleanText(searchParams.get("action"));
    const action = ALLOWED_ACTIONS.includes(requestedAction)
      ? requestedAction
      : "view";

    const guard = await createActionGuard(action, "employee");
    if (!guard.ok) return guard.response;

    const search = cleanText(searchParams.get("search")).toLowerCase();
    const managementLevel = cleanText(
      searchParams.get("management_level")
    ).toUpperCase();
    const excludeId = cleanText(searchParams.get("exclude_employee_id"));
    const managementOnly = searchParams.get("management_only") !== "false";
    const availableOnly = searchParams.get("available_only") === "true";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE), 1),
      100
    );

    let query = supabaseAdmin
      .from("employees")
      .select(EMPLOYEE_SCOPE_SELECT)
      .eq("status", "active")
      .order("employee_code", { ascending: true })
      .limit(MAX_ROWS);

    query = guard.applyEmployeeScope(query);

    const { data, error } = await query;
    if (error) throw error;

    let rows = (data || []).map(mapEmployeeOption);

    if (managementOnly) {
      rows = rows.filter((item) => MANAGEMENT_LEVELS.includes(item.management_level));
    }

    if (managementLevel) {
      rows = rows.filter((item) => item.management_level === managementLevel);
    }

    if (excludeId) {
      rows = rows.filter((item) => String(item.id) !== String(excludeId));
    }

    if (availableOnly && rows.length) {
      const { data: assignedRows, error: assignedError } = await supabaseAdmin
        .from("management_assignments")
        .select("employee_id")
        .limit(MAX_ROWS);

      if (assignedError) throw assignedError;

      const assignedIds = new Set(
        (assignedRows || []).map((item) => String(item.employee_id))
      );

      rows = rows.filter((item) => !assignedIds.has(String(item.id)));
    }

    if (search) {
      rows = rows.filter((item) => matchesSearch(item, search));
    }

    const total = rows.length;
    const totalPages = total ? Math.ceil(total / pageSize) : 0;
    const start = (page - 1) * pageSize;

    return NextResponse.json({
      success: true,
      data: rows.slice(start, start + pageSize),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("EMPLOYEE_BUSINESS_STRUCTURE_EMPLOYEES_ERROR:", error);
    return jsonError(
      error?.message || "ไม่สามารถโหลดรายชื่อพนักงานได้",
      500
    );
  }
}
