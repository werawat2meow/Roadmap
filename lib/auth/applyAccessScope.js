
const NO_ACCESS_UUID = "00000000-0000-0000-0000-000000000000";
/* =========================================================
   Permission
========================================================= */

export function hasAccessPermission(
  accessContext,
  permissionCode
) {
  if (
    accessContext?.is_super_admin
  ) {
    return true;
  }

  return (
    Array.isArray(
      accessContext?.permissions
    ) &&
    accessContext.permissions.includes(
      permissionCode
    )
  );
}

/* =========================================================
   Apply Scope to Supabase Query

   ใช้กับตารางที่มี:
   company_id
   branch_group_id
   branch_id
   department_id
   division_id
   unit_id
========================================================= */

export function applyAccessScope(
  query,
  accessContext,
  options = {}
) {
  const {
    companyColumn = "company_id",

    branchGroupColumn =
      "branch_group_id",

    branchColumn = "branch_id",

    departmentColumn =
      "department_id",

    divisionColumn =
      "division_id",

    unitColumn = "unit_id",
  } = options;

  if (
    accessContext?.is_super_admin ||
    accessContext?.has_all_scope
  ) {
    return query;
  }

  const conditions = [];

  if (
    accessContext
      ?.allowed_company_ids
      ?.length > 0
  ) {
    conditions.push(
      `${companyColumn}.in.(${accessContext.allowed_company_ids.join(
        ","
      )})`
    );
  }

  if (
    accessContext
      ?.allowed_branch_group_ids
      ?.length > 0
  ) {
    conditions.push(
      `${branchGroupColumn}.in.(${accessContext.allowed_branch_group_ids.join(
        ","
      )})`
    );
  }

  if (
    accessContext
      ?.allowed_branch_ids
      ?.length > 0
  ) {
    conditions.push(
      `${branchColumn}.in.(${accessContext.allowed_branch_ids.join(
        ","
      )})`
    );
  }

  if (
    accessContext
      ?.allowed_department_ids
      ?.length > 0
  ) {
    conditions.push(
      `${departmentColumn}.in.(${accessContext.allowed_department_ids.join(
        ","
      )})`
    );
  }

  if (
    accessContext
      ?.allowed_division_ids
      ?.length > 0
  ) {
    conditions.push(
      `${divisionColumn}.in.(${accessContext.allowed_division_ids.join(
        ","
      )})`
    );
  }

  if (
    accessContext
      ?.allowed_unit_ids
      ?.length > 0
  ) {
    conditions.push(
      `${unitColumn}.in.(${accessContext.allowed_unit_ids.join(
        ","
      )})`
    );
  }

  /*
   * ไม่มี Scope ใดเลย
   * ต้องไม่คืนข้อมูล
   */

  if (conditions.length === 0) {
    return query.eq(
      branchColumn,
      "__NO_ACCESS__"
    );
  }

  return query.or(
    conditions.join(",")
  );
}


/* =========================================================
   generic helper     Scope Helpers สำหรับ Company Master
========================================================= */

function normalizeScopeIds(
  values = []
) {
  return [
    ...new Set(
      (Array.isArray(values)
        ? values
        : []
      )
        .filter(Boolean)
        .map(String)
    ),
  ];
}

/* =========================================================
   Global / All Scope
========================================================= */

export function hasAllAccessScope(
  accessContext
) {
  return Boolean(
    accessContext?.is_super_admin ||
      accessContext?.has_all_scope
  );
}

/* =========================================================
   Company Scope
========================================================= */

export function getAllowedCompanyIds(
  accessContext
) {
  return normalizeScopeIds(
    accessContext
      ?.allowed_company_ids
  );
}

export function canAccessCompany(
  accessContext,
  companyId
) {
  if (!companyId) {
    return false;
  }

  if (
    hasAllAccessScope(
      accessContext
    )
  ) {
    return true;
  }

  return getAllowedCompanyIds(
    accessContext
  ).includes(
    String(companyId)
  );
}

/* =========================================================
   Apply Company Scope

   ใช้กับตาราง companies

   companies.id
   ไม่ใช่ companies.company_id
========================================================= */

export function applyCompanyScope(
  query,
  accessContext,
  column = "id"
) {
  if (
    hasAllAccessScope(
      accessContext
    )
  ) {
    return query;
  }

  const companyIds =
    getAllowedCompanyIds(
      accessContext
    );

  /*
   * Permission ผ่าน
   * แต่ไม่มี Company Scope
   *
   * ต้องไม่คืนข้อมูล
   */
  if (!companyIds.length) {
    return query.eq(
      column,
      NO_ACCESS_UUID
    );
  }

  return query.in(
    column,
    companyIds
  );
}