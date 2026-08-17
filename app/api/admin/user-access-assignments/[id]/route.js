import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   Constants
========================================================= */

const ASSIGNMENT_TABLE =
  "user_access_assignments";

const SCOPE_TABLE =
  "user_access_assignment_scopes";

const VALID_STATUSES = [
  "active",
  "inactive",
];

const VALID_SCOPE_TYPES = [
  "all",
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

const ASSIGNMENT_SELECT = `
  id,
  user_account_id,
  role_id,
  assignment_name,
  is_primary,
  status,
  effective_from,
  effective_to,
  created_by,
  updated_by,
  created_at,
  updated_at
`;

const SCOPE_SELECT = `
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
`;

/* =========================================================
   Helpers
========================================================= */

function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);

  return text || null;
}

function cleanNullableDate(value) {
  const text = cleanText(value);

  return text || null;
}

function cleanBoolean(
  value,
  fallback = false
) {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === true ||
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return fallback;
}

function cleanInteger(
  value,
  fallback = 0
) {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    return fallback;
  }

  return number;
}

function normalizeStatus(
  value,
  fallback = "active"
) {
  const status =
    cleanText(value).toLowerCase() ||
    fallback;

  return VALID_STATUSES.includes(status)
    ? status
    : null;
}

function normalizeScopeType(value) {
  const scopeType =
    cleanText(value).toLowerCase();

  return VALID_SCOPE_TYPES.includes(
    scopeType
  )
    ? scopeType
    : null;
}

function isValidDateRange(
  effectiveFrom,
  effectiveTo
) {
  if (!effectiveFrom) {
    return false;
  }

  if (!effectiveTo) {
    return true;
  }

  return effectiveTo >= effectiveFrom;
}

function uniqueArray(values = []) {
  return [...new Set(values.filter(Boolean))];
}

/* =========================================================
   Activity Log
========================================================= */

async function safeWriteActivityLog(
  payload
) {
  try {
    await writeActivityLog(payload);
  } catch (error) {
    console.error(
      "[user-access-assignments] activity log error:",
      error
    );
  }
}

/* =========================================================
   Load Assignment
========================================================= */

