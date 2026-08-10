import { supabaseAdmin } from "@/lib/supabaseServer";

const ACTIVE_STATUS = "active";

/* =========================================================
   Helpers
========================================================= */

function uniqueArray(values = []) {
  return [
    ...new Set(
      values.filter(Boolean)
    ),
  ];
}

function getCurrentDateThailand() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(new Date());
}

function buildFullName(
  employee,
  fallback = ""
) {
  if (!employee) {
    return fallback;
  }

  const fullNameTh = [
    employee.first_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const fullNameEn = [
    employee.first_name_en,
    employee.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    fullNameTh ||
    fullNameEn ||
    fallback
  );
}

/* =========================================================
   User Account
========================================================= */

export async function loadUserAccountById(
  userAccountId
) {
  const { data, error } =
    await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        role_id,
        username,
        password_hash,
        is_active,
        last_login_at
      `)
      .eq("id", userAccountId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

export async function loadUserAccountByUsername(
  username
) {
  const { data, error } =
    await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        role_id,
        username,
        password_hash,
        is_active,
        last_login_at
      `)
      .eq("username", username)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   Employee
========================================================= */

async function loadEmployee(employeeId) {
  if (!employeeId) {
    return null;
  }

  const { data, error } =
    await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        employee_photo_url
      `)
      .eq("id", employeeId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   Access Assignments
========================================================= */

async function loadActiveAssignments(
  userAccountId
) {
  const currentDate =
    getCurrentDateThailand();

  const { data, error } =
    await supabaseAdmin
      .from("user_access_assignments")
      .select(`
        id,
        user_account_id,
        role_id,
        assignment_name,
        is_primary,
        status,
        effective_from,
        effective_to,
        created_at,
        updated_at
      `)
      .eq(
        "user_account_id",
        userAccountId
      )
      .eq("status", ACTIVE_STATUS)
      .lte(
        "effective_from",
        currentDate
      )
      .or(
        `effective_to.is.null,effective_to.gte.${currentDate}`
      )
      .order("is_primary", {
        ascending: false,
      })
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   Assignment Scopes
   Schema: access
========================================================= */

async function loadAssignmentScopes(
  assignmentIds = []
) {
  const ids =
    uniqueArray(assignmentIds);

  if (!ids.length) {
    return [];
  }

  const { data, error } =
    await supabaseAdmin
      .from(
        "user_access_assignment_scopes"
      )
      .select(`
        id,
        user_access_assignment_id,
        scope_type,
        company_id,
        branch_group_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        status,
        sort_order,
        created_at,
        updated_at
      `)
      .in(
        "user_access_assignment_id",
        ids
      )
      .eq("status", ACTIVE_STATUS)
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    console.error(
      "LOAD_ASSIGNMENT_SCOPES_ERROR:",
      error
    );

    throw error;
  }

  return data || [];
}

/* =========================================================
   Roles
========================================================= */

async function loadRoles(roleIds = []) {
  const ids =
    uniqueArray(roleIds);

  if (!ids.length) {
    return [];
  }

  const { data, error } =
    await supabaseAdmin
      .from("roles")
      .select(`
        id,
        role_code,
        role_name,
        is_active,
        is_system
      `)
      .in("id", ids)
      .eq("is_active", true);

  if (error) {
    throw error;
  }

  return data || [];
}

/* =========================================================
   Permissions
========================================================= */

async function loadPermissionsByRoles(
  roleIds = []
) {
  const ids =
    uniqueArray(roleIds);

  if (!ids.length) {
    return {
      allPermissions: [],
      permissionsByRole: {},
    };
  }

  const { data, error } =
    await supabaseAdmin
      .from("role_permissions")
      .select(`
        role_id,
        permissions (
          id,
          permission_code,
          is_active
        )
      `)
      .in("role_id", ids);

  if (error) {
    throw error;
  }

  const allPermissionSet =
    new Set();

  const permissionsByRole = {};

  for (const roleId of ids) {
    permissionsByRole[roleId] = [];
  }

  for (const row of data || []) {
    const permission =
      row?.permissions;

    if (
      !permission ||
      !permission.is_active ||
      !permission.permission_code
    ) {
      continue;
    }

    allPermissionSet.add(
      permission.permission_code
    );

    if (
      !permissionsByRole[row.role_id]
    ) {
      permissionsByRole[row.role_id] =
        [];
    }

    permissionsByRole[
      row.role_id
    ].push(
      permission.permission_code
    );
  }

  for (
    const roleId of Object.keys(
      permissionsByRole
    )
  ) {
    permissionsByRole[roleId] =
      uniqueArray(
        permissionsByRole[roleId]
      );
  }

  return {
    allPermissions: [
      ...allPermissionSet,
    ],

    permissionsByRole,
  };
}

/* =========================================================
   Scope Target Data
========================================================= */

async function loadTargetMap({
  table,
  ids,
  select,
}) {
  if (!ids.length) {
    return new Map();
  }

  const { data, error } =
    await supabaseAdmin
      .from(table)
      .select(select)
      .in("id", ids);

  if (error) {
    throw error;
  }

  return new Map(
    (data || []).map((item) => [
      item.id,
      item,
    ])
  );
}

async function enrichScopes(
  scopes = []
) {
  if (!scopes.length) {
    return [];
  }

  const companyIds = uniqueArray(
    scopes.map(
      (item) => item.company_id
    )
  );

  const branchGroupIds =
    uniqueArray(
      scopes.map(
        (item) =>
          item.branch_group_id
      )
    );

  const branchIds = uniqueArray(
    scopes.map(
      (item) => item.branch_id
    )
  );

  const departmentIds =
    uniqueArray(
      scopes.map(
        (item) =>
          item.department_id
      )
    );

  const divisionIds =
    uniqueArray(
      scopes.map(
        (item) => item.division_id
      )
    );

  const unitIds = uniqueArray(
    scopes.map(
      (item) => item.unit_id
    )
  );

  const [
    companyMap,
    branchGroupMap,
    branchMap,
    departmentMap,
    divisionMap,
    unitMap,
  ] = await Promise.all([
    loadTargetMap({
      table: "companies",
      ids: companyIds,
      select: `
        id,
        company_code,
        company_name_th,
        company_name_en
      `,
    }),

    loadTargetMap({
      table: "branch_groups",
      ids: branchGroupIds,
      select: `
        id,
        group_code,
        group_name
      `,
    }),

    loadTargetMap({
      table: "branches",
      ids: branchIds,
      select: `
        id,
        branch_code,
        branch_name
      `,
    }),

    loadTargetMap({
      table: "departments",
      ids: departmentIds,
      select: `
        id,
        department_code,
        department_name
      `,
    }),

    loadTargetMap({
      table: "divisions",
      ids: divisionIds,
      select: `
        id,
        division_code,
        division_name
      `,
    }),

    loadTargetMap({
      table: "units",
      ids: unitIds,
      select: `
        id,
        unit_code,
        unit_name
      `,
    }),
  ]);

  return scopes.map((scope) => {
    let targetCode = null;
    let targetName = null;

    switch (scope.scope_type) {
      case "all": {
        targetCode = "ALL";
        targetName = "ทุกสังกัด";
        break;
      }

      case "company": {
        const target =
          companyMap.get(
            scope.company_id
          );

        targetCode =
          target?.company_code ||
          null;

        targetName =
          target?.company_name_th ||
          target?.company_name_en ||
          null;

        break;
      }

      case "branch_group": {
        const target =
          branchGroupMap.get(
            scope.branch_group_id
          );

        targetCode =
          target?.group_code ||
          null;

        targetName =
          target?.group_name ||
          null;

        break;
      }

      case "branch": {
        const target =
          branchMap.get(
            scope.branch_id
          );

        targetCode =
          target?.branch_code ||
          null;

        targetName =
          target?.branch_name ||
          null;

        break;
      }

      case "department": {
        const target =
          departmentMap.get(
            scope.department_id
          );

        targetCode =
          target?.department_code ||
          null;

        targetName =
          target?.department_name ||
          null;

        break;
      }

      case "division": {
        const target =
          divisionMap.get(
            scope.division_id
          );

        targetCode =
          target?.division_code ||
          null;

        targetName =
          target?.division_name ||
          null;

        break;
      }

      case "unit": {
        const target =
          unitMap.get(
            scope.unit_id
          );

        targetCode =
          target?.unit_code ||
          null;

        targetName =
          target?.unit_name ||
          null;

        break;
      }

      default:
        break;
    }

    return {
      id: scope.id,

      user_access_assignment_id:
        scope.user_access_assignment_id,

      scope_type:
        scope.scope_type,

      company_id:
        scope.company_id,

      branch_group_id:
        scope.branch_group_id,

      branch_id:
        scope.branch_id,

      department_id:
        scope.department_id,

      division_id:
        scope.division_id,

      unit_id:
        scope.unit_id,

      target_code: targetCode,
      target_name: targetName,
    };
  });
}

/* =========================================================
   Build Assignment JSON
========================================================= */

function buildAssignments({
  assignments,
  roles,
  scopes,
  permissionsByRole,
}) {
  const roleMap = new Map(
    roles.map((role) => [
      role.id,
      role,
    ])
  );

  const scopesByAssignment =
    new Map();

  for (const scope of scopes) {
    const assignmentId =
      scope.user_access_assignment_id;

    if (
      !scopesByAssignment.has(
        assignmentId
      )
    ) {
      scopesByAssignment.set(
        assignmentId,
        []
      );
    }

    scopesByAssignment
      .get(assignmentId)
      .push(scope);
  }

  return assignments.map(
    (assignment) => {
      const role =
        roleMap.get(
          assignment.role_id
        ) || null;

      return {
        id: assignment.id,

        assignment_name:
          assignment.assignment_name,

        is_primary:
          assignment.is_primary,

        status:
          assignment.status,

        effective_from:
          assignment.effective_from,

        effective_to:
          assignment.effective_to,

        role: role
          ? {
              id: role.id,
              role_code:
                role.role_code,
              role_name:
                role.role_name,
            }
          : null,

        permissions:
          permissionsByRole[
            assignment.role_id
          ] || [],

        scopes:
          scopesByAssignment.get(
            assignment.id
          ) || [],
      };
    }
  );
}

/* =========================================================
   Build Allowed Scope IDs
========================================================= */

function buildAllowedScopes(
  scopes = []
) {
  let hasAllScope = false;

  const allowedCompanyIds = [];
  const allowedBranchGroupIds = [];
  const allowedBranchIds = [];
  const allowedDepartmentIds = [];
  const allowedDivisionIds = [];
  const allowedUnitIds = [];

  for (const scope of scopes) {
    switch (scope.scope_type) {
      case "all":
        hasAllScope = true;
        break;

      case "company":
        if (scope.company_id) {
          allowedCompanyIds.push(
            scope.company_id
          );
        }
        break;

      case "branch_group":
        if (scope.branch_group_id) {
          allowedBranchGroupIds.push(
            scope.branch_group_id
          );
        }
        break;

      case "branch":
        if (scope.branch_id) {
          allowedBranchIds.push(
            scope.branch_id
          );
        }
        break;

      case "department":
        if (scope.department_id) {
          allowedDepartmentIds.push(
            scope.department_id
          );
        }
        break;

      case "division":
        if (scope.division_id) {
          allowedDivisionIds.push(
            scope.division_id
          );
        }
        break;

      case "unit":
        if (scope.unit_id) {
          allowedUnitIds.push(
            scope.unit_id
          );
        }
        break;

      default:
        break;
    }
  }

  return {
    allowed_company_ids:
      uniqueArray(
        allowedCompanyIds
      ),

    allowed_branch_ids:
      uniqueArray(
        allowedBranchIds
      ),

    allowed_branch_group_ids:
      uniqueArray(
        allowedBranchGroupIds
      ),

    allowed_department_ids:
      uniqueArray(
        allowedDepartmentIds
      ),

    allowed_division_ids:
      uniqueArray(
        allowedDivisionIds
      ),

    allowed_unit_ids:
      uniqueArray(
        allowedUnitIds
      ),

    has_all_scope:
      hasAllScope,
  };
}

/* =========================================================
   Build User Access Context
========================================================= */

export async function buildUserAccessContext(
  userAccount
) {
  const [employee, assignments] =
    await Promise.all([
      loadEmployee(
        userAccount.employee_id
      ),

      loadActiveAssignments(
        userAccount.id
      ),
    ]);

  const assignmentIds =
    assignments.map(
      (item) => item.id
    );

  const assignmentRoleIds =
    assignments.map(
      (item) => item.role_id
    );

 const requestedRoleIds = uniqueArray([
  userAccount.role_id,
  ...assignmentRoleIds,
]);

  const [roles, rawScopes] =
    await Promise.all([
      loadRoles(requestedRoleIds),
      loadAssignmentScopes(assignmentIds),
    ]);

  const activeRoleIds = roles.map(
    (role) => role.id
  );

  const permissionResult =
    await loadPermissionsByRoles(
      activeRoleIds
    );

  const scopes =
    await enrichScopes(rawScopes);

  const roleMap = new Map(
    roles.map((role) => [
      role.id,
      role,
    ])
  );

  const legacyRole =
    userAccount.role_id
      ? roleMap.get(
          userAccount.role_id
        ) || null
      : null;

  const activeAssignments =
    assignments.filter((assignment) =>
      activeRoleIds.includes(
        assignment.role_id
      )
    );

  const accessAssignments =
    buildAssignments({
      assignments: activeAssignments,
      roles,
      scopes,
      permissionsByRole:
        permissionResult
          .permissionsByRole,
    });

  const allowedScopes =
    buildAllowedScopes(scopes);

  const isSuperAdmin = roles.some(
    (role) =>
      role.role_code ===
      "SUPER_ADMIN"
  );

  return {
    id: userAccount.id,

    employee_id:
      userAccount.employee_id,

    username:
      userAccount.username,

    employee_code:
      employee?.employee_code ||
      null,

    full_name:
      buildFullName(
        employee,
        userAccount.username
      ),

    role_id:
      userAccount.role_id,

    role:
      legacyRole?.role_code ||
      null,

    role_name:
      legacyRole?.role_name ||
      null,

    role_ids:
      activeRoleIds,

    is_super_admin:
      isSuperAdmin,

    permissions:
      permissionResult
        .allPermissions,

    access_assignments:
      accessAssignments,

    ...allowedScopes,

    has_all_scope:
      isSuperAdmin ||
      allowedScopes.has_all_scope,
  };
}