import { SCOPE_TYPES } from "./constants";

export function normalizeScope(scope = {}, index = 0) {
  const scopeType = String(scope?.scope_type || "").trim().toLowerCase();

  return {
    scope_type: scopeType,
    company_id: scopeType === "company" ? scope?.company_id || null : null,
    branch_group_id: scopeType === "branch_group" ? scope?.branch_group_id || null : null,
    branch_id: scopeType === "branch" ? scope?.branch_id || null : null,
    department_id: scopeType === "department" ? scope?.department_id || null : null,
    division_id: scopeType === "division" ? scope?.division_id || null : null,
    unit_id: scopeType === "unit" ? scope?.unit_id || null : null,
    is_primary: Boolean(scope?.is_primary),
    status: scope?.status === "inactive" ? "inactive" : "active",
    sort_order: Number(scope?.sort_order ?? index) || 0,
  };
}

export function validateScopeTarget(scope) {
  if (!SCOPE_TYPES.includes(scope.scope_type)) {
    return "ประเภทขอบเขตการดูแลไม่ถูกต้อง";
  }

  if (scope.scope_type === "all") return "";

  const requiredFieldMap = {
    company: "company_id",
    branch_group: "branch_group_id",
    branch: "branch_id",
    department: "department_id",
    division: "division_id",
    unit: "unit_id",
  };

  const errorMessageMap = {
    company: "กรุณาเลือกบริษัท",
    branch_group: "กรุณาเลือกกลุ่มสาขา",
    branch: "กรุณาเลือกสาขา",
    department: "กรุณาเลือกแผนก",
    division: "กรุณาเลือกฝ่าย",
    unit: "กรุณาเลือกหน่วยงาน",
  };

  const requiredField = requiredFieldMap[scope.scope_type];

  if (requiredField && !scope[requiredField]) {
    return errorMessageMap[scope.scope_type] || "กรุณาเลือกขอบเขตการดูแล";
  }

  return "";
}

export function getScopeUniqueKey(scope) {
  switch (scope.scope_type) {
    case "all":
      return "all";
    case "company":
      return `company:${scope.company_id}`;
    case "branch_group":
      return `branch_group:${scope.branch_group_id}`;
    case "branch":
      return `branch:${scope.branch_id}`;
    case "department":
      return `department:${scope.department_id}`;
    case "division":
      return `division:${scope.division_id}`;
    case "unit":
      return `unit:${scope.unit_id}`;
    default:
      return "";
  }
}

// ใช้ร่วมกันทั้ง POST (create) และ PATCH (update)
export function normalizePrimaryScopes(scopes) {
  let primaryFound = false;

  const normalized = scopes.map((scope, index) => {
    const canBePrimary = scope.is_primary && !primaryFound;
    if (canBePrimary) primaryFound = true;

    return {
      ...scope,
      is_primary: canBePrimary,
      sort_order: Number(scope.sort_order ?? index) || 0,
    };
  });

  if (normalized.length > 0 && !primaryFound) {
    normalized[0] = { ...normalized[0], is_primary: true };
  }

  return normalized;
}

// เก็บ Scope หลักกลับลง Column เดิม เพื่อให้หน้า/API เก่ายังทำงานได้
export function buildLegacyScopePayload(scopes) {
  const primaryScope = scopes.find((scope) => scope.is_primary) || scopes[0] || null;

  return {
    scope_type: primaryScope?.scope_type || null,
    company_id: primaryScope?.scope_type === "company" ? primaryScope.company_id : null,
    branch_group_id:
      primaryScope?.scope_type === "branch_group" ? primaryScope.branch_group_id : null,
    branch_id: primaryScope?.scope_type === "branch" ? primaryScope.branch_id : null,
    department_id:
      primaryScope?.scope_type === "department" ? primaryScope.department_id : null,
    division_id: primaryScope?.scope_type === "division" ? primaryScope.division_id : null,
    unit_id: primaryScope?.scope_type === "unit" ? primaryScope.unit_id : null,
  };
}