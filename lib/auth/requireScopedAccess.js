import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { supabaseAdmin } from "@/lib/supabaseServer";

const NO_ACCESS_UUID =
  "00000000-0000-0000-0000-000000000000";

const SCOPE_CONFIG = {
  company: {
    idsKey: "allowed_company_ids",
    field: "company_id",
  },
  branch_group: {
    idsKey: "allowed_branch_group_ids",
    field: "branch_group_id",
  },
  branch: {
    idsKey: "allowed_branch_ids",
    field: "branch_id",
  },
  department: {
    idsKey: "allowed_department_ids",
    field: "department_id",
  },
  division: {
    idsKey: "allowed_division_ids",
    field: "division_id",
  },
  unit: {
    idsKey: "allowed_unit_ids",
    field: "unit_id",
  },
};

const SCOPE_TYPES = Object.keys(SCOPE_CONFIG);

function uniqueIds(values = []) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .filter(Boolean)
        .map(String)
    ),
  ];
}

function mergeIds(...groups) {
  return uniqueIds(groups.flat());
}

function hasPermissionCode(permissions, permission) {
  if (!permission) {
    return true;
  }

  return (
    Array.isArray(permissions) &&
    permissions.includes(permission)
  );
}

function getActiveAssignmentScopes(assignment) {
  return (assignment?.scopes || []).filter(
    (scope) =>
      scope &&
      scope.status !== "inactive"
  );
}

function getAssignmentScopeIds(
  assignment,
  scopeType
) {
  const config = SCOPE_CONFIG[scopeType];

  if (!config) {
    return [];
  }

  return uniqueIds(
    getActiveAssignmentScopes(assignment)
      .filter(
        (scope) =>
          scope.scope_type === scopeType
      )
      .map(
        (scope) =>
          scope?.[config.field]
      )
  );
}

function assignmentHasAllScope(assignment) {
  return getActiveAssignmentScopes(
    assignment
  ).some(
    (scope) =>
      scope.scope_type === "all"
  );
}

function assignmentHasOrganizationScope(
  assignment
) {
  return getActiveAssignmentScopes(
    assignment
  ).some((scope) =>
    SCOPE_TYPES.includes(
      scope.scope_type
    )
  );
}

function buildLegacyAssignment(access) {
  const scopes = [];

  if (access?.has_all_scope) {
    scopes.push({
      scope_type: "all",
      status: "active",
    });
  }

  for (const scopeType of SCOPE_TYPES) {
    const config = SCOPE_CONFIG[scopeType];
    const ids = uniqueIds(
      access?.[config.idsKey]
    );

    for (const id of ids) {
      scopes.push({
        scope_type: scopeType,
        [config.field]: id,
        status: "active",
      });
    }
  }

  return {
    id: "legacy-access",
    permissions: Array.isArray(
      access?.permissions
    )
      ? access.permissions
      : [],
    scopes,
  };
}

function getAccessAssignments(access) {
  if (
    Array.isArray(
      access?.access_assignments
    )
  ) {
    return access.access_assignments;
  }

  if (
    Array.isArray(access?.assignments)
  ) {
    return access.assignments;
  }

  return [];
}

function getScopeAssignments(
  access,
  permission = null
) {
  const assignments =
    getAccessAssignments(access);

  if (!permission) {
    if (assignments.length) {
      return assignments;
    }

    return [
      buildLegacyAssignment(access),
    ];
  }

  const matchingAssignments =
    assignments.filter(
      (assignment) =>
        hasPermissionCode(
          assignment?.permissions,
          permission
        )
    );

  if (matchingAssignments.length) {
    return matchingAssignments;
  }

  /*
   * Permission ยังมีจาก legacy user_accounts.role_id
   * แต่ไม่มี Access Assignment ที่ถือ Permission นี้
   * = Permission-only ตาม behavior เดิมของระบบ
   * = ไม่บังคับ Scope
   */
  if (
    access?.is_super_admin ||
    hasPermissionCode(
      access?.permissions,
      permission
    )
  ) {
    return [
      {
        id: "permission-only",
        permissions: [permission],
        scopes: [],
      },
    ];
  }

  return [];
}

export function hasAllAccessScope(
  access,
  permission = null
) {
  if (access?.is_super_admin) {
    return true;
  }

  if (!permission) {
    if (access?.has_all_scope) {
      return true;
    }
  }

  const assignments =
    getScopeAssignments(
      access,
      permission
    );

  return assignments.some(
    (assignment) =>
      assignmentHasAllScope(
        assignment
      ) ||
      !assignmentHasOrganizationScope(
        assignment
      )
  );
}

