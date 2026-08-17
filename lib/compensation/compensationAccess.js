import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const SCOPE_KEYS = [
  "company_id",
  "branch_group_id",
  "branch_id",
  "department_id",
  "division_id",
  "unit_id",
];

const EMPLOYEE_SCOPE_SELECT = `
  id,
  employee_code,
  first_name_th,
  last_name_th,
  first_name_en,
  last_name_en,
  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,
  position_id,
  position_level_id,
  position_level_band_id,
  payroll_company_id,
  payroll_type_id,
  payroll_group_id
`;

export function getActorUserAccountId(guard) {
  return (
    guard?.access?.user_account_id ||
    guard?.access?.id ||
    guard?.user?.user_account_id ||
    guard?.user?.id ||
    null
  );
}

export function getActorRoleId(guard) {
  return (
    guard?.access?.primary_access_role_id ||
    guard?.access?.role_id ||
    guard?.user?.role_id ||
    null
  );
}

function isActiveScope(scope) {
  if (!scope) return false;
  return !scope.status || scope.status === "active";
}

function assignmentHasExplicitScope(assignment) {
  const scopes = Array.isArray(assignment?.scopes)
    ? assignment.scopes
    : [];

  return scopes.some((scope) => {
    if (!isActiveScope(scope)) return false;
    if (scope.scope_type === "all") return true;
    return SCOPE_KEYS.some((key) => Boolean(scope?.[key]));
  });
}

export function guardHasExplicitScope(guard) {
  if (guard?.hasAllScope) return true;

  const assignments = Array.isArray(guard?.relevantAssignments)
    ? guard.relevantAssignments
    : [];

  return assignments.some(assignmentHasExplicitScope);
}

export async function requireCompensationAccess(action) {
  return requireScopedAccess(
    "ems.employee_compensations",
    action,
    {
      lineageScope: true,
    }
  );
}

function applyEmployeeFilters(query, filters = {}) {
  const {
    search,
    employeeId,
    companyId,
    branchGroupId,
    branchId,
    departmentId,
    divisionId,
    unitId,
    positionId,
    positionLevelId,
  } = filters;

  if (employeeId) {
    query = query.eq("id", employeeId);
  }

  if (companyId) query = query.eq("company_id", companyId);
  if (branchGroupId) query = query.eq("branch_group_id", branchGroupId);
  if (branchId) query = query.eq("branch_id", branchId);
  if (departmentId) query = query.eq("department_id", departmentId);
  if (divisionId) query = query.eq("division_id", divisionId);
  if (unitId) query = query.eq("unit_id", unitId);
  if (positionId) query = query.eq("position_id", positionId);
  if (positionLevelId) query = query.eq("position_level_id", positionLevelId);

  const cleanSearch = String(search || "").trim();
  if (cleanSearch) {
    query = query.or(
      [
        `employee_code.ilike.%${cleanSearch}%`,
        `first_name_th.ilike.%${cleanSearch}%`,
        `last_name_th.ilike.%${cleanSearch}%`,
        `first_name_en.ilike.%${cleanSearch}%`,
        `last_name_en.ilike.%${cleanSearch}%`,
      ].join(",")
    );
  }

  return query;
}

/**
 * Return null = unrestricted by employee IDs (Permission-only / all scope)
 * Return []   = scoped/filtered but no employee matches
 * Return [id] = filter compensation query with employee_id IN (...)
 */
export async function resolveAccessibleEmployeeIds(
  guard,
  filters = {}
) {
  const hasExplicitScope = guardHasExplicitScope(guard);
  const hasEmployeeFilters = Boolean(
    filters.search ||
      filters.employeeId ||
      filters.companyId ||
      filters.branchGroupId ||
      filters.branchId ||
      filters.departmentId ||
      filters.divisionId ||
      filters.unitId ||
      filters.positionId ||
      filters.positionLevelId
  );

  if (!hasExplicitScope && !hasEmployeeFilters) {
    return null;
  }

  const ids = [];
  const batchSize = 1000;
  let from = 0;

  while (true) {
    let query = supabaseAdmin
      .from("employees")
      .select("id")
      .order("id", { ascending: true })
      .range(from, from + batchSize - 1);

    query = applyEmployeeFilters(query, filters);

    if (hasExplicitScope && !guard?.hasAllScope) {
      query = guard.applyEmployeeScope(query);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    ids.push(...rows.map((row) => row.id).filter(Boolean));

    if (rows.length < batchSize) break;
    from += batchSize;
  }

  return [...new Set(ids.map(String))];
}

export async function loadEmployeeForCompensation(employeeId) {
  if (!employeeId) return null;

  const { data, error } = await supabaseAdmin
    .from("employees")
    .select(EMPLOYEE_SCOPE_SELECT)
    .eq("id", employeeId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function ensureEmployeeAccessible(guard, employeeId) {
  const employee = await loadEmployeeForCompensation(employeeId);

  if (!employee) {
    return {
      ok: false,
      status: 404,
      error: "ไม่พบพนักงานที่ระบุ",
      employee: null,
    };
  }

  const hasExplicitScope = guardHasExplicitScope(guard);

  if (
    hasExplicitScope &&
    !guard?.hasAllScope &&
    typeof guard?.canAccessEmployee === "function" &&
    !guard.canAccessEmployee(employee)
  ) {
    return {
      ok: false,
      status: 403,
      error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลค่าตอบแทนของพนักงานรายนี้",
      employee,
    };
  }

  return {
    ok: true,
    status: 200,
    employee,
  };
}
