import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import {
  MANAGEMENT_LEVELS,
  ALLOWED_SCOPE_TYPES,
  normalizeScope,
  validateScopeTarget,
  getScopeUniqueKey,
  normalizePrimaryScopes,
  buildLegacyScopePayload,
  mapAssignment,
  SELECT_FIELDS as MANAGEMENT_ASSIGNMENT_SELECT_FIELDS,
} from "@/lib/managementAssignments";

export const MODULE_CODE = "ems.employee_business_structure";

export const BUSINESS_STRUCTURE_SELECT_FIELDS = MANAGEMENT_ASSIGNMENT_SELECT_FIELDS
  .split("\n")
  .filter((line) => line.trim().replace(/,$/, "") !== "position_level")
  .join("\n")
  // หลังตัด legacy positions.position_level ออก อาจเหลือ comma ก่อนปิด relation
  // เช่น position_name, ) ซึ่ง PostgREST parse ไม่ได้
  .replace(/,\s*\)/g, "\n  )");
export const SCOPE_TYPES = [
  "all",
  "company",
  "branch_group",
  "branch",
  "department",
  "division",
  "unit",
];

export const SCOPE_FIELD_BY_TYPE = {
  all: null,
  company: "company_id",
  branch_group: "branch_group_id",
  branch: "branch_id",
  department: "department_id",
  division: "division_id",
  unit: "unit_id",
};

export const SUPERVISOR_LEVEL_BY_LEVEL = {
  P12: null,
  P11: "P12",
  P10: "P11",
  P9: "P10",
};

export const EMPLOYEE_SCOPE_SELECT = `
  id,
  employee_code,
  first_name_th,
  middle_name_th,
  last_name_th,
  first_name_en,
  middle_name_en,
  last_name_en,
  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,
  position_id,
  position_level_id,
  job_id,
  status,
  positions:positions!employees_position_id_fkey (
    id,
    position_code,
    position_name
  ),
  position_levels:position_levels!employees_position_level_id_fkey (
    id,
    level_code,
    level_name
  ),
  jobs:jobs!employees_job_id_fkey (
    id,
    job_code,
    job_name,
    management_level,
    scope_type
  )
`;

export function jsonError(error, status = 500, detail = null) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(detail ? { detail } : {}),
    },
    { status }
  );
}

export function cleanText(value) {
  return String(value ?? "").trim();
}

export function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

