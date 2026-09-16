import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { MANAGEMENT_LEVELS } from "@/lib/managementAssignments";

import {
  MODULE_CODE,
  EMPLOYEE_SCOPE_SELECT,
  BUSINESS_STRUCTURE_SELECT_FIELDS,
  createActionGuard,
  jsonError,
  cleanText,
  loadEmployeeById,
  assertEmployeeInScope,
  normalizeAssignmentInput,
  validateAssignmentInput,
  assertManagementScopesAllowed,
  validateSupervisorRelationship,
  validateEmployeeLevel,
  buildAssignmentPayload,
  buildScopeRows,
  readAssignmentById,
  mapBusinessStructureRow,
  getDatabaseErrorStatus,
} from "./_helpers";

const MAX_ROWS = 5000;
const DEFAULT_PAGE_SIZE = 20;

function matchesSearch(item, search) {
  if (!search) return true;

  const haystacks = [
    item.employee_code,
    item.employee_name,
    item.position_code,
    item.position_name,
    item.job_code,
    item.job_name,
    item.management_level,
    item.supervisor_name,
    item.company_name,
    item.branch_group_name,
    item.branch_name,
    item.department_name,
    item.division_name,
    item.unit_name,
    ...(Array.isArray(item.scopes)
      ? item.scopes.flatMap((scope) => [
          scope.scope_type,
          scope.company_name,
          scope.branch_group_name,
          scope.branch_name,
          scope.department_name,
          scope.division_name,
          scope.unit_name,
        ])
      : []),
  ];

  return haystacks
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(search));
}

function matchesScopeType(item, scopeType) {
  if (!scopeType) return true;

  if (Array.isArray(item.scopes) && item.scopes.length) {
    return item.scopes.some((scope) => scope.scope_type === scopeType);
  }

  return item.scope_type === scopeType;
}

function buildSummary(rows) {
  const summary = {
    total: rows.length,
    active: 0,
    inactive: 0,
    P12: 0,
    P11: 0,
    P10: 0,
    P9: 0,
  };

  for (const row of rows) {
    if (row.status === "active") summary.active += 1;
    else summary.inactive += 1;

    if (MANAGEMENT_LEVELS.includes(row.management_level)) {
      summary[row.management_level] += 1;
    }
  }

  return summary;
}

export async function GET(req) {
  try {
    const guard = await createActionGuard("view", "employee");
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);

    const search = cleanText(searchParams.get("search")).toLowerCase();
    const managementLevel = cleanText(
      searchParams.get("management_level")
    ).toUpperCase();
    const scopeType = cleanText(searchParams.get("scope_type"));
    const status = cleanText(searchParams.get("status"));

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE), 1),
      100
    );

    let employeeQuery = supabaseAdmin
      .from("employees")
      .select(EMPLOYEE_SCOPE_SELECT)
      .limit(MAX_ROWS);

    employeeQuery = guard.applyEmployeeScope(employeeQuery);

    const { data: scopedEmployees, error: employeeError } = await employeeQuery;
    if (employeeError) throw employeeError;

    const employeeRows = scopedEmployees || [];
    const employeeIds = employeeRows.map((item) => item.id).filter(Boolean);

    if (!employeeIds.length) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        summary: buildSummary([]),
      });
    }

    let query = supabaseAdmin
      .from("management_assignments")
      .select(BUSINESS_STRUCTURE_SELECT_FIELDS)
      .in("employee_id", employeeIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(MAX_ROWS);

    if (managementLevel) {
      query = query.eq("management_level", managementLevel);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const employeeMap = new Map(employeeRows.map((item) => [item.id, item]));

    let rows = (data || [])
      .map((item) =>
        mapBusinessStructureRow(item, employeeMap.get(item.employee_id) || null)
      )
      .filter((item) => MANAGEMENT_LEVELS.includes(item.management_level));

    if (scopeType) {
      rows = rows.filter((item) => matchesScopeType(item, scopeType));
    }

    if (search) {
      rows = rows.filter((item) => matchesSearch(item, search));
    }

    const summary = buildSummary(rows);
    const total = rows.length;
    const totalPages = total ? Math.ceil(total / pageSize) : 0;
    const start = (page - 1) * pageSize;
    const pagedRows = rows.slice(start, start + pageSize);

    return NextResponse.json({
      success: true,
      data: pagedRows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      summary,
    });
  } catch (error) {
    console.error("GET_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", error);
    return jsonError(
      error?.message || "ไม่สามารถโหลดโครงสร้างบริหารพนักงานได้",
      500
    );
  }
}

export async function POST(req) {
  let createdAssignmentId = null;

  try {
    const guard = await createActionGuard("create", "employee");
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const input = normalizeAssignmentInput(body);

    const basicError = validateAssignmentInput(input);
    if (basicError) return jsonError(basicError, 400);

    const employee = await loadEmployeeById(input.employeeId);
    const employeeScopeError = assertEmployeeInScope(
      guard,
      employee,
      "คุณไม่มีสิทธิ์เพิ่มโครงสร้างบริหารให้พนักงานรายนี้"
    );
    if (employeeScopeError) return employeeScopeError;

    const levelError = await validateEmployeeLevel(
      employee,
      input.managementLevel
    );
    if (levelError) return jsonError(levelError, 400);

    const scopeAccessError = await assertManagementScopesAllowed(
      "create",
      input.scopes
    );
    if (scopeAccessError) return scopeAccessError;

    const supervisorError = await validateSupervisorRelationship(input);
    if (supervisorError) return jsonError(supervisorError, 400);

    const { data: existingAssignment, error: existingError } = await supabaseAdmin
      .from("management_assignments")
      .select("id")
      .eq("employee_id", input.employeeId)
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingAssignment) {
      return jsonError("พนักงานคนนี้มีโครงสร้างบริหารอยู่แล้ว", 409);
    }

    const assignmentPayload = buildAssignmentPayload(input);

    const { data: created, error: createError } = await supabaseAdmin
      .from("management_assignments")
      .insert([assignmentPayload])
      .select("id")
      .single();

    if (createError) throw createError;

    createdAssignmentId = created.id;

    const scopeRows = buildScopeRows(createdAssignmentId, input.scopes);
    const { error: scopeError } = await supabaseAdmin
      .from("management_assignment_scopes")
      .insert(scopeRows);

    if (scopeError) throw scopeError;

    const raw = await readAssignmentById(createdAssignmentId);
    const mapped = mapBusinessStructureRow(raw, employee);

    await writeActivityLog({
      module_name: "employee_business_structure",
      action_type: "create",
      reference_table: "management_assignments",
      reference_id: createdAssignmentId,
      description: `เพิ่มโครงสร้างบริหาร ${mapped.employee_name}`,
      new_data: mapped,
    });

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มโครงสร้างบริหารพนักงานเรียบร้อยแล้ว",
        data: mapped,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", error);

    if (createdAssignmentId) {
      const { error: rollbackError } = await supabaseAdmin
        .from("management_assignments")
        .delete()
        .eq("id", createdAssignmentId);

      if (rollbackError) {
        console.error("ROLLBACK_EMPLOYEE_BUSINESS_STRUCTURE_ERROR:", rollbackError);
      }
    }

    return jsonError(
      error?.message || "ไม่สามารถเพิ่มโครงสร้างบริหารพนักงานได้",
      getDatabaseErrorStatus(error)
    );
  }
}
