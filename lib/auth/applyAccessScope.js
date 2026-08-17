const NO_ACCESS_UUID = "00000000-0000-0000-0000-000000000000";

function normalizeScopeIds(values = []) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .filter(Boolean)
        .map(String)
    ),
  ];
}

export function hasAccessPermission(accessContext, permissionCode) {
  if (accessContext?.is_super_admin) {
    return true;
  }

  return (
    Array.isArray(accessContext?.permissions) &&
    accessContext.permissions.includes(permissionCode)
  );
}

export function hasAllAccessScope(accessContext) {
  return Boolean(
    accessContext?.is_super_admin || accessContext?.has_all_scope
  );
}

/*
 * Generic scope สำหรับตารางที่มีทุก organization column อยู่ใน row เดียวกัน
 *
 * หลาย ID ในระดับเดียวกัน = OR ผ่าน .in(...)
 * คนละระดับ = AND เพราะ chain query.in(...) ทีละระดับ
 */
export function applyAccessScope(query, accessContext, options = {}) {
  const {
    companyColumn = "company_id",
    branchGroupColumn = "branch_group_id",
    branchColumn = "branch_id",
    departmentColumn = "department_id",
    divisionColumn = "division_id",
    unitColumn = "unit_id",
  } = options;

  if (hasAllAccessScope(accessContext)) {
    return query;
  }

  const companyIds = normalizeScopeIds(accessContext?.allowed_company_ids);
  const branchGroupIds = normalizeScopeIds(
    accessContext?.allowed_branch_group_ids
  );
  const branchIds = normalizeScopeIds(accessContext?.allowed_branch_ids);
  const departmentIds = normalizeScopeIds(
    accessContext?.allowed_department_ids
  );
  const divisionIds = normalizeScopeIds(accessContext?.allowed_division_ids);
  const unitIds = normalizeScopeIds(accessContext?.allowed_unit_ids);

  let hasConstraint = false;

  if (companyIds.length) {
    query = query.in(companyColumn, companyIds);
    hasConstraint = true;
  }

  if (branchGroupIds.length) {
    query = query.in(branchGroupColumn, branchGroupIds);
    hasConstraint = true;
  }

  if (branchIds.length) {
    query = query.in(branchColumn, branchIds);
    hasConstraint = true;
  }

  if (departmentIds.length) {
    query = query.in(departmentColumn, departmentIds);
    hasConstraint = true;
  }

  if (divisionIds.length) {
    query = query.in(divisionColumn, divisionIds);
    hasConstraint = true;
  }

  if (unitIds.length) {
    query = query.in(unitColumn, unitIds);
    hasConstraint = true;
  }

  /*
   * ไม่มี Scope งาน = ใช้ Permission อย่างเดียวเหมือนระบบเดิม
   * ห้ามบังคับ NO_ACCESS_UUID
   */
  return query;
}

export function getAllowedCompanyIds(accessContext) {
  return normalizeScopeIds(accessContext?.allowed_company_ids);
}

export function canAccessCompany(accessContext, companyId) {
  if (!companyId) {
    return false;
  }

  if (hasAllAccessScope(accessContext)) {
    return true;
  }

  return getAllowedCompanyIds(accessContext).includes(String(companyId));
}

export function applyCompanyScope(query, accessContext, column = "id") {
  if (hasAllAccessScope(accessContext)) {
    return query;
  }

  const companyIds = getAllowedCompanyIds(accessContext);

  if (!companyIds.length) {
    return query;
  }

  return query.in(column, companyIds);
}
