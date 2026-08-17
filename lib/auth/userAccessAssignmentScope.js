import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";

/* =========================================================
   User Access Assignment Scope Guard

   ใช้เฉพาะ Server/API

   Permission = สิทธิ์ว่าทำ Action ได้หรือไม่
   Scope      = จำกัดว่าทำกับ User/Employee คนใดได้บ้าง
========================================================= */

const NO_ACCESS_UUID =
  "00000000-0000-0000-0000-000000000000";

const VALID_SCOPE_TYPES = [
  "all",
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

function uniqueArray(values = []) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .filter(Boolean)
        .map((value) => String(value))
    ),
  ];
}

function normalizeIds(values = []) {
  return uniqueArray(values);
}

function errorResponse(
  message,
  status = 403
) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
    },
    { status }
  );
}

function buildInCondition(
  column,
  values = []
) {
  const ids = normalizeIds(values);

  if (!ids.length) {
    return null;
  }

  return `${column}.in.(${ids.join(",")})`;
}

function getAccessIds(
  accessContext = {}
) {
  return {
    companyIds: normalizeIds(
      accessContext.allowed_company_ids
    ),

    branchGroupIds: normalizeIds(
      accessContext.allowed_branch_group_ids
    ),

    branchIds: normalizeIds(
      accessContext.allowed_branch_ids
    ),

    departmentIds: normalizeIds(
      accessContext.allowed_department_ids
    ),

    divisionIds: normalizeIds(
      accessContext.allowed_division_ids
    ),

    unitIds: normalizeIds(
      accessContext.allowed_unit_ids
    ),
  };
}

/* =========================================================
   Resolve Branches From Company Scope

   company scope ต้องมองเห็น Employee ที่อยู่ใน Branch
   ของ Company นั้นได้ด้วย
========================================================= */

async function loadBranchIdsByCompanyIds(
  companyIds = []
) {
  const ids = normalizeIds(companyIds);

  if (!ids.length) {
    return [];
  }

  const { data, error } =
    await supabaseAdmin
      .from("branches")
      .select("id")
      .in("company_id", ids);

  if (error) {
    throw error;
  }

  return uniqueArray(
    (data || []).map(
      (item) => item.id
    )
  );
}

/* =========================================================
   Resolve Managed User Accounts

   Return:
   {
     unrestricted: boolean,
     employee_ids: [],
     user_account_ids: [],
     expanded_branch_ids: []
   }

   unrestricted = SUPER_ADMIN หรือมี scope_type = all
========================================================= */

export async function resolveManagedUserAccounts(
  accessContext
) {
  const unrestricted = Boolean(
    accessContext?.is_super_admin ||
      accessContext?.has_all_scope
  );

  if (unrestricted) {
    return {
      unrestricted: true,
      employee_ids: [],
      user_account_ids: [],
      expanded_branch_ids: [],
    };
  }

  const {
    companyIds,
    branchGroupIds,
    branchIds,
    departmentIds,
    divisionIds,
    unitIds,
  } = getAccessIds(accessContext);

  const companyBranchIds =
    await loadBranchIdsByCompanyIds(
      companyIds
    );

  const expandedBranchIds =
    uniqueArray([
      ...branchIds,
      ...companyBranchIds,
    ]);

  const conditions = [
    buildInCondition(
      "branch_group_id",
      branchGroupIds
    ),

    buildInCondition(
      "branch_id",
      expandedBranchIds
    ),

    buildInCondition(
      "department_id",
      departmentIds
    ),

    buildInCondition(
      "division_id",
      divisionIds
    ),

    buildInCondition(
      "unit_id",
      unitIds
    ),
  ].filter(Boolean);

  /*
   * ไม่มี Scope เลย = ไม่มีสิทธิ์เห็น User คนใด
   * แม้ Permission จะผ่านก็ตาม
   */
  if (!conditions.length) {
    return {
      unrestricted: false,
      employee_ids: [],
      user_account_ids: [],
      expanded_branch_ids:
        expandedBranchIds,
    };
  }

  const {
    data: employees,
    error: employeeError,
  } = await supabaseAdmin
    .from("employees")
    .select("id")
    .or(conditions.join(","));

  if (employeeError) {
    throw employeeError;
  }

  const employeeIds = uniqueArray(
    (employees || []).map(
      (item) => item.id
    )
  );

  if (!employeeIds.length) {
    return {
      unrestricted: false,
      employee_ids: [],
      user_account_ids: [],
      expanded_branch_ids:
        expandedBranchIds,
    };
  }

  const {
    data: userAccounts,
    error: userAccountError,
  } = await supabaseAdmin
    .from("user_accounts")
    .select("id, employee_id")
    .in("employee_id", employeeIds);

  if (userAccountError) {
    throw userAccountError;
  }

  return {
    unrestricted: false,

    employee_ids: employeeIds,

    user_account_ids:
      uniqueArray(
        (userAccounts || []).map(
          (item) => item.id
        )
      ),

    expanded_branch_ids:
      expandedBranchIds,
  };
}

