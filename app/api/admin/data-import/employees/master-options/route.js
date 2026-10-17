import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { checkAccess } from "@/lib/imports/employeeMigrationDraft";

export const runtime = "nodejs";

// Same Master tables/codes used by employeeMigration.js. IDs and parents
// are returned for cascading selection; the saved mapping remains codes.
const CONFIG = {
  company_code: ["companies", "company_code", "company_name_th", []],
  branch_group_code: ["branch_groups", "group_code", "group_name", []],
  branch_code: ["branches","branch_code","branch_name",["company_id"],],
  department_code: ["departments", "department_code", "department_name", []],
  division_code: ["divisions", "division_code", "division_name", ["department_id"]],
  unit_code: ["units", "unit_code", "unit_name", ["division_id"]],
  position_family_code: ["position_families", "family_code", "family_name", []],
  position_level_code: ["position_levels", "level_code", "level_name", []],
  position_code: ["positions", "position_code", "position_name", ["position_family_id"]],
  salary_band_code: ["position_level_bands", "band_code", "band_name", ["position_level_id"]],
  employment_type_code: ["employment_types", "type_code", "type_name", []],
  employee_status_code: ["employee_statuses", "status_code", "status_name", []],
  job_code: ["jobs", "job_code", "job_name", []],
  gender_code: ["genders", "gender_code", "gender_name_th", []],
  business_unit_code: ["business_units", "business_unit_code", "business_unit_name", []],
  cost_center_code: ["cost_centers", "cost_center_code", "cost_center_name", []],
  profit_center_code: ["profit_centers", "profit_center_code", "profit_center_name", []],
  payroll_company_code: ["payroll_companies", "payroll_company_code", "payroll_company_name", []],
  payroll_type_code: ["payroll_types", "payroll_type_code", "payroll_type_name", []],
  payroll_group_code: ["payroll_groups", "payroll_group_code", "payroll_group_name", []],
  salary_structure_code: ["salary_structures", "salary_structure_code", "salary_structure_name", []],
};

const OPTIONAL = new Set(["jobs", "genders", "business_units", "cost_centers", "profit_centers", "payroll_companies", "payroll_types", "payroll_groups", "salary_structures", "branch_groups", "divisions", "units"]);

async function loadRows(table, columns) {
  const items = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await supabaseAdmin.from(table).select(columns).order("id").range(start, start + 499);
    if (error) throw error;
    items.push(...(data || []));
    if ((data || []).length < 500) break;
  }
  return items;
}

export async function GET() {
  try {
    const guard = await checkAccess("view");
    if (!guard.ok) return guard.response;
    const options = {};
    for (const [key, [table, code, name, parentColumns]] of Object.entries(CONFIG)) {
      try {
        // Fetch known code, display name, and parent IDs, no hardcoded values.
        let rows;
        try {
          rows = await loadRows(table, [...new Set(["id", code, name, "status", ...parentColumns])].join(","));
        } catch (error) {
          // Older Master variants can lack a human-readable name column.
          if (!/column .* does not exist|Could not find the .* column/i.test(error.message)) throw error;
          rows = await loadRows(table, [...new Set(["id", code, "status", ...parentColumns])].join(","));
        }
        options[key] = rows.filter(r => r.status !== "inactive").map(r => ({
          value: String(r[code]),
          label: r[name] && r[name] !== r[code] ? `${r[code]} — ${r[name]}` : String(r[code]),
          id: r.id,
          ...Object.fromEntries(parentColumns.map(column => [column, r[column] ?? null])),
        }));
      } catch (error) {
        if (!OPTIONAL.has(table)) throw new Error(`โหลด Master ${table} ไม่สำเร็จ: ${error.message}`);
        console.warn(`OPTIONAL_IMPORT_MASTER_UNAVAILABLE ${table}`, error.message);
        options[key] = [];
      }
    }
    // Actual allowed branch/department and family/level combinations.
    const branchDepartments = await loadRows("branch_departments", "id,branch_id,department_id,status");
    const familyLevels = await loadRows("position_family_levels", "id,position_family_id,position_level_id");
    return NextResponse.json({
      success: true, options,
      relations: {
        branchDepartments: branchDepartments.filter(r => r.status !== "inactive").map(r => ({ branch_id: r.branch_id, department_id: r.department_id })),
        familyLevels: familyLevels.map(r => ({ position_family_id: r.position_family_id, position_level_id: r.position_level_id })),
      },
    });
  } catch (error) {
    console.error("EMPLOYEE_MIGRATION_MASTER_OPTIONS_ERROR", error);
    return NextResponse.json({ success: false, error: error.message || "ไม่สามารถโหลด Master ได้" }, { status: 500 });
  }
}