async function getAssignment(id) {
  const { data, error } =
    await supabaseAdmin
      .from(ASSIGNMENT_TABLE)
      .select(ASSIGNMENT_SELECT)
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   Load Assignment Scopes
========================================================= */

async function getAssignmentScopes(
  assignmentId
) {
  const { data, error } =
    await supabaseAdmin
      .from(SCOPE_TABLE)
      .select(SCOPE_SELECT)
      .eq(
        "user_access_assignment_id",
        assignmentId
      )
      .order("sort_order", {
        ascending: true,
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
   Load User Account
========================================================= */

async function getUserAccount(
  userAccountId
) {
  const { data, error } =
    await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        username,
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

/* =========================================================
   Load Employee
========================================================= */

async function getEmployee(employeeId) {
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
        nick_name,
        employee_photo_url,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        status
      `)
      .eq("id", employeeId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,

    full_name_th: [
      data.first_name_th,
      data.last_name_th,
    ]
      .filter(Boolean)
      .join(" ")
      .trim(),

    full_name_en: [
      data.first_name_en,
      data.last_name_en,
    ]
      .filter(Boolean)
      .join(" ")
      .trim(),
  };
}

/* =========================================================
   Load Role
========================================================= */

async function getRole(roleId) {
  const { data, error } =
    await supabaseAdmin
      .from("roles")
      .select(`
        id,
        role_code,
        role_name,
        description,
        is_active,
        is_system
      `)
      .eq("id", roleId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   Enrich Scope Targets

   โหลดชื่อของ Company / Branch Group / Branch /
   Department / Division / Unit แยกต่างหาก
   เพื่อไม่ขึ้นกับชื่อ Supabase relationship
========================================================= */

async function enrichScopes(scopes = []) {
  if (!scopes.length) {
    return [];
  }

  const companyIds = uniqueArray(
    scopes.map((item) => item.company_id)
  );

  const branchGroupIds = uniqueArray(
    scopes.map(
      (item) => item.branch_group_id
    )
  );

  const branchIds = uniqueArray(
    scopes.map((item) => item.branch_id)
  );

  const departmentIds = uniqueArray(
    scopes.map(
      (item) => item.department_id
    )
  );

  const divisionIds = uniqueArray(
    scopes.map((item) => item.division_id)
  );

  const unitIds = uniqueArray(
    scopes.map((item) => item.unit_id)
  );

  const [
    companiesResult,
    branchGroupsResult,
    branchesResult,
    departmentsResult,
    divisionsResult,
    unitsResult,
  ] = await Promise.all([
    companyIds.length
      ? supabaseAdmin
          .from("companies")
          .select(`
            id,
            company_code,
            company_name_th,
            company_name_en,
            status
          `)
          .in("id", companyIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    branchGroupIds.length
      ? supabaseAdmin
          .from("branch_groups")
          .select(`
            id,
            group_code,
            group_name,
            group_color,
            status
          `)
          .in("id", branchGroupIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    branchIds.length
      ? supabaseAdmin
          .from("branches")
          .select(`
            id,
            company_id,
            branch_code,
            branch_name,
            status
          `)
          .in("id", branchIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    departmentIds.length
      ? supabaseAdmin
          .from("departments")
          .select(`
            id,
            department_code,
            department_name,
            status
          `)
          .in("id", departmentIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    divisionIds.length
      ? supabaseAdmin
          .from("divisions")
          .select(`
            id,
            department_id,
            division_code,
            division_name,
            status
          `)
          .in("id", divisionIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    unitIds.length
      ? supabaseAdmin
          .from("units")
          .select(`
            id,
            division_id,
            unit_code,
            unit_name,
            status
          `)
          .in("id", unitIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  const results = [
    companiesResult,
    branchGroupsResult,
    branchesResult,
    departmentsResult,
    divisionsResult,
    unitsResult,
  ];

  const firstError = results.find(
    (result) => result.error
  )?.error;

  if (firstError) {
    throw firstError;
  }

  const companyMap = new Map(
    (companiesResult.data || []).map(
      (item) => [item.id, item]
    )
  );

  const branchGroupMap = new Map(
    (branchGroupsResult.data || []).map(
      (item) => [item.id, item]
    )
  );

  const branchMap = new Map(
    (branchesResult.data || []).map(
      (item) => [item.id, item]
    )
  );

  const departmentMap = new Map(
    (departmentsResult.data || []).map(
      (item) => [item.id, item]
    )
  );

  const divisionMap = new Map(
    (divisionsResult.data || []).map(
      (item) => [item.id, item]
    )
  );

  const unitMap = new Map(
    (unitsResult.data || []).map(
      (item) => [item.id, item]
    )
  );

  return scopes.map((scope) => {
    let target = null;
    let targetId = null;
    let targetCode = null;
    let targetName = null;

    if (scope.scope_type === "all") {
      target = {
        id: null,
        code: "ALL",
        name: "ทุกสังกัด",
      };

      targetCode = "ALL";
      targetName = "ทุกสังกัด";
    }

    if (scope.scope_type === "company") {
      target =
        companyMap.get(scope.company_id) ||
        null;

      targetId = scope.company_id;

      targetCode =
        target?.company_code || null;

      targetName =
        target?.company_name_th ||
        target?.company_name_en ||
        null;
    }

    if (
      scope.scope_type ===
      "branch_group"
    ) {
      target =
        branchGroupMap.get(
          scope.branch_group_id
        ) || null;

      targetId = scope.branch_group_id;

      targetCode =
        target?.group_code || null;

      targetName =
        target?.group_name || null;
    }

    if (scope.scope_type === "branch") {
      target =
        branchMap.get(scope.branch_id) ||
        null;

      targetId = scope.branch_id;

      targetCode =
        target?.branch_code || null;

      targetName =
        target?.branch_name || null;
    }

    if (
      scope.scope_type === "department"
    ) {
      target =
        departmentMap.get(
          scope.department_id
        ) || null;

      targetId = scope.department_id;

      targetCode =
        target?.department_code || null;

      targetName =
        target?.department_name || null;
    }

    if (
      scope.scope_type === "division"
    ) {
      target =
        divisionMap.get(
          scope.division_id
        ) || null;

      targetId = scope.division_id;

      targetCode =
        target?.division_code || null;

      targetName =
        target?.division_name || null;
    }

    if (scope.scope_type === "unit") {
      target =
        unitMap.get(scope.unit_id) ||
        null;

      targetId = scope.unit_id;

      targetCode =
        target?.unit_code || null;

      targetName =
        target?.unit_name || null;
    }

    return {
      ...scope,

      target_id: targetId,
      target_code: targetCode,
      target_name: targetName,
      target,
    };
  });
}

/* =========================================================
   Enrich Assignment
========================================================= */

async function enrichAssignment(
  assignment
) {
  if (!assignment) {
    return null;
  }

  const [userAccount, role, scopes] =
    await Promise.all([
      getUserAccount(
        assignment.user_account_id
      ),

      getRole(assignment.role_id),

      getAssignmentScopes(assignment.id),
    ]);

  const [employee, enrichedScopes] =
    await Promise.all([
      getEmployee(
        userAccount?.employee_id
      ),

      enrichScopes(scopes),
    ]);

  return {
    ...assignment,

    user_account: userAccount,

    employee,

    role,

    scopes: enrichedScopes,

    scope_count: enrichedScopes.length,
  };
}

/* =========================================================
   Duplicate Assignment
========================================================= */

async function findDuplicateAssignment({
  userAccountId,
  roleId,
  excludeId,
}) {
  let query = supabaseAdmin
    .from(ASSIGNMENT_TABLE)
    .select("id")
    .eq(
      "user_account_id",
      userAccountId
    )
    .eq("role_id", roleId);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } =
    await query.limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

/* =========================================================
   Clear Other Primary Assignments
========================================================= */

async function clearOtherPrimaryAssignments({
  userAccountId,
  excludeId,
}) {
  let query = supabaseAdmin
    .from(ASSIGNMENT_TABLE)
    .update({
      is_primary: false,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "user_account_id",
      userAccountId
    )
    .eq("is_primary", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { error } = await query;

  if (error) {
    throw error;
  }
}

/* =========================================================
   Scope Validation
========================================================= */

function normalizeScopePayload(
  scope,
  index
) {
  const scopeType = normalizeScopeType(
    scope?.scope_type
  );

  const status = normalizeStatus(
    scope?.status,
    "active"
  );

  if (!scopeType) {
    return {
      valid: false,
      message: `ขอบเขตลำดับที่ ${
        index + 1
      } มีประเภทไม่ถูกต้อง`,
    };
  }

  if (!status) {
    return {
      valid: false,
      message: `ขอบเขตลำดับที่ ${
        index + 1
      } มีสถานะไม่ถูกต้อง`,
    };
  }

  const payload = {
    scope_type: scopeType,

    company_id:
      scopeType === "company"
        ? cleanNullableText(
            scope?.company_id
          )
        : null,

    branch_group_id:
      scopeType === "branch_group"
        ? cleanNullableText(
            scope?.branch_group_id
          )
        : null,

    branch_id:
      scopeType === "branch"
        ? cleanNullableText(
            scope?.branch_id
          )
        : null,

    department_id:
      scopeType === "department"
        ? cleanNullableText(
            scope?.department_id
          )
        : null,

    division_id:
      scopeType === "division"
        ? cleanNullableText(
            scope?.division_id
          )
        : null,

    unit_id:
      scopeType === "unit"
        ? cleanNullableText(
            scope?.unit_id
          )
        : null,

    status,

    sort_order: cleanInteger(
      scope?.sort_order,
      index
    ),
  };

  const requiredTargetMap = {
    company: payload.company_id,

    branch_group:
      payload.branch_group_id,

    branch: payload.branch_id,

    department:
      payload.department_id,

    division: payload.division_id,

    unit: payload.unit_id,
  };

  if (
    scopeType !== "all" &&
    !requiredTargetMap[scopeType]
  ) {
    return {
      valid: false,
      message: `ขอบเขตลำดับที่ ${
        index + 1
      } กรุณาเลือกข้อมูล ${scopeType}`,
    };
  }

  return {
    valid: true,
    payload,
  };
}

function validateScopes(scopes) {
  if (!Array.isArray(scopes)) {
    return {
      valid: false,
      message:
        "scopes ต้องเป็น Array เท่านั้น",
    };
  }

  const normalizedScopes = [];

  for (
    let index = 0;
    index < scopes.length;
    index += 1
  ) {
    const result =
      normalizeScopePayload(
        scopes[index],
        index
      );

    if (!result.valid) {
      return result;
    }

    normalizedScopes.push(
      result.payload
    );
  }

  const allScopes =
    normalizedScopes.filter(
      (scope) =>
        scope.scope_type === "all"
    );

  if (
    allScopes.length > 0 &&
    normalizedScopes.length > 1
  ) {
    return {
      valid: false,
      message:
        "ขอบเขตทุกสังกัดไม่สามารถใช้ร่วมกับขอบเขตประเภทอื่นได้",
    };
  }

  if (allScopes.length > 1) {
    return {
      valid: false,
      message:
        "สามารถกำหนดขอบเขตทุกสังกัดได้เพียงหนึ่งรายการ",
    };
  }

  const duplicateKeys = new Set();

  for (const scope of normalizedScopes) {
    const targetId =
      scope.company_id ||
      scope.branch_group_id ||
      scope.branch_id ||
      scope.department_id ||
      scope.division_id ||
      scope.unit_id ||
      "all";

    const duplicateKey =
      `${scope.scope_type}:${targetId}`;

    if (
      duplicateKeys.has(duplicateKey)
    ) {
      return {
        valid: false,
        message:
          "พบขอบเขตสังกัดซ้ำในรายการ",
      };
    }

    duplicateKeys.add(duplicateKey);
  }

  return {
    valid: true,
    scopes: normalizedScopes,
  };
}

/* =========================================================
   Validate Scope Target IDs
========================================================= */

async function validateScopeTargets(
  scopes
) {
  const targetGroups = {
    company: {
      table: "companies",
      ids: uniqueArray(
        scopes
          .filter(
            (scope) =>
              scope.scope_type ===
              "company"
          )
          .map(
            (scope) => scope.company_id
          )
      ),
    },

    branch_group: {
      table: "branch_groups",
      ids: uniqueArray(
        scopes
          .filter(
            (scope) =>
              scope.scope_type ===
              "branch_group"
          )
          .map(
            (scope) =>
              scope.branch_group_id
          )
      ),
    },

    branch: {
      table: "branches",
      ids: uniqueArray(
        scopes
          .filter(
            (scope) =>
              scope.scope_type ===
              "branch"
          )
          .map(
            (scope) => scope.branch_id
          )
      ),
    },

    department: {
      table: "departments",
      ids: uniqueArray(
        scopes
          .filter(
            (scope) =>
              scope.scope_type ===
              "department"
          )
          .map(
            (scope) =>
              scope.department_id
          )
      ),
    },

    division: {
      table: "divisions",
      ids: uniqueArray(
        scopes
          .filter(
            (scope) =>
              scope.scope_type ===
              "division"
          )
          .map(
            (scope) =>
              scope.division_id
          )
      ),
    },

    unit: {
      table: "units",
      ids: uniqueArray(
        scopes
          .filter(
            (scope) =>
              scope.scope_type ===
              "unit"
          )
          .map(
            (scope) => scope.unit_id
          )
      ),
    },
  };

  for (const [
    scopeType,
    config,
  ] of Object.entries(targetGroups)) {
    if (!config.ids.length) {
      continue;
    }

    const { data, error } =
      await supabaseAdmin
        .from(config.table)
        .select("id")
        .in("id", config.ids);

    if (error) {
      throw error;
    }

    const foundIds = new Set(
      (data || []).map((item) => item.id)
    );

    const missingIds = config.ids.filter(
      (targetId) =>
        !foundIds.has(targetId)
    );

    if (missingIds.length > 0) {
      return {
        valid: false,
        message: `ไม่พบข้อมูลขอบเขตประเภท ${scopeType} บางรายการ`,
      };
    }
  }

  return {
    valid: true,
  };
}

/* =========================================================
   Replace Scopes

   มี Rollback แบบ Best Effort:
   ถ้า Insert Scope ใหม่ไม่สำเร็จ
   จะพยายามนำ Scope เดิมกลับคืน
========================================================= */

async function replaceAssignmentScopes({
  assignmentId,
  scopes,
  oldScopes,
}) {
  const { error: deleteError } =
    await supabaseAdmin
      .from(SCOPE_TABLE)
      .delete()
      .eq(
        "user_access_assignment_id",
        assignmentId
      );

  if (deleteError) {
    throw deleteError;
  }

  if (!scopes.length) {
    return [];
  }

  const now = new Date().toISOString();

  const insertPayload = scopes.map(
    (scope) => ({
      user_access_assignment_id:
        assignmentId,

      ...scope,

      created_at: now,
      updated_at: now,
    })
  );

  const {
    data,
    error: insertError,
  } = await supabaseAdmin
    .from(SCOPE_TABLE)
    .insert(insertPayload)
    .select(SCOPE_SELECT);

  if (!insertError) {
    return data || [];
  }

  console.error(
    "[user-access-assignments] insert new scopes error:",
    insertError
  );

  /*
   * พยายามคืนค่า Scope เดิม
   */

  if (oldScopes.length > 0) {
    const rollbackPayload =
      oldScopes.map((scope) => ({
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

        status: scope.status,

        sort_order:
          scope.sort_order,

        created_at:
          scope.created_at,

        updated_at:
          scope.updated_at,
      }));

    const { error: rollbackError } =
      await supabaseAdmin
        .from(SCOPE_TABLE)
        .insert(rollbackPayload);

    if (rollbackError) {
      console.error(
        "[user-access-assignments] rollback scopes error:",
        rollbackError
      );
    }
  }

  throw insertError;
}

/* =========================================================
   GET
   /api/admin/user-access-assignments/[id]
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัสรายการกำหนดบทบาท",
        },
        {
          status: 400,
        }
      );
    }

    const assignment =
      await getAssignment(id);

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบข้อมูลการกำหนดบทบาทผู้ใช้งาน",
        },
        {
          status: 404,
        }
      );
    }

    const data =
      await enrichAssignment(
        assignment
      );

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/user-access-assignments/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "ไม่สามารถโหลดข้อมูลการกำหนดบทบาทผู้ใช้งานได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
   /api/admin/user-access-assignments/[id]

   รองรับ Body:

   {
     "user_account_id": "...",
     "role_id": "...",
     "assignment_name": "...",
     "is_primary": true,
     "status": "active",
     "effective_from": "2026-08-06",
     "effective_to": null,
     "updated_by": "...",

     "scopes": [
       {
         "scope_type": "branch",
         "branch_id": "...",
         "status": "active",
         "sort_order": 1
       }
     ]
   }

   หมายเหตุ:
   - ถ้าไม่ส่ง scopes จะไม่แก้ Scope เดิม
   - ถ้าส่ง scopes: [] จะลบ Scope ทั้งหมด
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัสรายการกำหนดบทบาท",
        },
        {
          status: 400,
        }
      );
    }

    const oldAssignment =
      await getAssignment(id);

    if (!oldAssignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบข้อมูลการกำหนดบทบาทผู้ใช้งาน",
        },
        {
          status: 404,
        }
      );
    }

    const oldScopes =
      await getAssignmentScopes(id);

    const userAccountId =
      body?.user_account_id !==
      undefined
        ? cleanText(
            body.user_account_id
          )
        : oldAssignment.user_account_id;

    const roleId =
      body?.role_id !== undefined
        ? cleanText(body.role_id)
        : oldAssignment.role_id;

    const assignmentName =
      body?.assignment_name !==
      undefined
        ? cleanNullableText(
            body.assignment_name
          )
        : oldAssignment.assignment_name;

    let isPrimary =
      body?.is_primary !== undefined
        ? cleanBoolean(
            body.is_primary,
            oldAssignment.is_primary
          )
        : oldAssignment.is_primary;

    const status =
      body?.status !== undefined
        ? normalizeStatus(body.status)
        : oldAssignment.status;

    const effectiveFrom =
      body?.effective_from !==
      undefined
        ? cleanNullableDate(
            body.effective_from
          )
        : oldAssignment.effective_from;

    const effectiveTo =
      body?.effective_to !== undefined
        ? cleanNullableDate(
            body.effective_to
          )
        : oldAssignment.effective_to;

    const updatedBy =
      body?.updated_by !== undefined
        ? cleanNullableText(
            body.updated_by
          )
        : oldAssignment.updated_by;

    if (!userAccountId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาเลือกผู้ใช้งานระบบ",
        },
        {
          status: 400,
        }
      );
    }

    if (!roleId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาเลือกบทบาทผู้ใช้งาน",
        },
        {
          status: 400,
        }
      );
    }

    if (!status) {
      return NextResponse.json(
        {
          success: false,
          message:
            "สถานะต้องเป็น active หรือ inactive เท่านั้น",
        },
        {
          status: 400,
        }
      );
    }

    if (!effectiveFrom) {
      return NextResponse.json(
        {
          success: false,
          message:
            "กรุณาระบุวันที่เริ่มต้น",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isValidDateRange(
        effectiveFrom,
        effectiveTo
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Assignment ที่ inactive
     * ไม่ควรเป็น Primary
     */

    if (status === "inactive") {
      isPrimary = false;
    }

    const [
      userAccount,
      role,
      duplicate,
    ] = await Promise.all([
      getUserAccount(userAccountId),

      getRole(roleId),

      findDuplicateAssignment({
        userAccountId,
        roleId,
        excludeId: id,
      }),
    ]);

    if (!userAccount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบผู้ใช้งานระบบที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบบทบาทผู้ใช้งานที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    if (!role.is_active) {
      return NextResponse.json(
        {
          success: false,
          message:
            "บทบาทผู้ใช้งานที่เลือกถูกปิดใช้งาน",
        },
        {
          status: 400,
        }
      );
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ผู้ใช้งานนี้ได้รับบทบาทดังกล่าวแล้ว",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Validate Scope เฉพาะกรณี Frontend ส่งมา
     */

    let normalizedScopes = null;

    if (body?.scopes !== undefined) {
      const scopeValidation =
        validateScopes(body.scopes);

      if (!scopeValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            message:
              scopeValidation.message,
          },
          {
            status: 400,
          }
        );
      }

      normalizedScopes =
        scopeValidation.scopes;

      const targetValidation =
        await validateScopeTargets(
          normalizedScopes
        );

      if (!targetValidation.valid) {
        return NextResponse.json(
          {
            success: false,
            message:
              targetValidation.message,
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * ปิด Primary เดิมก่อน
     */

    if (isPrimary) {
      await clearOtherPrimaryAssignments({
        userAccountId,
        excludeId: id,
      });
    }

    const assignmentPayload = {
      user_account_id: userAccountId,
      role_id: roleId,
      assignment_name:
        assignmentName,
      is_primary: isPrimary,
      status,
      effective_from: effectiveFrom,
      effective_to: effectiveTo,
      updated_by: updatedBy,
      updated_at:
        new Date().toISOString(),
    };

    const {
      data: updatedAssignment,
      error: updateError,
    } = await supabaseAdmin
      .from(ASSIGNMENT_TABLE)
      .update(assignmentPayload)
      .eq("id", id)
      .select(ASSIGNMENT_SELECT)
      .single();

    if (updateError) {
      throw updateError;
    }

    /*
     * ถ้าส่ง scopes มา ให้แทนที่ Scope เดิมทั้งหมด
     */

    if (normalizedScopes !== null) {
      try {
        await replaceAssignmentScopes({
          assignmentId: id,
          scopes: normalizedScopes,
          oldScopes,
        });
      } catch (scopeError) {
        /*
         * พยายามคืนค่า Assignment เดิม
         */

        const {
          error: assignmentRollbackError,
        } = await supabaseAdmin
          .from(ASSIGNMENT_TABLE)
          .update({
            user_account_id:
              oldAssignment.user_account_id,

            role_id:
              oldAssignment.role_id,

            assignment_name:
              oldAssignment.assignment_name,

            is_primary:
              oldAssignment.is_primary,

            status:
              oldAssignment.status,

            effective_from:
              oldAssignment.effective_from,

            effective_to:
              oldAssignment.effective_to,

            updated_by:
              oldAssignment.updated_by,

            updated_at:
              oldAssignment.updated_at,
          })
          .eq("id", id);

        if (assignmentRollbackError) {
          console.error(
            "[user-access-assignments] rollback assignment error:",
            assignmentRollbackError
          );
        }

        throw scopeError;
      }
    }

    const finalData =
      await enrichAssignment(
        updatedAssignment
      );

    await safeWriteActivityLog({
      module_name:
        "user_access_assignments",

      action_type: "UPDATE",

      reference_table:
        ASSIGNMENT_TABLE,

      reference_id: id,

      description:
        `แก้ไขบทบาท ${role.role_name} ` +
        `ของผู้ใช้งาน ${userAccount.username}`,

      old_data: {
        assignment: oldAssignment,
        scopes: oldScopes,
      },

      new_data: {
        assignment:
          updatedAssignment,

        scopes:
          finalData?.scopes || [],
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "แก้ไขบทบาทและขอบเขตสังกัดเรียบร้อยแล้ว",

      data: finalData,
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/user-access-assignments/[id] error:",
      error
    );

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message:
            "พบข้อมูลบทบาทหรือขอบเขตสังกัดซ้ำ",
        },
        {
          status: 409,
        }
      );
    }

    if (error?.code === "23503") {
      return NextResponse.json(
        {
          success: false,
          message:
            "ข้อมูลผู้ใช้งาน บทบาท หรือขอบเขตสังกัดไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    if (error?.code === "23514") {
      return NextResponse.json(
        {
          success: false,
          message:
            "ข้อมูลขอบเขตสังกัดไม่ตรงกับประเภทที่เลือก",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "ไม่สามารถแก้ไขบทบาทผู้ใช้งานได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
   /api/admin/user-access-assignments/[id]

   user_access_assignment_scopes
   จะถูกลบอัตโนมัติด้วย ON DELETE CASCADE
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัสรายการกำหนดบทบาท",
        },
        {
          status: 400,
        }
      );
    }

    const oldAssignment =
      await getAssignment(id);

    if (!oldAssignment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบข้อมูลการกำหนดบทบาทผู้ใช้งาน",
        },
        {
          status: 404,
        }
      );
    }

    const [
      oldScopes,
      userAccount,
      role,
    ] = await Promise.all([
      getAssignmentScopes(id),

      getUserAccount(
        oldAssignment.user_account_id
      ),

      getRole(oldAssignment.role_id),
    ]);

    const { error } =
      await supabaseAdmin
        .from(ASSIGNMENT_TABLE)
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    await safeWriteActivityLog({
      module_name:
        "user_access_assignments",

      action_type: "DELETE",

      reference_table:
        ASSIGNMENT_TABLE,

      reference_id: id,

      description:
        `ลบบทบาท ${
          role?.role_name || "-"
        } ของผู้ใช้งาน ${
          userAccount?.username || "-"
        }`,

      old_data: {
        assignment: oldAssignment,
        scopes: oldScopes,
      },

      new_data: null,
    });

    return NextResponse.json({
      success: true,

      message:
        "ลบบทบาทผู้ใช้งานและขอบเขตสังกัดเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/user-access-assignments/[id] error:",
      error
    );

    if (error?.code === "23503") {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถลบรายการนี้ได้ เนื่องจากมีข้อมูลอื่นกำลังใช้งานอยู่",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "ไม่สามารถลบบทบาทผู้ใช้งานได้",
      },
      {
        status: 500,
      }
    );
  }
}