/* =========================================================
   Permission + Scope Gate

   ใช้ต้น API ทุกตัว เช่น

   const guard = await requireUserAccessAssignmentAccess(
     "access.user_access_assignments.view"
   );

   if (!guard.ok) return guard.response;
========================================================= */

export async function requireUserAccessAssignmentAccess(
  permissionCode
) {
  const auth =
    await requirePermission(
      permissionCode
    );

  if (!auth.ok) {
    return auth;
  }

  try {
    const managedScope =
      await resolveManagedUserAccounts(
        auth.access
      );

    return {
      ...auth,
      managedScope,
    };
  } catch (error) {
    console.error(
      "RESOLVE_USER_ACCESS_ASSIGNMENT_SCOPE_ERROR:",
      error
    );

    return {
      ok: false,
      response: errorResponse(
        "ไม่สามารถตรวจสอบขอบเขตการจัดการผู้ใช้งานได้",
        500
      ),
    };
  }
}

/* =========================================================
   Apply Scope To user_access_assignments Query

   ตาราง user_access_assignments ไม่มี company_id / branch_id
   จึงกรองผ่าน user_account_id ที่ resolve มาแล้ว
========================================================= */

export function applyManagedUserAccountScope(
  query,
  managedScope,
  column = "user_account_id"
) {
  if (managedScope?.unrestricted) {
    return query;
  }

  const ids = normalizeIds(
    managedScope?.user_account_ids
  );

  if (!ids.length) {
    return query.eq(
      column,
      NO_ACCESS_UUID
    );
  }

  return query.in(column, ids);
}

/* =========================================================
   Can Manage User Account
========================================================= */

export function canManageUserAccountFromResolvedScope(
  managedScope,
  userAccountId
) {
  if (!userAccountId) {
    return false;
  }

  if (managedScope?.unrestricted) {
    return true;
  }

  return normalizeIds(
    managedScope?.user_account_ids
  ).includes(
    String(userAccountId)
  );
}

export async function canManageUserAccount(
  accessContext,
  userAccountId,
  managedScope = null
) {
  const resolved =
    managedScope ||
    (await resolveManagedUserAccounts(
      accessContext
    ));

  return canManageUserAccountFromResolvedScope(
    resolved,
    userAccountId
  );
}

export async function assertCanManageUserAccount(
  accessContext,
  userAccountId,
  managedScope = null
) {
  const allowed =
    await canManageUserAccount(
      accessContext,
      userAccountId,
      managedScope
    );

  if (!allowed) {
    return {
      ok: false,
      response: errorResponse(
        "ผู้ใช้งานที่เลือกอยู่นอกขอบเขตที่คุณได้รับมอบหมาย",
        403
      ),
    };
  }

  return {
    ok: true,
  };
}

/* =========================================================
   Scope Delegation Validation

   ป้องกันผู้ดูแลมอบ Scope ที่กว้างกว่าตัวเอง

   กติกาที่ตั้งใจให้ปลอดภัย:
   - all            => ต้องมี all
   - company        => ต้องมี company เดียวกัน
   - branch_group   => ต้องมี branch_group เดียวกัน
   - branch         => มี branch ตรง หรือ company ครอบ branch
   - department     => ต้องมี department ตรง
   - division       => มี division ตรง หรือ department แม่
   - unit           => มี unit ตรง หรือ division/department แม่

   หมายเหตุ:
   department ไม่อนุมานจาก company/branch เพราะ department
   อาจถูกใช้ข้ามหลายสาขาได้ในโครงสร้าง Enterprise
========================================================= */