export function getRawAccessibleIds(
  access,
  scopeType,
  permission = null
) {
  const config = SCOPE_CONFIG[scopeType];

  if (!config) {
    return [];
  }

  const assignments =
    getScopeAssignments(
      access,
      permission
    );

  if (!assignments.length) {
    return [];
  }

  return uniqueIds(
    assignments.flatMap(
      (assignment) =>
        getAssignmentScopeIds(
          assignment,
          scopeType
        )
    )
  );
}

/* =========================================================
   Assignment lineage resolver

   กติกา:
   - ถ้าระบุ Branch ID แล้ว ให้ Branch ID เป็นตัวจริงของ Scope
     ไม่เอา Company/Group มาบีบซ้ำจนเกิด 0 จากข้อมูล parent ที่ซ้ำซ้อน
   - ถ้ายังไม่ระบุ Branch ค่อย derive จาก Group / Company
   - Department / Division / Unit ที่ระบุโดยตรงยัง AND กันตามระดับ
========================================================= */

async function resolveAssignmentBranchIds(
  assignment
) {
  const directBranchIds =
    getAssignmentScopeIds(
      assignment,
      "branch"
    );

  if (directBranchIds.length) {
    return directBranchIds;
  }

  const companyIds =
    getAssignmentScopeIds(
      assignment,
      "company"
    );

  const branchGroupIds =
    getAssignmentScopeIds(
      assignment,
      "branch_group"
    );

  if (
    !companyIds.length &&
    !branchGroupIds.length
  ) {
    return [];
  }

  let query = supabaseAdmin
    .from("branches")
    .select("id");

  if (companyIds.length) {
    query = query.in(
      "company_id",
      companyIds
    );
  }

  if (branchGroupIds.length) {
    query = query.in(
      "group_id",
      branchGroupIds
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return uniqueIds(
    (data || []).map(
      (item) => item.id
    )
  );
}

async function resolveAssignmentCompanyIds(
  assignment
) {
  const directCompanyIds =
    getAssignmentScopeIds(
      assignment,
      "company"
    );

  if (directCompanyIds.length) {
    return directCompanyIds;
  }

  const directBranchIds =
    getAssignmentScopeIds(
      assignment,
      "branch"
    );

  const branchGroupIds =
    getAssignmentScopeIds(
      assignment,
      "branch_group"
    );

  if (
    !directBranchIds.length &&
    !branchGroupIds.length
  ) {
    return [];
  }

  let query = supabaseAdmin
    .from("branches")
    .select("company_id")
    .not("company_id", "is", null);

  if (directBranchIds.length) {
    query = query.in(
      "id",
      directBranchIds
    );
  } else if (branchGroupIds.length) {
    query = query.in(
      "group_id",
      branchGroupIds
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return uniqueIds(
    (data || []).map(
      (item) => item.company_id
    )
  );
}

async function resolveAssignmentBranchGroupIds(
  assignment
) {
  const directGroupIds =
    getAssignmentScopeIds(
      assignment,
      "branch_group"
    );

  if (directGroupIds.length) {
    return directGroupIds;
  }

  const directBranchIds =
    getAssignmentScopeIds(
      assignment,
      "branch"
    );

  const companyIds =
    getAssignmentScopeIds(
      assignment,
      "company"
    );

  if (
    !directBranchIds.length &&
    !companyIds.length
  ) {
    return [];
  }

  let query = supabaseAdmin
    .from("branches")
    .select("group_id")
    .not("group_id", "is", null);

  if (directBranchIds.length) {
    query = query.in(
      "id",
      directBranchIds
    );
  } else if (companyIds.length) {
    query = query.in(
      "company_id",
      companyIds
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return uniqueIds(
    (data || []).map(
      (item) => item.group_id
    )
  );
}

async function resolveAssignmentDepartmentIds(
  assignment
) {
  const directDepartmentIds =
    getAssignmentScopeIds(
      assignment,
      "department"
    );

  const hasBranchConstraint =
    [
      "company",
      "branch_group",
      "branch",
    ].some(
      (scopeType) =>
        getAssignmentScopeIds(
          assignment,
          scopeType
        ).length > 0
    );

  if (!hasBranchConstraint) {
    return directDepartmentIds;
  }

  const branchIds =
    await resolveAssignmentBranchIds(
      assignment
    );

  if (!branchIds.length) {
    return [];
  }

  let query = supabaseAdmin
    .from("branch_departments")
    .select("department_id")
    .in("branch_id", branchIds)
    .eq("status", "active");

  if (directDepartmentIds.length) {
    query = query.in(
      "department_id",
      directDepartmentIds
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return uniqueIds(
    (data || []).map(
      (item) => item.department_id
    )
  );
}

async function resolveAssignmentDivisionIds(
  assignment
) {
  const directDivisionIds =
    getAssignmentScopeIds(
      assignment,
      "division"
    );

  const hasDepartmentLine =
    [
      "company",
      "branch_group",
      "branch",
      "department",
    ].some(
      (scopeType) =>
        getAssignmentScopeIds(
          assignment,
          scopeType
        ).length > 0
    );

  if (!hasDepartmentLine) {
    return directDivisionIds;
  }

  const departmentIds =
    await resolveAssignmentDepartmentIds(
      assignment
    );

  if (!departmentIds.length) {
    return directDivisionIds.length
      ? directDivisionIds
      : [];
  }

  let query = supabaseAdmin
    .from("divisions")
    .select("id")
    .in("department_id", departmentIds);

  if (directDivisionIds.length) {
    query = query.in(
      "id",
      directDivisionIds
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return uniqueIds(
    (data || []).map(
      (item) => item.id
    )
  );
}

async function resolveAssignmentUnitIds(
  assignment
) {
  const directUnitIds =
    getAssignmentScopeIds(
      assignment,
      "unit"
    );

  const hasDivisionLine =
    [
      "company",
      "branch_group",
      "branch",
      "department",
      "division",
    ].some(
      (scopeType) =>
        getAssignmentScopeIds(
          assignment,
          scopeType
        ).length > 0
    );

  if (!hasDivisionLine) {
    return directUnitIds;
  }

  const divisionIds =
    await resolveAssignmentDivisionIds(
      assignment
    );

  if (!divisionIds.length) {
    return directUnitIds.length
      ? directUnitIds
      : [];
  }

  let query = supabaseAdmin
    .from("units")
    .select("id")
    .in("division_id", divisionIds);

  if (directUnitIds.length) {
    query = query.in(
      "id",
      directUnitIds
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return uniqueIds(
    (data || []).map(
      (item) => item.id
    )
  );
}

async function resolveAssignmentAccessibleIds(
  assignment,
  scopeType
) {
  switch (scopeType) {
    case "company":
      return resolveAssignmentCompanyIds(
        assignment
      );

    case "branch_group":
      return resolveAssignmentBranchGroupIds(
        assignment
      );

    case "branch":
      return resolveAssignmentBranchIds(
        assignment
      );

    case "department":
      return resolveAssignmentDepartmentIds(
        assignment
      );

    case "division":
      return resolveAssignmentDivisionIds(
        assignment
      );

    case "unit":
      return resolveAssignmentUnitIds(
        assignment
      );

    default:
      return [];
  }
}

export async function resolveAccessibleIds(
  access,
  scopeType,
  {
    permission = null,
  } = {}
) {
  if (!scopeType) {
    return [];
  }

  if (
    hasAllAccessScope(
      access,
      permission
    )
  ) {
    return [];
  }

  const assignments =
    getScopeAssignments(
      access,
      permission
    );

  if (!assignments.length) {
    return [];
  }

  const groups = [];

  for (const assignment of assignments) {
    if (
      assignmentHasAllScope(
        assignment
      ) ||
      !assignmentHasOrganizationScope(
        assignment
      )
    ) {
      return [];
    }

    groups.push(
      await resolveAssignmentAccessibleIds(
        assignment,
        scopeType
      )
    );
  }

  return mergeIds(...groups);
}

/* =========================================================
   Employee scope

   ภายใน Assignment เดียว:
   - Branch หลาย ID = OR
   - Department หลาย ID = OR
   - Division หลาย ID = OR
   - Unit หลาย ID = OR
   - คนละระดับ = AND

   หลาย Assignment = OR

   ถ้า Assignment ที่ถือ Permission ไม่มี Scope เลย
   = Permission-only = เห็นตาม Permission เดิม
========================================================= */

async function buildEmployeeAssignmentRule(
  assignment
) {
  if (
    assignmentHasAllScope(
      assignment
    ) ||
    !assignmentHasOrganizationScope(
      assignment
    )
  ) {
    return {
      all: true,
      expression: null,
      branchIds: [],
      departmentIds: [],
      divisionIds: [],
      unitIds: [],
    };
  }

  const hasBranchLine =
    [
      "company",
      "branch_group",
      "branch",
    ].some(
      (scopeType) =>
        getAssignmentScopeIds(
          assignment,
          scopeType
        ).length > 0
    );

  const directDepartmentIds =
    getAssignmentScopeIds(
      assignment,
      "department"
    );

  const directDivisionIds =
    getAssignmentScopeIds(
      assignment,
      "division"
    );

  const directUnitIds =
    getAssignmentScopeIds(
      assignment,
      "unit"
    );

  const conditions = [];

  let branchIds = [];

  if (hasBranchLine) {
    branchIds =
      await resolveAssignmentBranchIds(
        assignment
      );

    if (!branchIds.length) {
      return {
        all: false,
        expression: null,
        branchIds: [],
        departmentIds: [],
        divisionIds: [],
        unitIds: [],
      };
    }

    conditions.push(
      `branch_id.in.(${branchIds.join(",")})`
    );
  }

  if (directDepartmentIds.length) {
    conditions.push(
      `department_id.in.(${directDepartmentIds.join(",")})`
    );
  }

  if (directDivisionIds.length) {
    conditions.push(
      `division_id.in.(${directDivisionIds.join(",")})`
    );
  }

  if (directUnitIds.length) {
    conditions.push(
      `unit_id.in.(${directUnitIds.join(",")})`
    );
  }

  if (!conditions.length) {
    return {
      all: true,
      expression: null,
      branchIds: [],
      departmentIds: [],
      divisionIds: [],
      unitIds: [],
    };
  }

  return {
    all: false,
    expression:
      conditions.length === 1
        ? conditions[0]
        : `and(${conditions.join(",")})`,
    branchIds,
    departmentIds:
      directDepartmentIds,
    divisionIds:
      directDivisionIds,
    unitIds:
      directUnitIds,
  };
}

async function buildEmployeeRules(
  access,
  permission = null
) {
  if (
    hasAllAccessScope(
      access,
      permission
    )
  ) {
    return {
      all: true,
      rules: [],
    };
  }

  const assignments =
    getScopeAssignments(
      access,
      permission
    );

  if (!assignments.length) {
    return {
      all: false,
      rules: [],
    };
  }

  const rules = [];

  for (const assignment of assignments) {
    const rule =
      await buildEmployeeAssignmentRule(
        assignment
      );

    if (rule.all) {
      return {
        all: true,
        rules: [],
      };
    }

    if (rule.expression) {
      rules.push(rule);
    }
  }

  return {
    all: false,
    rules,
  };
}

function employeeMatchesRule(
  employee,
  rule
) {
  if (!employee || !rule) {
    return false;
  }

  if (
    rule.branchIds?.length &&
    !rule.branchIds.includes(
      String(employee.branch_id || "")
    )
  ) {
    return false;
  }

  if (
    rule.departmentIds?.length &&
    !rule.departmentIds.includes(
      String(
        employee.department_id || ""
      )
    )
  ) {
    return false;
  }

  if (
    rule.divisionIds?.length &&
    !rule.divisionIds.includes(
      String(employee.division_id || "")
    )
  ) {
    return false;
  }

  if (
    rule.unitIds?.length &&
    !rule.unitIds.includes(
      String(employee.unit_id || "")
    )
  ) {
    return false;
  }

  return true;
}

export function canAccessEmployee(
  access,
  employee,
  {
    permission = null,
    rules = null,
  } = {}
) {
  if (!employee) {
    return false;
  }

  if (
    hasAllAccessScope(
      access,
      permission
    )
  ) {
    return true;
  }

  if (rules?.all) {
    return true;
  }

  if (
    Array.isArray(rules?.rules)
  ) {
    return rules.rules.some(
      (rule) =>
        employeeMatchesRule(
          employee,
          rule
        )
    );
  }

  /* compatibility fallback */
  const branchIds = uniqueIds(
    access?.allowed_branch_ids
  );
  const departmentIds = uniqueIds(
    access?.allowed_department_ids
  );
  const divisionIds = uniqueIds(
    access?.allowed_division_ids
  );
  const unitIds = uniqueIds(
    access?.allowed_unit_ids
  );

  const hasConstraint =
    branchIds.length ||
    departmentIds.length ||
    divisionIds.length ||
    unitIds.length;

  if (!hasConstraint) {
    return true;
  }

  if (
    branchIds.length &&
    !branchIds.includes(
      String(employee.branch_id || "")
    )
  ) {
    return false;
  }

  if (
    departmentIds.length &&
    !departmentIds.includes(
      String(
        employee.department_id || ""
      )
    )
  ) {
    return false;
  }

  if (
    divisionIds.length &&
    !divisionIds.includes(
      String(employee.division_id || "")
    )
  ) {
    return false;
  }

  if (
    unitIds.length &&
    !unitIds.includes(
      String(employee.unit_id || "")
    )
  ) {
    return false;
  }

  return true;
}

export function applyEmployeeScope(
  query,
  access,
  {
    permission = null,
    rules = null,
  } = {}
) {
  if (
    hasAllAccessScope(
      access,
      permission
    ) ||
    rules?.all
  ) {
    return query;
  }

  if (
    Array.isArray(rules?.rules)
  ) {
    const expressions = rules.rules
      .map((rule) => rule.expression)
      .filter(Boolean);

    if (!expressions.length) {
      return query.eq(
        "id",
        NO_ACCESS_UUID
      );
    }

    return query.or(
      expressions.join(",")
    );
  }

  /* compatibility fallback */
  const branchIds = uniqueIds(
    access?.allowed_branch_ids
  );
  const departmentIds = uniqueIds(
    access?.allowed_department_ids
  );
  const divisionIds = uniqueIds(
    access?.allowed_division_ids
  );
  const unitIds = uniqueIds(
    access?.allowed_unit_ids
  );

  let hasConstraint = false;

  if (branchIds.length) {
    query = query.in(
      "branch_id",
      branchIds
    );
    hasConstraint = true;
  }

  if (departmentIds.length) {
    query = query.in(
      "department_id",
      departmentIds
    );
    hasConstraint = true;
  }

  if (divisionIds.length) {
    query = query.in(
      "division_id",
      divisionIds
    );
    hasConstraint = true;
  }

  if (unitIds.length) {
    query = query.in(
      "unit_id",
      unitIds
    );
    hasConstraint = true;
  }

  /* ไม่มี Scope = Permission-only */
  return hasConstraint
    ? query
    : query;
}

export async function requireScopedAccess(
  module,
  action,
  {
    scopeType = null,
    createRequiresAllScope = false,
    lineageScope = false,
  } = {}
) {
  const permission =
    `${module}.${action}`;

  const guard =
    await requirePermission(
      permission
    );

  if (!guard.ok) {
    return guard;
  }

  const access = guard.access || {};

  const relevantAssignments =
    getScopeAssignments(
      access,
      permission
    );

  const hasAllScope =
    hasAllAccessScope(
      access,
      permission
    );

  const hasAnyScope =
    relevantAssignments.some(
      (assignment) =>
        assignmentHasAllScope(
          assignment
        ) ||
        assignmentHasOrganizationScope(
          assignment
        )
    );

  if (
    action === "create" &&
    createRequiresAllScope &&
    !hasAllScope
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีขอบเขตสิทธิ์ในการเพิ่มข้อมูลนี้",
        },
        { status: 403 }
      ),
    };
  }

  const accessibleIds =
    !scopeType ||
    scopeType === "employee" ||
    hasAllScope
      ? []
      : await resolveAccessibleIds(
          access,
          scopeType,
          { permission }
        );

  const accessibleIdSet =
    new Set(
      accessibleIds.map(String)
    );

  const needsEmployeeRules =
    module === "ems.employees" ||
    scopeType === "employee" ||
    lineageScope;

  const employeeRules =
    needsEmployeeRules
      ? await buildEmployeeRules(
          access,
          permission
        )
      : null;

  const canAccessId = (id) => {
    if (hasAllScope) {
      return true;
    }

    if (
      !scopeType ||
      scopeType === "employee"
    ) {
      return true;
    }

    if (!id) {
      return false;
    }

    return accessibleIdSet.has(
      String(id)
    );
  };

  const applyScope = (
    query,
    column = "id"
  ) => {
    if (
      !scopeType ||
      scopeType === "employee" ||
      hasAllScope
    ) {
      return query;
    }

    if (!accessibleIds.length) {
      return query.eq(
        column,
        NO_ACCESS_UUID
      );
    }

    return query.in(
      column,
      accessibleIds
    );
  };

  const assertAccessId = (
    id,
    message =
      "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
  ) => {
    if (canAccessId(id)) {
      return null;
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 403 }
    );
  };

  return {
    ...guard,

    ok: true,
    permission,
    module,
    action,
    scopeType,
    access,
    relevantAssignments,
    hasAllScope,
    hasAnyScope,
    accessibleIds,

    canAccessId,
    applyScope,
    assertAccessId,

    canAccessEmployee: (employee) =>
      canAccessEmployee(
        access,
        employee,
        {
          permission,
          rules: employeeRules,
        }
      ),

    applyEmployeeScope: (query) =>
      applyEmployeeScope(
        query,
        access,
        {
          permission,
          rules: employeeRules,
        }
      ),
  };
}