export function getEmployeeName(employee) {
  return (
    [
      employee?.first_name_th,
      employee?.middle_name_th,
      employee?.last_name_th,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    [
      employee?.first_name_en,
      employee?.middle_name_en,
      employee?.last_name_en,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "-"
  );
}

export function resolveEmployeeManagementLevel(employee) {
  const value =
    employee?.jobs?.management_level ||
    employee?.position_levels?.level_code ||
    "";

  return cleanText(value).toUpperCase();
}

export function mapEmployeeOption(employee) {
  return {
    id: employee?.id || null,
    employee_code: employee?.employee_code || "",
    employee_name: getEmployeeName(employee),
    management_level: resolveEmployeeManagementLevel(employee),
    company_id: employee?.company_id || null,
    branch_group_id: employee?.branch_group_id || null,
    branch_id: employee?.branch_id || null,
    department_id: employee?.department_id || null,
    division_id: employee?.division_id || null,
    unit_id: employee?.unit_id || null,
    position_id: employee?.position_id || null,
    position_code: employee?.positions?.position_code || "",
    position_name: employee?.positions?.position_name || "",
    job_id: employee?.job_id || null,
    job_code: employee?.jobs?.job_code || "",
    job_name: employee?.jobs?.job_name || "",
    status: employee?.status || "",
  };
}

export function employeeScopeShape(employee) {
  return {
    id: employee?.id || null,
    company_id: employee?.company_id || null,
    branch_group_id: employee?.branch_group_id || null,
    branch_id: employee?.branch_id || null,
    department_id: employee?.department_id || null,
    division_id: employee?.division_id || null,
    unit_id: employee?.unit_id || null,
  };
}

export async function loadEmployeeById(id) {
  if (!id) return null;

  const { data, error } = await supabaseAdmin
    .from("employees")
    .select(EMPLOYEE_SCOPE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function createActionGuard(action, scopeType = "employee") {
  return requireScopedAccess(MODULE_CODE, action, {
    scopeType,
    lineageScope: true,
  });
}

export function assertEmployeeInScope(guard, employee, message) {
  if (!employee) {
    return jsonError("ไม่พบข้อมูลพนักงาน", 404);
  }

  if (guard?.hasAllScope) {
    return null;
  }

  if (!guard?.canAccessEmployee?.(employeeScopeShape(employee))) {
    return jsonError(
      message || "คุณไม่มีสิทธิ์เข้าถึงพนักงานรายนี้ภายใต้ Scope ที่ได้รับ",
      403
    );
  }

  return null;
}

export function normalizeAssignmentInput(body = {}) {
  const employeeId = cleanNullableText(body.employee_id);
  const managementLevel = cleanText(body.management_level).toUpperCase();
  const supervisorEmployeeId = cleanNullableText(body.supervisor_employee_id);
  const status = body.status === "inactive" ? "inactive" : "active";
  const sortOrder = Number(body.sort_order || 0);
  const isPrimary = body.is_primary ?? true;

  let rawScopes = Array.isArray(body.scopes) ? body.scopes : [];

  if (!rawScopes.length && body.scope_type) {
    rawScopes = [
      {
        scope_type: body.scope_type,
        company_id: body.company_id,
        branch_group_id: body.branch_group_id,
        branch_id: body.branch_id,
        department_id: body.department_id,
        division_id: body.division_id,
        unit_id: body.unit_id,
        is_primary: true,
        status,
        sort_order: 0,
      },
    ];
  }

  let scopes = rawScopes.map((scope, index) => normalizeScope(scope, index));
  scopes = normalizePrimaryScopes(scopes);

  return {
    employeeId,
    managementLevel,
    supervisorEmployeeId,
    status,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    isPrimary: Boolean(isPrimary),
    scopes,
  };
}

export function validateAssignmentInput(input) {
  const {
    employeeId,
    managementLevel,
    supervisorEmployeeId,
    scopes,
  } = input;

  if (!employeeId) {
    return "กรุณาเลือกพนักงาน";
  }

  if (!MANAGEMENT_LEVELS.includes(managementLevel)) {
    return "Management Level ต้องเป็น P9 ถึง P12";
  }

  if (!Array.isArray(scopes) || !scopes.length) {
    return "กรุณากำหนดขอบเขตการดูแลอย่างน้อย 1 รายการ";
  }

  const allowedScopeTypes = ALLOWED_SCOPE_TYPES?.[managementLevel] || [];
  const uniqueScopeKeys = new Set();

  for (const scope of scopes) {
    const targetError = validateScopeTarget(scope);
    if (targetError) return targetError;

    if (
      allowedScopeTypes.length &&
      !allowedScopeTypes.includes(scope.scope_type)
    ) {
      return `ระดับ ${managementLevel} ไม่สามารถใช้ Scope ${scope.scope_type} ได้`;
    }

    const uniqueKey = getScopeUniqueKey(scope);
    if (!uniqueKey || uniqueScopeKeys.has(uniqueKey)) {
      return "พบขอบเขตการดูแลซ้ำกัน";
    }

    uniqueScopeKeys.add(uniqueKey);
  }

  if (managementLevel === "P12") {
    const validP12 = scopes.length === 1 && scopes[0].scope_type === "all";
    if (!validP12) {
      return "ระดับ P12 ต้องมี Scope ทั้งองค์กรเพียงรายการเดียว";
    }

    if (supervisorEmployeeId) {
      return "ระดับ P12 ไม่ต้องมีผู้บังคับบัญชา";
    }
  } else if (!supervisorEmployeeId) {
    return "กรุณาเลือกผู้บังคับบัญชา";
  }

  if (
    supervisorEmployeeId &&
    String(supervisorEmployeeId) === String(employeeId)
  ) {
    return "พนักงานไม่สามารถเป็นผู้บังคับบัญชาของตัวเองได้";
  }

  return "";
}

export async function assertManagementScopesAllowed(action, scopes = []) {
  for (const scope of scopes) {
    const scopeType = scope?.scope_type;

    if (!SCOPE_TYPES.includes(scopeType)) {
      return jsonError("Scope Type ไม่ถูกต้อง", 400);
    }

    if (scopeType === "all") {
      const guard = await createActionGuard(action, null);
      if (!guard.ok) return guard.response;

      if (!guard.hasAllScope) {
        return jsonError(
          "คุณไม่มี All Scope สำหรับกำหนดขอบเขตทั้งองค์กร",
          403
        );
      }

      continue;
    }

    const targetField = SCOPE_FIELD_BY_TYPE[scopeType];
    const targetId = scope?.[targetField];

    const guard = await createActionGuard(action, scopeType);
    if (!guard.ok) return guard.response;

    const response = guard.assertAccessId(
      targetId,
      `คุณไม่มีสิทธิ์กำหนด ${scopeType} นี้ภายใต้ Scope ที่ได้รับ`
    );

    if (response) return response;
  }

  return null;
}

export async function validateSupervisorRelationship({
  employeeId,
  managementLevel,
  supervisorEmployeeId,
}) {
  if (managementLevel === "P12") {
    return "";
  }

  if (!supervisorEmployeeId) {
    return "กรุณาเลือกผู้บังคับบัญชา";
  }

  if (String(employeeId) === String(supervisorEmployeeId)) {
    return "พนักงานไม่สามารถเป็นผู้บังคับบัญชาของตัวเองได้";
  }

  const requiredLevel = SUPERVISOR_LEVEL_BY_LEVEL[managementLevel];

  const { data: supervisorAssignment, error } = await supabaseAdmin
    .from("management_assignments")
    .select("id, employee_id, management_level, status")
    .eq("employee_id", supervisorEmployeeId)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!supervisorAssignment) {
    return "ผู้บังคับบัญชาที่เลือกยังไม่มี Management Assignment ที่ Active";
  }

  if (
    requiredLevel &&
    cleanText(supervisorAssignment.management_level).toUpperCase() !== requiredLevel
  ) {
    return `ผู้บังคับบัญชาต้องเป็นระดับ ${requiredLevel}`;
  }

  return "";
}

export function buildAssignmentPayload(input) {
  const legacyScopePayload = buildLegacyScopePayload(input.scopes);

  return {
    employee_id: input.employeeId,
    management_level: input.managementLevel,
    supervisor_employee_id:
      input.managementLevel === "P12" ? null : input.supervisorEmployeeId,
    is_primary: input.isPrimary,
    status: input.status,
    sort_order: input.sortOrder,
    ...legacyScopePayload,
  };
}

export function buildScopeRows(assignmentId, scopes = []) {
  return scopes.map((scope, index) => ({
    management_assignment_id: assignmentId,
    scope_type: scope.scope_type,
    company_id: scope.company_id || null,
    branch_group_id: scope.branch_group_id || null,
    branch_id: scope.branch_id || null,
    department_id: scope.department_id || null,
    division_id: scope.division_id || null,
    unit_id: scope.unit_id || null,
    is_primary: Boolean(scope.is_primary),
    status: scope.status === "inactive" ? "inactive" : "active",
    sort_order: Number(scope.sort_order ?? index) || 0,
  }));
}

export async function readAssignmentById(id) {
  const { data, error } = await supabaseAdmin
    .from("management_assignments")
    .select(BUSINESS_STRUCTURE_SELECT_FIELDS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export function mapBusinessStructureRow(raw, employee = null) {
  const mapped = mapAssignment(raw);
  const resolvedEmployee = employee || raw?.employees || {};

  return {
    ...mapped,
    employee_scope: employeeScopeShape(resolvedEmployee),
    employee_company_id: resolvedEmployee?.company_id || null,
    employee_branch_group_id: resolvedEmployee?.branch_group_id || null,
    employee_branch_id: resolvedEmployee?.branch_id || null,
    employee_department_id: resolvedEmployee?.department_id || null,
    employee_division_id: resolvedEmployee?.division_id || null,
    employee_unit_id: resolvedEmployee?.unit_id || null,
  };
}

export async function validateEmployeeLevel(employee, managementLevel) {
  const resolved = resolveEmployeeManagementLevel(employee);

  if (resolved && resolved !== managementLevel) {
    return `ระดับพนักงานเป็น ${resolved} แต่ Assignment ระบุ ${managementLevel}`;
  }

  return "";
}

export function getDatabaseErrorStatus(error) {
  if (error?.code === "23505") return 409;
  if (["23503", "23514", "23502", "22P02"].includes(error?.code)) {
    return 400;
  }
  return 500;
}