async function buildDelegationContext(
  accessContext
) {
  const unrestricted = Boolean(
    accessContext?.is_super_admin ||
      accessContext?.has_all_scope
  );

  const accessIds =
    getAccessIds(accessContext);

  if (unrestricted) {
    return {
      unrestricted: true,
      ...accessIds,
      branchesById: new Map(),
      divisionsById: new Map(),
      unitsById: new Map(),
    };
  }

  const [
    branchResult,
    divisionResult,
    unitResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("branches")
      .select("id, company_id"),

    supabaseAdmin
      .from("divisions")
      .select("id, department_id"),

    supabaseAdmin
      .from("units")
      .select("id, division_id"),
  ]);

  if (branchResult.error) {
    throw branchResult.error;
  }

  if (divisionResult.error) {
    throw divisionResult.error;
  }

  if (unitResult.error) {
    throw unitResult.error;
  }

  return {
    unrestricted: false,
    ...accessIds,

    branchesById: new Map(
      (branchResult.data || []).map(
        (item) => [
          String(item.id),
          item,
        ]
      )
    ),

    divisionsById: new Map(
      (divisionResult.data || []).map(
        (item) => [
          String(item.id),
          item,
        ]
      )
    ),

    unitsById: new Map(
      (unitResult.data || []).map(
        (item) => [
          String(item.id),
          item,
        ]
      )
    ),
  };
}

function getScopeTargetId(scope) {
  switch (scope?.scope_type) {
    case "company":
      return scope?.company_id;

    case "branch_group":
      return scope?.branch_group_id;

    case "branch":
      return scope?.branch_id;

    case "department":
      return scope?.department_id;

    case "division":
      return scope?.division_id;

    case "unit":
      return scope?.unit_id;

    default:
      return null;
  }
}

function canDelegateSingleScope(
  scope,
  context
) {
  const scopeType =
    String(
      scope?.scope_type || ""
    ).trim();

  if (
    !VALID_SCOPE_TYPES.includes(
      scopeType
    )
  ) {
    return false;
  }

  if (context.unrestricted) {
    return true;
  }

  if (scopeType === "all") {
    return false;
  }

  const targetId =
    getScopeTargetId(scope);

  if (!targetId) {
    return false;
  }

  const id = String(targetId);

  switch (scopeType) {
    case "company":
      return context.companyIds.includes(
        id
      );

    case "branch_group":
      return context.branchGroupIds.includes(
        id
      );

    case "branch": {
      if (
        context.branchIds.includes(id)
      ) {
        return true;
      }

      const branch =
        context.branchesById.get(id);

      return Boolean(
        branch?.company_id &&
          context.companyIds.includes(
            String(
              branch.company_id
            )
          )
      );
    }

    case "department":
      return context.departmentIds.includes(
        id
      );

    case "division": {
      if (
        context.divisionIds.includes(id)
      ) {
        return true;
      }

      const division =
        context.divisionsById.get(id);

      return Boolean(
        division?.department_id &&
          context.departmentIds.includes(
            String(
              division.department_id
            )
          )
      );
    }

    case "unit": {
      if (context.unitIds.includes(id)) {
        return true;
      }

      const unit =
        context.unitsById.get(id);

      if (!unit?.division_id) {
        return false;
      }

      const divisionId = String(
        unit.division_id
      );

      if (
        context.divisionIds.includes(
          divisionId
        )
      ) {
        return true;
      }

      const division =
        context.divisionsById.get(
          divisionId
        );

      return Boolean(
        division?.department_id &&
          context.departmentIds.includes(
            String(
              division.department_id
            )
          )
      );
    }

    default:
      return false;
  }
}

export async function validateDelegatedScopes(
  accessContext,
  scopes = []
) {
  if (!Array.isArray(scopes)) {
    return {
      valid: false,
      message:
        "รูปแบบขอบเขตสังกัดไม่ถูกต้อง",
    };
  }

  const activeScopes = scopes.filter(
    (scope) =>
      scope &&
      scope.status !== "inactive"
  );

  /*
   * ไม่ส่ง scope = ให้ API เดิมเป็นคนตัดสิน validation
   * ตัว guard นี้ตรวจเฉพาะการขยายสิทธิ์
   */
  if (!activeScopes.length) {
    return {
      valid: true,
    };
  }

  const context =
    await buildDelegationContext(
      accessContext
    );

  for (const scope of activeScopes) {
    const allowed =
      canDelegateSingleScope(
        scope,
        context
      );

    if (!allowed) {
      return {
        valid: false,
        message:
          "ไม่สามารถกำหนดขอบเขตสังกัดที่อยู่นอกสิทธิ์ของคุณได้",
        scope,
      };
    }
  }

  return {
    valid: true,
  };
}

export async function assertCanDelegateScopes(
  accessContext,
  scopes = []
) {
  try {
    const result =
      await validateDelegatedScopes(
        accessContext,
        scopes
      );

    if (!result.valid) {
      return {
        ok: false,
        response: errorResponse(
          result.message,
          403
        ),
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    console.error(
      "VALIDATE_DELEGATED_SCOPES_ERROR:",
      error
    );

    return {
      ok: false,
      response: errorResponse(
        "ไม่สามารถตรวจสอบขอบเขตที่กำหนดได้",
        500
      ),
    };
  }
}
