import { supabaseAdmin } from "@/lib/supabaseServer";
import { resolveAccessibleIds } from "@/lib/auth/requireScopedAccess";
import { createSimpleEmployee } from "@/lib/employee/createSimpleEmployee";
import { EMPLOYEE_IMPORT_MASTERS, parseEmployeeListWorkbook, resolveEmployeeListRows } from "./employeeListWorkbook";

export async function loadEmployeeListImportMasters(guard) {
  const scopes = { companies: "company", branches: "branch", departments: "department", divisions: "division", units: "unit" };
  const tables = [...Object.keys(EMPLOYEE_IMPORT_MASTERS), "companies", "branch_departments", "position_level_mappings"];
  const entries = await Promise.all(tables.map(async (table) => {
    const spec = EMPLOYEE_IMPORT_MASTERS[table];
    const columns = spec ? ["id", ...spec.slice(1)] : table === "companies" ? ["id", "company_code", "company_name_th"]
      : table === "branch_departments" ? ["branch_id", "department_id"] : ["position_id", "position_level_id"];
    if (table === "branches") columns.push("company_id");
    if (table === "divisions") columns.push("department_id");
    if (table === "units") columns.push("division_id");
    const ids = !guard.hasAllScope && scopes[table]
      ? await resolveAccessibleIds(guard.access, scopes[table], { permission: guard.permission }) : null;
    if (ids && !ids.length) return [table, []];
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      let query = supabaseAdmin.from(table).select(columns.join(",")).range(offset, offset + 999);
      if (table !== "position_level_mappings") query = query.eq("status", "active");
      if (ids) query = query.in("id", ids);
      const { data, error } = await query.order(table === "branch_departments" ? "branch_id" : table === "position_level_mappings" ? "position_id" : "id");
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    return [table, table === "position_levels" ? rows.filter((row) => /^P\d+$/i.test(row.level_code)) : rows];
  }));
  const masters = Object.fromEntries(entries);
  masters.branch_departments = masters.branch_departments.filter((link) => masters.branches.some((row) => row.id === link.branch_id) && masters.departments.some((row) => row.id === link.department_id));
  return masters;
}

export async function previewEmployeeListImport(buffer, companyId, guard) {
  const rows = parseEmployeeListWorkbook(buffer);
  if (!rows.length) throw new Error("ไฟล์ไม่มีรายชื่อพนักงาน กรุณากรอกข้อมูลก่อนนำเข้า");
  const masters = await loadEmployeeListImportMasters(guard);
  if (companyId && !masters.companies.some((company) => company.id === companyId)) throw new Error("บริษัทไม่ถูกต้องหรืออยู่นอกขอบเขตสิทธิ์");
  resolveEmployeeListRows(rows, masters, companyId);
  for (const row of rows) {
    if (row.errors.length) continue;
    const response = await createSimpleEmployee(row.body, guard, { allowIncompleteOrganization: true, dryRun: true });
    const result = await response.json();
    if (!response.ok || !result.success) row.errors.push(result.error || "ตรวจสอบข้อมูลไม่สำเร็จ");
  }
  return rows;
}

export function publicEmployeeImportRow(row) {
  return {
    rowNumber: row.rowNumber,
    values: row.raw,
    errors: row.errors,
    incomplete: ["branch_id", "department_id", "position_id", "position_level_id"].some((key) => !row.body[key]),
  };
}
