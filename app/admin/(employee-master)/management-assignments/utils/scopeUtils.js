export const MANAGEMENT_LEVELS = [
  "P12",
  "P11",
  "P10",
  "P9",
];

export const VIEW_MODES = {
  ORG_CHART: "orgchart",
  TREE: "tree",
  TABLE: "table",
};

export const SCOPE_TYPES = [
  "all",
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

export const SCOPE_BY_LEVEL = {
  P12: "all",
  P11: "company",
  P10: "branch_group",
  P9: "department",
};

export const SUPERVISOR_LEVEL_BY_LEVEL = {
  P12: null,
  P11: "P12",
  P10: "P11",
  P9: "P10",
};

export const SCOPE_FIELD_BY_TYPE = {
  all: null,
  company: "company_id",
  branch_group: "branch_group_id",
  branch: "branch_id",
  department: "department_id",
  division: "division_id",
  unit: "unit_id",
};

export const SCOPE_LABELS = {
  all: "ทั้งองค์กร",
  company: "บริษัท",
  branch_group: "กลุ่มสาขา",
  branch: "สาขา",
  department: "แผนก",
  division: "ฝ่าย",
  unit: "หน่วยงาน",
};

export const INITIAL_SCOPE_OPTIONS = {
  companies: [],
  branchGroups: [],
  branches: [],
  departments: [],
  divisions: [],
  units: [],
};

export const INITIAL_MANAGEMENT_FORM = {
  employee_id: "",
  management_level: "",
  scopes: [],
  supervisor_employee_id: "",
  is_primary: true,
  status: "active",
  sort_order: 0,
};

/* =========================================================
   Response Helper
========================================================= */

export async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/* =========================================================
   Employee Helpers
========================================================= */

export function getManagementRank(level = "") {
  const normalizedLevel = String(level)
    .trim()
    .toUpperCase();

  const match = normalizedLevel.match(/^P(\d+)$/);

  if (!match) {
    return 0;
  }

  return Number(match[1]);
}

export function resolveEmployeeManagementLevel(employee) {
  if (!employee) {
    return "";
  }

  const level =
    employee.management_level ||
    employee.jobs?.management_level ||
    employee.position_level ||
    employee.positions?.position_level ||
    "";

  return String(level)
    .trim()
    .toUpperCase();
}

export function getEmployeeName(employee) {
  if (!employee) {
    return "-";
  }

  const thaiName = [
    employee.first_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const englishName = [
    employee.first_name_en,
    employee.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    employee.full_name_th ||
    thaiName ||
    employee.full_name_en ||
    englishName ||
    "-"
  );
}

export function getEmployeePositionName(employee) {
  if (!employee) {
    return "-";
  }

  return (
    employee.position_name ||
    employee.positions?.position_name ||
    employee.job_name ||
    employee.jobs?.job_name ||
    "-"
  );
}

export function mapManagementEmployee(employee) {
  const managementLevel =
    resolveEmployeeManagementLevel(employee);

  return {
    ...employee,

    resolved_management_level:
      managementLevel,

    resolved_management_rank:
      getManagementRank(managementLevel),

    resolved_employee_name:
      getEmployeeName(employee),

    resolved_position_name:
      getEmployeePositionName(employee),
  };
}

export function sortManagementEmployees(
  firstEmployee,
  secondEmployee
) {
  const firstRank =
    Number(
      firstEmployee?.resolved_management_rank
    ) || 0;

  const secondRank =
    Number(
      secondEmployee?.resolved_management_rank
    ) || 0;

  if (secondRank !== firstRank) {
    return secondRank - firstRank;
  }

  return String(
    firstEmployee?.employee_code || ""
  ).localeCompare(
    String(
      secondEmployee?.employee_code || ""
    ),
    "th"
  );
}

/* =========================================================
   Scope Creation
========================================================= */

export function createEmptyScope({
  id = null,
  scopeType = "",
  isPrimary = false,
  sortOrder = 0,
} = {}) {
  return {
    id,

    scope_type: scopeType,

    company_id: "",
    branch_group_id: "",
    branch_id: "",
    department_id: "",
    division_id: "",
    unit_id: "",

    is_primary: Boolean(isPrimary),

    sort_order:
      Number(sortOrder) || 0,
  };
}

export function normalizeScope(
  scope,
  index = 0
) {
  if (!scope) {
    return createEmptyScope({
      sortOrder: index,
    });
  }

  return {
    id: scope.id || null,

    scope_type:
      scope.scope_type || "",

    company_id:
      scope.company_id || "",

    branch_group_id:
      scope.branch_group_id || "",

    branch_id:
      scope.branch_id || "",

    department_id:
      scope.department_id || "",

    division_id:
      scope.division_id || "",

    unit_id:
      scope.unit_id || "",

    company_name:
      scope.company_name ||
      scope.companies?.company_name_th ||
      scope.companies?.company_name ||
      "",

    branch_group_name:
      scope.branch_group_name ||
      scope.branch_groups?.group_name ||
      scope.branch_groups?.branch_group_name ||
      "",

    branch_name:
      scope.branch_name ||
      scope.branches?.branch_name ||
      "",

    department_name:
      scope.department_name ||
      scope.departments?.department_name ||
      "",

    division_name:
      scope.division_name ||
      scope.divisions?.division_name ||
      "",

    unit_name:
      scope.unit_name ||
      scope.units?.unit_name ||
      "",

    is_primary:
      Boolean(scope.is_primary),

    sort_order:
      Number(scope.sort_order) || index,
  };
}

export function normalizeScopes(scopes) {
  if (!Array.isArray(scopes)) {
    return [];
  }

  const normalizedScopes = scopes
    .map((scope, index) =>
      normalizeScope(scope, index)
    )
    .sort((firstScope, secondScope) => {
      return (
        Number(firstScope.sort_order) -
        Number(secondScope.sort_order)
      );
    });

  if (
    normalizedScopes.length > 0 &&
    !normalizedScopes.some(
      (scope) => scope.is_primary
    )
  ) {
    normalizedScopes[0] = {
      ...normalizedScopes[0],
      is_primary: true,
    };
  }

  return normalizedScopes;
}

/* =========================================================
   Scope From Employee
========================================================= */

export function buildEmployeeInitialScopes(
  employee,
  managementLevel
) {
  const normalizedLevel = String(
    managementLevel || ""
  )
    .trim()
    .toUpperCase();

  const scopeType =
    SCOPE_BY_LEVEL[normalizedLevel] || "";

  if (!employee || !scopeType) {
    return [];
  }

  const scope = createEmptyScope({
    scopeType,
    isPrimary: true,
    sortOrder: 0,
  });

  if (scopeType === "all") {
    return [scope];
  }

  if (scopeType === "company") {
    scope.company_id =
      employee.company_id ||
      employee.branches?.company_id ||
      employee.companies?.id ||
      "";

    return [scope];
  }

  if (scopeType === "branch_group") {
    scope.branch_group_id =
      employee.branch_group_id ||
      employee.branches?.branch_group_id ||
      employee.branch_groups?.id ||
      "";

    return [scope];
  }

  if (scopeType === "branch") {
    scope.branch_id =
      employee.branch_id ||
      employee.branches?.id ||
      "";

    return [scope];
  }

  if (scopeType === "department") {
    scope.department_id =
      employee.department_id ||
      employee.departments?.id ||
      "";

    return [scope];
  }

  if (scopeType === "division") {
    scope.division_id =
      employee.division_id ||
      employee.divisions?.id ||
      "";

    return [scope];
  }

  if (scopeType === "unit") {
    scope.unit_id =
      employee.unit_id ||
      employee.units?.id ||
      "";

    return [scope];
  }

  return [scope];
}

/* =========================================================
   Scope Display
========================================================= */

export function getScopeTypeLabel(
  scopeType
) {
  return (
    SCOPE_LABELS[scopeType] ||
    scopeType ||
    "-"
  );
}

export function getSingleScopeLabel(
  scope
) {
  if (!scope) {
    return "-";
  }

  if (scope.scope_type === "all") {
    return "ทั้งองค์กร";
  }

  if (scope.scope_type === "company") {
    return (
      scope.company_name ||
      scope.companies?.company_name_th ||
      scope.companies?.company_name ||
      "-"
    );
  }

  if (
    scope.scope_type ===
    "branch_group"
  ) {
    return (
      scope.branch_group_name ||
      scope.branch_groups?.group_name ||
      scope.branch_groups
        ?.branch_group_name ||
      "-"
    );
  }

  if (scope.scope_type === "branch") {
    return (
      scope.branch_name ||
      scope.branches?.branch_name ||
      "-"
    );
  }

  if (
    scope.scope_type === "department"
  ) {
    return (
      scope.department_name ||
      scope.departments
        ?.department_name ||
      "-"
    );
  }

  if (scope.scope_type === "division") {
    return (
      scope.division_name ||
      scope.divisions?.division_name ||
      "-"
    );
  }

  if (scope.scope_type === "unit") {
    return (
      scope.unit_name ||
      scope.units?.unit_name ||
      "-"
    );
  }

  return "-";
}

export function getAssignmentScopes(
  assignment
) {
  if (!assignment) {
    return [];
  }

  if (
    Array.isArray(
      assignment.management_assignment_scopes
    )
  ) {
    return normalizeScopes(
      assignment.management_assignment_scopes
    );
  }

  if (
    Array.isArray(assignment.scopes)
  ) {
    return normalizeScopes(
      assignment.scopes
    );
  }

  /*
   * Legacy fallback:
   * รองรับข้อมูลเก่าที่ยังส่ง scope อยู่บน assignment
   */
  if (assignment.scope_type) {
    return normalizeScopes([
      {
        id: null,

        scope_type:
          assignment.scope_type,

        company_id:
          assignment.company_id,

        branch_group_id:
          assignment.branch_group_id,

        branch_id:
          assignment.branch_id,

        department_id:
          assignment.department_id,

        division_id:
          assignment.division_id,

        unit_id:
          assignment.unit_id,

        company_name:
          assignment.company_name,

        branch_group_name:
          assignment.branch_group_name,

        branch_name:
          assignment.branch_name,

        department_name:
          assignment.department_name,

        division_name:
          assignment.division_name,

        unit_name:
          assignment.unit_name,

        is_primary: true,

        sort_order: 0,
      },
    ]);
  }

  return [];
}

export function getPrimaryScope(
  scopes
) {
  const normalizedScopes =
    normalizeScopes(scopes);

  return (
    normalizedScopes.find(
      (scope) => scope.is_primary
    ) ||
    normalizedScopes[0] ||
    null
  );
}

/* =========================================================
   Scope Validation
========================================================= */

export function validateManagementScopes(scopes) {
  if (!Array.isArray(scopes) || scopes.length === 0) {
    return "กรุณากำหนดขอบเขตการดูแลอย่างน้อย 1 รายการ";
  }

  const normalizedScopes = normalizeScopes(scopes);

  const allScopeCount =
    normalizedScopes.filter(
      (scope) =>
        scope.scope_type === "all"
    ).length;

  if (allScopeCount > 0 && normalizedScopes.length > 1) {
    return "ขอบเขตทั้งองค์กรไม่สามารถใช้ร่วมกับขอบเขตอื่นได้";
  }

  const primaryScopeCount = normalizedScopes.filter(
      (scope) => scope.is_primary
    ).length;

  if (primaryScopeCount !== 1) {
    return "ต้องกำหนด Scope หลักจำนวน 1 รายการ";
  }

  for (let index = 0;index < normalizedScopes.length;index += 1) {
    const scope =normalizedScopes[index];

    if (!SCOPE_TYPES.includes(scope.scope_type)) {
      return `Scope ลำดับที่ ${
        index + 1
      } มีประเภทไม่ถูกต้อง`;
    }

    const requiredField = SCOPE_FIELD_BY_TYPE[scope.scope_type];

    if (requiredField && !scope[requiredField]) {
      return `Scope ลำดับที่ ${
        index + 1
      } กรุณาเลือก ${
        SCOPE_LABELS[
          scope.scope_type
        ] ||
        scope.scope_type
      }`;
    }
  }

  return "";
}

/* =========================================================
   Payload
========================================================= */

export function sanitizeScopePayload(scope,index = 0) {
  const scopeType = scope?.scope_type || "";

  return {
    scope_type: scopeType,
    company_id:
      scopeType === "company"
        ? scope.company_id || null
        : null,

    branch_group_id:
      scopeType === "branch_group"
        ? scope.branch_group_id ||
          null
        : null,

    branch_id:
      scopeType === "branch"
        ? scope.branch_id || null
        : null,

    department_id:
      scopeType === "department"
        ? scope.department_id ||
          null
        : null,

    division_id:
      scopeType === "division"
        ? scope.division_id || null
        : null,

    unit_id:
      scopeType === "unit"
        ? scope.unit_id || null
        : null,

    is_primary:
      Boolean(scope.is_primary),

    sort_order:
      Number(scope.sort_order) ||
      index,
  };
}

export function buildManagementAssignmentPayload(form) {
  return {
    employee_id: form.employee_id,
    management_level: form.management_level,
    supervisor_employee_id: form.management_level === "P12" ? null : form.supervisor_employee_id ||null,
    is_primary:Boolean(form.is_primary),
    status:form.status || "active",
    sort_order: Number(form.sort_order) || 0,
    scopes: normalizeScopes(
      form.scopes
    ).map(
      (scope, index) =>
        sanitizeScopePayload(
          scope,
          index
        )
    ),
  };
}