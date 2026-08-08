import { supabaseAdmin } from "@/lib/supabaseServer";

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

function createEmptyScopeSummary() {
  return {
    has_all_scope: false,

    allowed_company_ids: [],
    allowed_branch_group_ids: [],
    allowed_branch_ids: [],
    allowed_department_ids: [],
    allowed_division_ids: [],
    allowed_unit_ids: [],
  };
}

/* =========================================================
   Main
========================================================= */

export async function getUserAccessContext(
  userAccountId
) {
  const currentDate =
    getCurrentDateThailand();

  /* =======================================================
     1. Active Assignments
  ======================================================= */

  const {
    data: assignments,
    error: assignmentError,
  } = await supabaseAdmin
    .from("user_access_assignments")
    .select(`
      id,
      user_account_id,
      role_id,
      assignment_name,
      is_primary,
      status,
      effective_from,
      effective_to
    `)
    .eq(
      "user_account_id",
      userAccountId
    )
    .eq("status", "active")
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

  if (assignmentError) {
    throw assignmentError;
  }

  const assignmentRows =
    assignments || [];

  const assignmentIds =
    uniqueArray(
      assignmentRows.map(
        (item) => item.id
      )
    );

  const roleIds =
    uniqueArray(
      assignmentRows.map(
        (item) => item.role_id
      )
    );

  /* =======================================================
     2. Scopes

     ตารางจริงของคุณอยู่ public
  ======================================================= */

  let scopes = [];

  if (assignmentIds.length > 0) {
    const {
      data,
      error: scopeError,
    } = await supabaseAdmin
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
        sort_order
      `)
      .in(
        "user_access_assignment_id",
        assignmentIds
      )
      .eq("status", "active")
      .order("sort_order", {
        ascending: true,
      });

    if (scopeError) {
      throw scopeError;
    }

    scopes = data || [];
  }

  /* =======================================================
     3. Roles
  ======================================================= */

  let roles = [];

  if (roleIds.length > 0) {
    const {
      data,
      error: roleError,
    } = await supabaseAdmin
      .from("roles")
      .select(`
        id,
        role_code,
        role_name,
        is_active,
        is_system
      `)
      .in("id", roleIds)
      .eq("is_active", true);

    if (roleError) {
      throw roleError;
    }

    roles = data || [];
  }

  const activeRoleIds =
    roles.map((role) => role.id);

  /* =======================================================
     4. Permissions
  ======================================================= */

  let permissionCodes = [];

  if (activeRoleIds.length > 0) {
    const {
      data,
      error: permissionError,
    } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        role_id,
        permissions (
          id,
          permission_code,
          is_active
        )
      `)
      .in(
        "role_id",
        activeRoleIds
      );

    if (permissionError) {
      throw permissionError;
    }

    permissionCodes = uniqueArray(
      (data || [])
        .map(
          (row) =>
            row?.permissions
        )
        .filter(
          (permission) =>
            permission &&
            permission.is_active &&
            permission.permission_code
        )
        .map(
          (permission) =>
            permission.permission_code
        )
    );
  }

  /* =======================================================
     5. Build Scope Summary
  ======================================================= */

  const scopeSummary =
    createEmptyScopeSummary();

  for (const scope of scopes) {
    switch (scope.scope_type) {
      case "all":
        scopeSummary.has_all_scope =
          true;
        break;

      case "company":
        if (scope.company_id) {
          scopeSummary.allowed_company_ids.push(
            scope.company_id
          );
        }
        break;

      case "branch_group":
        if (scope.branch_group_id) {
          scopeSummary.allowed_branch_group_ids.push(
            scope.branch_group_id
          );
        }
        break;

      case "branch":
        if (scope.branch_id) {
          scopeSummary.allowed_branch_ids.push(
            scope.branch_id
          );
        }
        break;

      case "department":
        if (scope.department_id) {
          scopeSummary.allowed_department_ids.push(
            scope.department_id
          );
        }
        break;

      case "division":
        if (scope.division_id) {
          scopeSummary.allowed_division_ids.push(
            scope.division_id
          );
        }
        break;

      case "unit":
        if (scope.unit_id) {
          scopeSummary.allowed_unit_ids.push(
            scope.unit_id
          );
        }
        break;

      default:
        break;
    }
  }

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

  const accessAssignments =
    assignmentRows
      .filter((assignment) =>
        activeRoleIds.includes(
          assignment.role_id
        )
      )
      .map((assignment) => ({
        ...assignment,

        role:
          roleMap.get(
            assignment.role_id
          ) || null,

        scopes:
          scopesByAssignment.get(
            assignment.id
          ) || [],
      }));

  const isSuperAdmin =
    roles.some(
      (role) =>
        role.role_code ===
        "SUPER_ADMIN"
    );

  return {
    user_account_id:
      userAccountId,

    is_super_admin:
      isSuperAdmin,

    permissions:
      permissionCodes,

    assignments:
      accessAssignments,

    assignment_ids:
      assignmentIds,

    role_ids:
      activeRoleIds,

    has_all_scope:
      isSuperAdmin ||
      scopeSummary.has_all_scope,

    allowed_company_ids:
      uniqueArray(
        scopeSummary.allowed_company_ids
      ),

    allowed_branch_group_ids:
      uniqueArray(
        scopeSummary
          .allowed_branch_group_ids
      ),

    allowed_branch_ids:
      uniqueArray(
        scopeSummary.allowed_branch_ids
      ),

    allowed_department_ids:
      uniqueArray(
        scopeSummary
          .allowed_department_ids
      ),

    allowed_division_ids:
      uniqueArray(
        scopeSummary.allowed_division_ids
      ),

    allowed_unit_ids:
      uniqueArray(
        scopeSummary.allowed_unit_ids
      ),
  };
}