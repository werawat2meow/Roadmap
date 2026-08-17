import { supabaseAdmin } from "@/lib/supabaseServer";

const EMPLOYEE_BATCH_SIZE = 1000;
const ACCOUNT_BATCH_SIZE = 250;

const ORG_SCOPE_TYPES = new Set([
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
]);

const DASHBOARD_EMPLOYEE_SELECT = `
  id,
  employee_code,
  first_name_th,
  middle_name_th,
  last_name_th,
  first_name_en,
  middle_name_en,
  last_name_en,
  nickname_th,
  nickname_en,
  email,
  work_email,
  phone,
  start_work_date,
  hire_date,
  resignation_date,
  probation_status,
  status,
  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,
  employment_type_id,
  position_family_id,
  position_level_id,
  position_id,
  job_id,
  business_unit_id,
  cost_center_id,
  profit_center_id,
  payroll_company_id,
  payroll_type_id,
  payroll_group_id,
  employee_status_id,
  companies:companies!employees_company_id_fkey (
    id,
    company_code,
    company_name_th,
    company_name_en
  ),
  branch_groups:branch_groups!employees_branch_group_id_fkey (
    id,
    group_code,
    group_name
  ),
  branches:branches!employees_branch_id_fkey (
    id,
    branch_code,
    branch_name
  ),
  departments:departments!employees_department_id_fkey (
    id,
    department_code,
    department_name
  ),
  divisions:divisions!employees_division_id_fkey (
    id,
    division_code,
    division_name
  ),
  units:units!employees_unit_id_fkey (
    id,
    unit_code,
    unit_name
  ),
  employment_types:employment_types!employees_employment_type_id_fkey (
    id,
    type_code,
    type_name
  ),
  position_families:position_families!employees_position_family_id_fkey (
    id,
    family_code,
    family_name
  ),
  position_levels:position_levels!employees_position_level_id_fkey (
    id,
    level_code,
    level_name,
    sort_order
  ),
  positions:positions!employees_position_id_fkey (
    id,
    position_code,
    position_name
  ),
  employee_statuses:employee_statuses!employees_employee_status_id_fkey (
    id,
    status_code,
    status_name,
    color,
    is_working,
    is_payroll,
    is_benefit,
    is_headcount
  )
`;

function uniqueStrings(values = []) {
  return Array.from(
    new Set(
      values
        .filter(Boolean)
        .map((value) => String(value))
    )
  );
}

function chunk(values = [], size = 250) {
  const result = [];

  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }

  return result;
}

function hasExplicitOrganizationScope(guard) {
  if (guard?.hasAllScope) {
    return false;
  }

  const assignments = Array.isArray(guard?.relevantAssignments)
    ? guard.relevantAssignments
    : [];

  return assignments.some((assignment) =>
    (Array.isArray(assignment?.scopes) ? assignment.scopes : []).some(
      (scope) =>
        scope?.status !== "inactive" &&
        ORG_SCOPE_TYPES.has(scope?.scope_type)
    )
  );
}

function getCurrentEmployeeId(guard) {
  return (
    guard?.access?.employee_id ||
    guard?.user?.employee_id ||
    guard?.currentUser?.employee_id ||
    null
  );
}

function getFullName(employee) {
  const th = [
    employee?.first_name_th,
    employee?.middle_name_th,
    employee?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (th) return th;

  const en = [
    employee?.first_name_en,
    employee?.middle_name_en,
    employee?.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return en || employee?.employee_code || "-";
}

function getStartDate(employee) {
  return employee?.start_work_date || employee?.hire_date || null;
}

function isSameMonth(dateValue, referenceDate) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  return (
    date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    date.getUTCMonth() === referenceDate.getUTCMonth()
  );
}

function isSameYear(dateValue, referenceDate) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  return date.getUTCFullYear() === referenceDate.getUTCFullYear();
}

function distribution(rows, {
  idGetter,
  labelGetter,
  limit = 8,
} = {}) {
  const map = new Map();

  for (const row of rows) {
    const rawId = idGetter?.(row) || "__UNSPECIFIED__";
    const id = String(rawId);
    const label = labelGetter?.(row) || "ไม่ระบุ";

    if (!map.has(id)) {
      map.set(id, {
        id,
        label,
        count: 0,
      });
    }

    map.get(id).count += 1;
  }

  return Array.from(map.values())
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return String(a.label).localeCompare(String(b.label), "th");
    })
    .slice(0, limit);
}

