import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
   ACCESS SCOPE

   Scope hierarchy:
   company
   branch_group
   branch
   department
   division
   unit

   แนวคิด:
   ---------------------------------------------------------
   Role / Permission
   = ผู้ใช้ "ทำอะไรได้"

   Access Scope
   = ผู้ใช้ "ทำกับข้อมูลไหนได้"
   ========================================================= */

export const ACCESS_SCOPE_TYPES = [
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

/* =========================================================
   Helpers
========================================================= */

function todayISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

function normalizeId(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  return String(value);
}

function normalizeScope(scope = {}) {
  return {
    id: scope.id || null,

    scope_type:
      scope.scope_type || null,

    company_id:
      normalizeId(scope.company_id),

    branch_group_id:
      normalizeId(
        scope.branch_group_id
      ),

    branch_id:
      normalizeId(scope.branch_id),

    department_id:
      normalizeId(
        scope.department_id
      ),

    division_id:
      normalizeId(scope.division_id),

    unit_id:
      normalizeId(scope.unit_id),

    status:
      scope.status || "active",

    sort_order:
      Number(scope.sort_order || 0),
  };
}

/* =========================================================
   Check Assignment Effective Date
========================================================= */

export function isAssignmentEffective(
  assignment,
  date = todayISO()
) {
  if (!assignment) {
    return false;
  }

  if (assignment.status !== "active") {
    return false;
  }

  if (
    assignment.effective_from &&
    assignment.effective_from > date
  ) {
    return false;
  }

  if (
    assignment.effective_to &&
    assignment.effective_to < date
  ) {
    return false;
  }

  return true;
}

/* =========================================================
   Load User Access Context
========================================================= */

/**
 * โหลดขอบเขตงานทั้งหมดของ user_account
 *
 * @param {string} userAccountId
 *
 * @returns
 * {
 *   user_account_id,
 *   assignments: [],
 *   scopes: [],
 *   scope_map: {
 *     company: [],
 *     branch_group: [],
 *     branch: [],
 *     department: [],
 *     division: [],
 *     unit: []
 *   },
 *   unrestricted
 * }
 */
export async function getAccessScope(
  userAccountId
) {
  if (!userAccountId) {
    throw new Error(
      "userAccountId is required"
    );
  }

  const today = todayISO();

  /* =======================================================
     1. User Account
  ======================================================= */

  const {
    data: userAccount,
    error: userError,
  } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      auth_user_id,
      employee_id,
      username,
      role_id,
      is_active
    `)
    .eq("id", userAccountId)
    .maybeSingle();

  if (userError) {
    throw new Error(
      userError.message
    );
  }

  if (!userAccount) {
    throw new Error(
      "ไม่พบ User Account"
    );
  }

  if (!userAccount.is_active) {
    return {
      user_account_id:
        userAccount.id,

      user_account:
        userAccount,

      assignments: [],

      scopes: [],

      scope_map:
        createEmptyScopeMap(),

      unrestricted: false,

      active: false,
    };
  }

  /* =======================================================
     2. Access Assignments
  ======================================================= */

  const {
    data: assignments,
    error: assignmentError,
  } = await supabaseAdmin
    .from(
      "user_access_assignments"
    )
    .select(`
      id,
      user_account_id,
      role_id,
      assignment_name,
      is_primary,
      status,
      effective_from,
      effective_to,

      role:roles (
        id,
        role_code,
        role_name,
        is_active
      )
    `)
    .eq(
      "user_account_id",
      userAccount.id
    )
    .eq("status", "active")
    .lte(
      "effective_from",
      today
    )
    .or(
      `effective_to.is.null,effective_to.gte.${today}`
    )
    .order(
      "is_primary",
      {
        ascending: false,
      }
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  if (assignmentError) {
    throw new Error(
      assignmentError.message
    );
  }

  const activeAssignments =
    (assignments || []).filter(
      (item) =>
        isAssignmentEffective(
          item,
          today
        )
    );

  const assignmentIds =
    activeAssignments.map(
      (item) => item.id
    );

  /* =======================================================
     ไม่มี Assignment
  ======================================================= */

  if (!assignmentIds.length) {
    return {
      user_account_id:
        userAccount.id,

      user_account:
        userAccount,

      assignments: [],

      scopes: [],

      scope_map:
        createEmptyScopeMap(),

      unrestricted: false,

      active: true,
    };
  }

  /* =======================================================
     3. Assignment Scopes

     ตาราง Scope ของระบบ:
     access.user_access_assignment_scopes
  ======================================================= */

  const {
    data: scopeRows,
    error: scopeError,
  } = await supabaseAdmin
    .schema("access")
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
    .order(
      "sort_order",
      {
        ascending: true,
      }
    )
    .order(
      "created_at",
      {
        ascending: true,
      }
    );

  if (scopeError) {
    throw new Error(
      scopeError.message
    );
  }

  const scopes =
    (scopeRows || []).map(
      normalizeScope
    );

  const scopeMap =
    buildScopeMap(scopes);

  return {
    user_account_id:
      userAccount.id,

    user_account:
      userAccount,

    assignments:
      activeAssignments,

    scopes,

    scope_map:
      scopeMap,

    /*
     * false = ต้องยึดตาม Scope
     *
     * ยังไม่ถือว่าไม่มี Scope = ดูได้ทั้งหมด
     * เพื่อความปลอดภัย
     */
    unrestricted: false,

    active: true,
  };
}

/* =========================================================
   Empty Scope Map
========================================================= */

export function createEmptyScopeMap() {
  return {
    company: [],
    branch_group: [],
    branch: [],
    department: [],
    division: [],
    unit: [],
  };
}

/* =========================================================
   Build Scope Map
========================================================= */

export function buildScopeMap(
  scopes = []
) {
  const result =
    createEmptyScopeMap();

  for (const rawScope of scopes) {
    const scope =
      normalizeScope(rawScope);

    switch (
      scope.scope_type
    ) {
      case "company":
        if (scope.company_id) {
          result.company.push(
            scope.company_id
          );
        }
        break;

      case "branch_group":
        if (
          scope.branch_group_id
        ) {
          result.branch_group.push(
            scope.branch_group_id
          );
        }
        break;

      case "branch":
        if (scope.branch_id) {
          result.branch.push(
            scope.branch_id
          );
        }
        break;

      case "department":
        if (
          scope.department_id
        ) {
          result.department.push(
            scope.department_id
          );
        }
        break;

      case "division":
        if (scope.division_id) {
          result.division.push(
            scope.division_id
          );
        }
        break;

      case "unit":
        if (scope.unit_id) {
          result.unit.push(
            scope.unit_id
          );
        }
        break;

      default:
        break;
    }
  }

  /* =======================================================
     Remove duplicate
  ======================================================= */

  for (
    const type
    of ACCESS_SCOPE_TYPES
  ) {
    result[type] = [
      ...new Set(
        result[type]
      ),
    ];
  }

  return result;
}

/* =========================================================
   Get IDs By Scope Type
========================================================= */

/**
 * ตัวอย่าง:
 *
 * getScopeIds(context, "branch")
 *
 * return:
 * [
 *   "uuid-branch-1",
 *   "uuid-branch-2"
 * ]
 */
export function getScopeIds(
  context,
  scopeType
) {
  if (
    !ACCESS_SCOPE_TYPES.includes(
      scopeType
    )
  ) {
    return [];
  }

  return (
    context?.scope_map?.[
      scopeType
    ] || []
  );
}

/* =========================================================
   Has Scope
========================================================= */

/**
 * เช็ค Scope ตรงๆ
 *
 * hasScope(
 *   context,
 *   "branch",
 *   branchId
 * )
 */
export function hasScope(
  context,
  scopeType,
  scopeId
) {
  if (
    !context ||
    !scopeType ||
    !scopeId
  ) {
    return false;
  }

  if (context.unrestricted) {
    return true;
  }

  const ids =
    getScopeIds(
      context,
      scopeType
    );

  return ids.includes(
    String(scopeId)
  );
}

/* =========================================================
   Can Access Record
========================================================= */

/**
 * เช็ค record หนึ่งรายการ
 *
 * ตัวอย่าง employee:
 *
 * canAccessRecord(context, {
 *   company_id,
 *   branch_group_id,
 *   branch_id,
 *   department_id,
 *   division_id,
 *   unit_id
 * })
 *
 * หลักการ:
 * ถ้า Record ตรง Scope อย่างน้อย 1 ระดับ = ผ่าน
 */
export function canAccessRecord(
  context,
  record = {}
) {
  if (!context) {
    return false;
  }

  if (!context.active) {
    return false;
  }

  if (context.unrestricted) {
    return true;
  }

  const map =
    context.scope_map ||
    createEmptyScopeMap();

  /* =======================================================
     Company
  ======================================================= */

  if (
    record.company_id &&
    map.company.includes(
      String(
        record.company_id
      )
    )
  ) {
    return true;
  }

  /* =======================================================
     Branch Group
  ======================================================= */

  if (
    record.branch_group_id &&
    map.branch_group.includes(
      String(
        record.branch_group_id
      )
    )
  ) {
    return true;
  }

  /* =======================================================
     Branch
  ======================================================= */

  if (
    record.branch_id &&
    map.branch.includes(
      String(
        record.branch_id
      )
    )
  ) {
    return true;
  }

  /* =======================================================
     Department
  ======================================================= */

  if (
    record.department_id &&
    map.department.includes(
      String(
        record.department_id
      )
    )
  ) {
    return true;
  }

  /* =======================================================
     Division
  ======================================================= */

  if (
    record.division_id &&
    map.division.includes(
      String(
        record.division_id
      )
    )
  ) {
    return true;
  }

  /* =======================================================
     Unit
  ======================================================= */

  if (
    record.unit_id &&
    map.unit.includes(
      String(
        record.unit_id
      )
    )
  ) {
    return true;
  }

  return false;
}

/* =========================================================
   Filter Records
========================================================= */

/**
 * ใช้กับข้อมูลที่ query มาแล้ว
 *
 * const employees =
 *   filterByAccessScope(
 *     access,
 *     data
 *   );
 */
export function filterByAccessScope(
  context,
  rows = []
) {
  if (!Array.isArray(rows)) {
    return [];
  }

  if (context?.unrestricted) {
    return rows;
  }

  return rows.filter(
    (row) =>
      canAccessRecord(
        context,
        row
      )
  );
}

/* =========================================================
   Require Specific Scope
========================================================= */

/**
 * สำหรับ API detail / update / delete
 *
 * requireScope(
 *   access,
 *   "branch",
 *   branchId
 * )
 *
 * ถ้าไม่มีสิทธิ์จะ throw error
 */
export function requireScope(
  context,
  scopeType,
  scopeId
) {
  const allowed =
    hasScope(
      context,
      scopeType,
      scopeId
    );

  if (!allowed) {
    const error =
      new Error(
        "คุณไม่มีสิทธิ์เข้าถึงข้อมูลในขอบเขตนี้"
      );

    error.status = 403;
    error.code =
      "ACCESS_SCOPE_DENIED";

    throw error;
  }

  return true;
}

/* =========================================================
   Require Record Scope
========================================================= */

/**
 * เหมาะกับ employee / transaction
 *
 * requireRecordScope(
 *   access,
 *   employee
 * )
 */
export function requireRecordScope(
  context,
  record
) {
  const allowed =
    canAccessRecord(
      context,
      record
    );

  if (!allowed) {
    const error =
      new Error(
        "คุณไม่มีสิทธิ์เข้าถึงข้อมูลรายการนี้"
      );

    error.status = 403;
    error.code =
      "ACCESS_SCOPE_DENIED";

    throw error;
  }

  return true;
}

/* =========================================================
   Build Supabase Query By Scope
========================================================= */

/**
 * ใช้กรณีตารางนั้นมี column ตรงกับ Scope
 *
 * ตัวอย่าง:
 *
 * let query =
 *   supabaseAdmin
 *     .from("employees")
 *     .select("*");
 *
 * query =
 *   applyAccessScope(
 *     query,
 *     access
 *   );
 *
 * const { data } =
 *   await query;
 *
 *
 * IMPORTANT:
 *
 * OR Logic:
 *
 * company_id IN (...)
 * OR
 * branch_group_id IN (...)
 * OR
 * branch_id IN (...)
 * OR
 * department_id IN (...)
 * OR
 * division_id IN (...)
 * OR
 * unit_id IN (...)
 */
export function applyAccessScope(
  query,
  context,
  options = {}
) {
  if (!query) {
    throw new Error(
      "Supabase query is required"
    );
  }

  if (!context) {
    throw new Error(
      "Access context is required"
    );
  }

  if (context.unrestricted) {
    return query;
  }

  const {
    companyColumn =
      "company_id",

    branchGroupColumn =
      "branch_group_id",

    branchColumn =
      "branch_id",

    departmentColumn =
      "department_id",

    divisionColumn =
      "division_id",

    unitColumn =
      "unit_id",
  } = options;

  const map =
    context.scope_map ||
    createEmptyScopeMap();

  const conditions = [];

  /* =======================================================
     Company
  ======================================================= */

  if (
    map.company.length
  ) {
    conditions.push(
      `${companyColumn}.in.(${map.company.join(
        ","
      )})`
    );
  }

  /* =======================================================
     Branch Group
  ======================================================= */

  if (
    map.branch_group.length
  ) {
    conditions.push(
      `${branchGroupColumn}.in.(${map.branch_group.join(
        ","
      )})`
    );
  }

  /* =======================================================
     Branch
  ======================================================= */

  if (
    map.branch.length
  ) {
    conditions.push(
      `${branchColumn}.in.(${map.branch.join(
        ","
      )})`
    );
  }

  /* =======================================================
     Department
  ======================================================= */

  if (
    map.department.length
  ) {
    conditions.push(
      `${departmentColumn}.in.(${map.department.join(
        ","
      )})`
    );
  }

  /* =======================================================
     Division
  ======================================================= */

  if (
    map.division.length
  ) {
    conditions.push(
      `${divisionColumn}.in.(${map.division.join(
        ","
      )})`
    );
  }

  /* =======================================================
     Unit
  ======================================================= */

  if (
    map.unit.length
  ) {
    conditions.push(
      `${unitColumn}.in.(${map.unit.join(
        ","
      )})`
    );
  }

  /*
   * ไม่มี Scope
   *
   * ห้ามปล่อย Query ผ่าน
   * เพราะจะกลายเป็นเห็นข้อมูลทั้งหมด
   */
  if (!conditions.length) {
    return query.eq(
      "id",
      "__NO_ACCESS__"
    );
  }

  return query.or(
    conditions.join(",")
  );
}


/* =========================================================
   Access Resource Helpers

   ใช้สำหรับ Master API เช่น:

   companies/[id]
   branches/[id]
   departments/[id]
   divisions/[id]
   units/[id]

   IMPORTANT:
   ---------------------------------------------------------
   ไม่ได้ดูเฉพาะ scope_type

   เช่น:
   scope_type = "branch"
   แต่ row นั้นมี:
   company_id = xxx
   branch_id = xxx

   User จึงสามารถเข้าถึง Company แม่ได้ด้วย
========================================================= */

/* =========================================================
   Generic Resource Access
========================================================= */

export function canAccessResource(
  context,
  field,
  resourceId
) {
  if (
    !context ||
    !field ||
    !resourceId
  ) {
    return false;
  }

  /* =======================================================
     User inactive
  ======================================================= */

  if (context.active === false) {
    return false;
  }

  /* =======================================================
     Unrestricted
  ======================================================= */

  if (context.unrestricted) {
    return true;
  }

  const targetId =
    String(resourceId);

  /* =======================================================
     Check every active scope row

     ตัวอย่าง:

     canAccessResource(
       access,
       "company_id",
       companyId
     )

     จะหา company_id จาก Scope ทุกประเภท
  ======================================================= */

  return (
    context.scopes || []
  ).some((scope) => {
    if (!scope) {
      return false;
    }

    if (
      scope.status &&
      scope.status !== "active"
    ) {
      return false;
    }

    const value =
      scope[field];

    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return false;
    }

    return (
      String(value) ===
      targetId
    );
  });
}

/* =========================================================
   Company
========================================================= */

/**
 * เช็คว่าสามารถเข้าถึง Company นี้ได้หรือไม่
 *
 * รองรับ Scope ทุกระดับที่มี company_id
 *
 * เช่น:
 *
 * company
 * branch_group
 * branch
 * department
 * division
 * unit
 */
export function canAccessCompany(
  context,
  companyId
) {
  return canAccessResource(
    context,
    "company_id",
    companyId
  );
}

/* =========================================================
   Branch Group
========================================================= */

export function canAccessBranchGroup(
  context,
  branchGroupId
) {
  return canAccessResource(
    context,
    "branch_group_id",
    branchGroupId
  );
}

/* =========================================================
   Branch
========================================================= */

export function canAccessBranch(
  context,
  branchId
) {
  return canAccessResource(
    context,
    "branch_id",
    branchId
  );
}

/* =========================================================
   Department
========================================================= */

export function canAccessDepartment(
  context,
  departmentId
) {
  return canAccessResource(
    context,
    "department_id",
    departmentId
  );
}

/* =========================================================
   Division
========================================================= */

export function canAccessDivision(
  context,
  divisionId
) {
  return canAccessResource(
    context,
    "division_id",
    divisionId
  );
}

/* =========================================================
   Unit
========================================================= */

export function canAccessUnit(
  context,
  unitId
) {
  return canAccessResource(
    context,
    "unit_id",
    unitId
  );
}

/* =========================================================
   Get Accessible Resource IDs
========================================================= */

/**
 * ดึง ID จาก Scope ทุก row
 *
 * ตัวอย่าง:
 *
 * const companyIds =
 *   getAccessibleResourceIds(
 *     access,
 *     "company_id"
 *   );
 *
 * ใช้กับ:
 *
 * query.in("id", companyIds)
 */
export function getAccessibleResourceIds(
  context,
  field
) {
  if (
    !context ||
    !field
  ) {
    return [];
  }

  const ids =
    (context.scopes || [])
      .filter((scope) => {
        if (!scope) {
          return false;
        }

        if (
          scope.status &&
          scope.status !==
            "active"
        ) {
          return false;
        }

        return Boolean(
          scope[field]
        );
      })
      .map((scope) =>
        String(scope[field])
      );

  return [
    ...new Set(ids),
  ];
}

/* =========================================================
   Get Company IDs
========================================================= */

export function getAccessibleCompanyIds(
  context
) {
  return getAccessibleResourceIds(
    context,
    "company_id"
  );
}

/* =========================================================
   Get Branch Group IDs
========================================================= */

export function getAccessibleBranchGroupIds(
  context
) {
  return getAccessibleResourceIds(
    context,
    "branch_group_id"
  );
}

/* =========================================================
   Get Branch IDs
========================================================= */

export function getAccessibleBranchIds(
  context
) {
  return getAccessibleResourceIds(
    context,
    "branch_id"
  );
}

/* =========================================================
   Get Department IDs
========================================================= */

export function getAccessibleDepartmentIds(
  context
) {
  return getAccessibleResourceIds(
    context,
    "department_id"
  );
}

/* =========================================================
   Get Division IDs
========================================================= */

export function getAccessibleDivisionIds(
  context
) {
  return getAccessibleResourceIds(
    context,
    "division_id"
  );
}

/* =========================================================
   Get Unit IDs
========================================================= */

export function getAccessibleUnitIds(
  context
) {
  return getAccessibleResourceIds(
    context,
    "unit_id"
  );
}

/* =========================================================
   Require Resource Access
========================================================= */

/**
 * Generic Require
 *
 * ถ้าเข้าไม่ได้:
 *
 * throw Error
 * status = 403
 * code = ACCESS_SCOPE_DENIED
 */
export function requireResourceAccess(
  context,
  field,
  resourceId,
  message =
    "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
) {
  const allowed =
    canAccessResource(
      context,
      field,
      resourceId
    );

  if (!allowed) {
    const error =
      new Error(message);

    error.status = 403;

    error.code =
      "ACCESS_SCOPE_DENIED";

    throw error;
  }

  return true;
}

/* =========================================================
   Require Company
========================================================= */

export function requireCompanyAccess(
  context,
  companyId
) {
  return requireResourceAccess(
    context,
    "company_id",
    companyId,
    "คุณไม่มีสิทธิ์เข้าถึงบริษัทนี้"
  );
}

/* =========================================================
   Require Branch Group
========================================================= */

export function requireBranchGroupAccess(
  context,
  branchGroupId
) {
  return requireResourceAccess(
    context,
    "branch_group_id",
    branchGroupId,
    "คุณไม่มีสิทธิ์เข้าถึงกลุ่มสาขานี้"
  );
}

/* =========================================================
   Require Branch
========================================================= */

export function requireBranchAccess(
  context,
  branchId
) {
  return requireResourceAccess(
    context,
    "branch_id",
    branchId,
    "คุณไม่มีสิทธิ์เข้าถึงสาขานี้"
  );
}

/* =========================================================
   Require Department
========================================================= */

export function requireDepartmentAccess(
  context,
  departmentId
) {
  return requireResourceAccess(
    context,
    "department_id",
    departmentId,
    "คุณไม่มีสิทธิ์เข้าถึงแผนกนี้"
  );
}

/* =========================================================
   Require Division
========================================================= */

export function requireDivisionAccess(
  context,
  divisionId
) {
  return requireResourceAccess(
    context,
    "division_id",
    divisionId,
    "คุณไม่มีสิทธิ์เข้าถึงฝ่ายนี้"
  );
}

/* =========================================================
   Require Unit
========================================================= */

export function requireUnitAccess(
  context,
  unitId
) {
  return requireResourceAccess(
    context,
    "unit_id",
    unitId,
    "คุณไม่มีสิทธิ์เข้าถึงหน่วยงานนี้"
  );
}


/* =========================================================
   Simple API Helper
========================================================= */

/**
 * จุดประสงค์คือ API เรียกแค่:
 *
 * const access =
 *   await accessScope(
 *     user.id
 *   );
 *
 */
export async function accessScope(
  userAccountId
) {
  return getAccessScope(
    userAccountId
  );
}