function statusDistribution(rows) {
  const map = new Map();

  for (const row of rows) {
    const status = row?.employee_statuses;
    const id = String(status?.id || row?.employee_status_id || row?.status || "unknown");
    const label =
      status?.status_name ||
      status?.status_code ||
      row?.status ||
      "ไม่ระบุสถานะ";

    if (!map.has(id)) {
      map.set(id, {
        id,
        label,
        status_code: status?.status_code || null,
        color: status?.color || "slate",
        count: 0,
      });
    }

    map.get(id).count += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function percent(value, total) {
  if (!total) return 0;
  return Math.round((Number(value || 0) / Number(total)) * 1000) / 10;
}

async function fetchVisibleEmployees(guard) {
  const scoped = hasExplicitOrganizationScope(guard);
  const currentEmployeeId = getCurrentEmployeeId(guard);
  const rows = [];

  for (let page = 0; ; page += 1) {
    const from = page * EMPLOYEE_BATCH_SIZE;
    const to = from + EMPLOYEE_BATCH_SIZE - 1;

    let query = supabaseAdmin
      .from("employees")
      .select(DASHBOARD_EMPLOYEE_SELECT)
      .order("id", { ascending: true })
      .range(from, to);

    if (scoped && typeof guard?.applyEmployeeScope === "function") {
      query = guard.applyEmployeeScope(query);
    }

    const { data, error } = await query;

    if (error) throw error;

    const batch = Array.isArray(data) ? data : [];
    rows.push(...batch);

    if (batch.length < EMPLOYEE_BATCH_SIZE) {
      break;
    }
  }

  // Enterprise policy ของ Employee Master:
  // ผู้ใช้ที่มี ems.employees.view ต้องเห็น record ของตัวเองเสมอ
  // แม้ Employee record ปัจจุบันอยู่นอก Scope จากการย้ายงาน/ข้อมูลกำลัง Sync
  if (
    currentEmployeeId &&
    !rows.some((row) => String(row.id) === String(currentEmployeeId))
  ) {
    const { data: selfRow, error: selfError } = await supabaseAdmin
      .from("employees")
      .select(DASHBOARD_EMPLOYEE_SELECT)
      .eq("id", currentEmployeeId)
      .maybeSingle();

    if (selfError) throw selfError;
    if (selfRow) rows.push(selfRow);
  }

  return {
    rows,
    scopeMode: guard?.hasAllScope
      ? "all"
      : scoped
        ? "scoped"
        : "permission",
    currentEmployeeId,
  };
}

async function fetchUserAccounts(employeeIds = []) {
  const ids = uniqueStrings(employeeIds);
  const result = [];

  for (const group of chunk(ids, ACCOUNT_BATCH_SIZE)) {
    if (!group.length) continue;

    const { data, error } = await supabaseAdmin
      .from("user_accounts")
      .select("id, employee_id, is_active")
      .in("employee_id", group);

    if (error) throw error;
    result.push(...(data || []));
  }

  return result;
}

function getScopeAssignmentSummary(guard) {
  const assignments = Array.isArray(guard?.relevantAssignments)
    ? guard.relevantAssignments
    : [];

  const summary = {
    assignment_count: assignments.length,
    company: new Set(),
    branch_group: new Set(),
    branch: new Set(),
    department: new Set(),
    division: new Set(),
    unit: new Set(),
  };

  for (const assignment of assignments) {
    for (const scope of Array.isArray(assignment?.scopes) ? assignment.scopes : []) {
      if (scope?.status === "inactive") continue;

      const type = scope?.scope_type;
      if (!ORG_SCOPE_TYPES.has(type)) continue;

      const id = scope?.[`${type}_id`];
      if (id && summary[type]) summary[type].add(String(id));
    }
  }

  return {
    assignment_count: summary.assignment_count,
    company: summary.company.size,
    branch_group: summary.branch_group.size,
    branch: summary.branch.size,
    department: summary.department.size,
    division: summary.division.size,
    unit: summary.unit.size,
  };
}

export function hasDashboardPermission(guard, permissionCode) {
  if (!guard) return false;
  if (guard?.access?.is_super_admin || guard?.is_super_admin) return true;

  const permissions =
    guard?.access?.permissions ||
    guard?.permissions ||
    guard?.user?.permissions ||
    [];

  return Array.isArray(permissions) && permissions.includes(permissionCode);
}

export async function buildEmployeeMasterDashboard(guard) {
  const generatedAt = new Date();
  const { rows: employees, scopeMode } = await fetchVisibleEmployees(guard);
  const employeeIds = employees.map((row) => row.id).filter(Boolean);
  const userAccounts = await fetchUserAccounts(employeeIds);
  const activeAccountEmployeeIds = new Set(
    userAccounts
      .filter((item) => item?.is_active !== false)
      .map((item) => String(item.employee_id))
  );

  const total = employees.length;

  const working = employees.filter((employee) =>
    employee?.employee_statuses?.is_working === true
  ).length;

  const headcount = employees.filter((employee) =>
    employee?.employee_statuses?.is_headcount === true
  ).length;

  const probation = employees.filter((employee) => {
    const statusCode = String(employee?.employee_statuses?.status_code || "").toUpperCase();
    const probationStatus = String(employee?.probation_status || "").toLowerCase();
    return statusCode === "PROBATION" || probationStatus === "probation";
  }).length;

  const newThisMonth = employees.filter((employee) =>
    isSameMonth(getStartDate(employee), generatedAt)
  ).length;

  const newThisYear = employees.filter((employee) =>
    isSameYear(getStartDate(employee), generatedAt)
  ).length;

  const resignedThisMonth = employees.filter((employee) =>
    isSameMonth(employee?.resignation_date, generatedAt)
  ).length;

  const resignedThisYear = employees.filter((employee) =>
    isSameYear(employee?.resignation_date, generatedAt)
  ).length;

  const accountCoverage = employees.filter((employee) =>
    activeAccountEmployeeIds.has(String(employee.id))
  ).length;

  const organizationComplete = employees.filter((employee) =>
    employee?.company_id && employee?.branch_id && employee?.department_id
  ).length;

  const jobArchitectureComplete = employees.filter((employee) =>
    employee?.position_family_id && employee?.position_level_id && employee?.position_id
  ).length;

  const costStructureComplete = employees.filter((employee) =>
    employee?.business_unit_id && employee?.cost_center_id && employee?.profit_center_id
  ).length;

  const payrollComplete = employees.filter((employee) =>
    employee?.payroll_company_id && employee?.payroll_type_id && employee?.payroll_group_id
  ).length;

  const contactComplete = employees.filter((employee) =>
    Boolean(employee?.work_email || employee?.email)
  ).length;

  const uniqueCount = (field) =>
    uniqueStrings(employees.map((employee) => employee?.[field])).length;

  const recentStarters = [...employees]
    .filter((employee) => getStartDate(employee))
    .sort((a, b) => {
      return new Date(getStartDate(b)).getTime() - new Date(getStartDate(a)).getTime();
    })
    .slice(0, 10)
    .map((employee) => ({
      id: employee.id,
      employee_code: employee.employee_code,
      full_name: getFullName(employee),
      start_work_date: getStartDate(employee),
      company: employee?.companies?.company_name_th || employee?.companies?.company_name_en || "-",
      branch: employee?.branches?.branch_name || "-",
      department: employee?.departments?.department_name || "-",
      position: employee?.positions?.position_name || "-",
    }));

  const scopeAssignments = getScopeAssignmentSummary(guard);

  return {
    generated_at: generatedAt.toISOString(),
    scope_mode: scopeMode,
    scope_assignments: scopeAssignments,

    kpi: {
      employees_total: total,
      working,
      headcount,
      probation,
      new_this_month: newThisMonth,
      new_this_year: newThisYear,
      resigned_this_month: resignedThisMonth,
      resigned_this_year: resignedThisYear,
      user_account_coverage: accountCoverage,
    },

    organization: {
      companies: uniqueCount("company_id"),
      branch_groups: uniqueCount("branch_group_id"),
      branches: uniqueCount("branch_id"),
      departments: uniqueCount("department_id"),
      divisions: uniqueCount("division_id"),
      units: uniqueCount("unit_id"),
    },

    distributions: {
      companies: distribution(employees, {
        idGetter: (row) => row?.company_id,
        labelGetter: (row) =>
          row?.companies?.company_name_th ||
          row?.companies?.company_name_en ||
          row?.companies?.company_code ||
          "ไม่ระบุบริษัท",
      }),

      branches: distribution(employees, {
        idGetter: (row) => row?.branch_id,
        labelGetter: (row) => row?.branches?.branch_name || "ไม่ระบุสังกัด",
      }),

      departments: distribution(employees, {
        idGetter: (row) => row?.department_id,
        labelGetter: (row) => row?.departments?.department_name || "ไม่ระบุแผนก",
      }),

      employment_types: distribution(employees, {
        idGetter: (row) => row?.employment_type_id,
        labelGetter: (row) => row?.employment_types?.type_name || "ไม่ระบุประเภทการจ้าง",
      }),

      position_levels: distribution(employees, {
        idGetter: (row) => row?.position_level_id,
        labelGetter: (row) => {
          const level = row?.position_levels;
          if (!level) return "ไม่ระบุระดับตำแหน่ง";
          return level?.level_code
            ? `${level.level_code} - ${level.level_name || ""}`.trim()
            : level?.level_name || "ไม่ระบุระดับตำแหน่ง";
        },
      }),

      statuses: statusDistribution(employees),
    },

    readiness: {
      organization: {
        value: organizationComplete,
        total,
        percent: percent(organizationComplete, total),
      },
      job_architecture: {
        value: jobArchitectureComplete,
        total,
        percent: percent(jobArchitectureComplete, total),
      },
      cost_structure: {
        value: costStructureComplete,
        total,
        percent: percent(costStructureComplete, total),
      },
      payroll: {
        value: payrollComplete,
        total,
        percent: percent(payrollComplete, total),
      },
      contact: {
        value: contactComplete,
        total,
        percent: percent(contactComplete, total),
      },
      user_account: {
        value: accountCoverage,
        total,
        percent: percent(accountCoverage, total),
      },
    },

    attention: {
      missing_organization: total - organizationComplete,
      missing_job_architecture: total - jobArchitectureComplete,
      missing_cost_structure: total - costStructureComplete,
      missing_payroll: total - payrollComplete,
      missing_contact: total - contactComplete,
      missing_user_account: total - accountCoverage,
    },

    recent_starters: recentStarters,

    employees,
    active_user_account_employee_ids: Array.from(activeAccountEmployeeIds),
  };
}

export function toEmployeeExportRows(dashboard) {
  const accountSet = new Set(
    dashboard?.active_user_account_employee_ids || []
  );

  return (dashboard?.employees || []).map((employee) => ({
    "รหัสพนักงาน": employee?.employee_code || "",
    "ชื่อ-นามสกุล": getFullName(employee),
    "บริษัท": employee?.companies?.company_name_th || employee?.companies?.company_name_en || "",
    "กรุ๊ปสังกัด": employee?.branch_groups?.group_name || "",
    "สังกัด": employee?.branches?.branch_name || "",
    "แผนก": employee?.departments?.department_name || "",
    "ฝ่าย": employee?.divisions?.division_name || "",
    "หน่วยงาน": employee?.units?.unit_name || "",
    "ประเภทการจ้าง": employee?.employment_types?.type_name || "",
    "กลุ่มสายงาน": employee?.position_families?.family_name || "",
    "ระดับตำแหน่ง": employee?.position_levels?.level_code
      ? `${employee.position_levels.level_code} - ${employee.position_levels.level_name || ""}`.trim()
      : employee?.position_levels?.level_name || "",
    "ตำแหน่ง": employee?.positions?.position_name || "",
    "สถานะพนักงาน": employee?.employee_statuses?.status_name || employee?.status || "",
    "วันที่เริ่มงาน": getStartDate(employee) || "",
    "วันที่ลาออก": employee?.resignation_date || "",
    "มีบัญชีผู้ใช้": accountSet.has(String(employee?.id)) ? "ใช่" : "ไม่ใช่",
  }));
}
