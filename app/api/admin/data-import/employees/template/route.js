import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPLOYEE_HEADERS = [
  "employee_code*",
  "external_employee_id",
  "first_name_th*",
  "last_name_th*",
  "first_name_en",
  "last_name_en",
  "nickname_th",
  "gender_code",
  "birth_date",
  "citizen_id",
  "passport_no",
  "mobile_phone",
  "personal_email",
  "company_code*",
  "branch_group_code",
  "branch_code*",
  "department_code*",
  "division_code",
  "unit_code",
  "position_family_code*",
  "position_level_code*",
  "position_code*",
  "job_code",
  "business_unit_code",
  "cost_center_code",
  "profit_center_code",
  "employment_type_code*",
  "employee_status_code*",
  "status*",
  "start_work_date*",
  "resignation_date",
  "payroll_company_code",
  "payroll_type_code",
  "payroll_group_code",
  "salary_structure_code",
  "salary_band_code*",
  "base_salary*",
  "remark",
];

const INSTRUCTIONS = [
  ["หัวข้อ", "คำอธิบาย"],
  ["โหมด", "Employee Migration / Old Employee Code"],
  ["employee_code*", "รหัสพนักงานเดิมจากระบบเก่า ระบบจะไม่ Generate ใหม่"],
  ["external_employee_id", "ID จากระบบเก่า (ถ้ามี) ใช้ Match ก่อน employee_code เมื่อ Import ซ้ำ"],
  ["Required", "คอลัมน์ที่มี * ต้องกรอกให้ครบ"],
  ["Master Code", "ห้ามใส่ UUID ให้เลือก Code จาก Sheet REF_* ที่ระบบ Generate มาให้"],
  ["Organization", "Company / Branch / Department / Division / Unit ต้องสัมพันธ์กันจริง"],
  ["Position", "Position Family / Position Level / Position / Salary Band ต้องสัมพันธ์กันจริง"],
  ["status", "ใช้ active, inactive หรือ resigned"],
  ["resigned", "ถ้า status=resigned ต้องระบุ resignation_date"],
  ["วันที่", "ใช้ YYYY-MM-DD เช่น 2026-08-24"],
  ["เลขที่มี 0 นำหน้า", "employee_code, citizen_id, mobile_phone ควรเป็น Text"],
  ["base_salary*", "เงินเดือนฐานจากระบบเก่า ใช้ Sync Employee Compensation ในโหมด Migration"],
  ["Reference", "REF_* คือ Master Data จริงจาก HRMS ณ เวลาที่กดดาวน์โหลด"],
  ["ขั้นตอน", "กรอก Employees -> Upload -> Preview -> Validate -> Confirm Import"],
];

function clean(value) {
  return String(value ?? "").trim();
}

function first(row, keys, fallback = "") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && clean(value) !== "") {
      return value;
    }
  }
  return fallback;
}

function active(row) {
  return !row?.status || row.status === "active";
}

function byId(rows) {
  return new Map((rows || []).filter((row) => row?.id).map((row) => [row.id, row]));
}

function sortByCode(rows, keys) {
  return [...(rows || [])].sort((a, b) => {
    const left = clean(first(a, keys));
    const right = clean(first(b, keys));
    return left.localeCompare(right, "th");
  });
}

function canSeeEmployeeLike(guard, record) {
  if (guard?.hasAllScope) return true;
  if (typeof guard?.canAccessEmployee !== "function") return false;
  return Boolean(guard.canAccessEmployee(record));
}

async function loadTable(table, { optional = false, limit = 10000 } = {}) {
  const { data, error } = await supabaseAdmin.from(table).select("*").limit(limit);

  if (error) {
    if (optional) {
      console.warn(`TEMPLATE_OPTIONAL_MASTER_ERROR: ${table}`, error.message);
      return [];
    }
    throw new Error(`${table}: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

function addSheet(workbook, name, headers, rows = []) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: {
        r: Math.max(0, rows.length),
        c: Math.max(0, headers.length - 1),
      },
    }),
  };
  sheet["!cols"] = headers.map((header) => ({
    wch: Math.min(36, Math.max(14, clean(header).length + 4)),
  }));

  XLSX.utils.book_append_sheet(workbook, sheet, name.slice(0, 31));
}

export async function GET() {
  try {
    const guard = await requireScopedAccess("data.import", "view", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const [
      companies,
      branchGroups,
      branches,
      departments,
      branchDepartments,
      divisions,
      units,
      positionFamilies,
      positionLevels,
      positions,
      familyLevels,
      positionLevelBands,
      employmentTypes,
      employeeStatuses,
      genders,
      payrollCompanies,
      payrollTypes,
      payrollGroups,
      salaryStructures,
      jobs,
      businessUnits,
      costCenters,
      profitCenters,
    ] = await Promise.all([
      loadTable("companies"),
      loadTable("branch_groups", { optional: true }),
      loadTable("branches"),
      loadTable("departments"),
      loadTable("branch_departments", { optional: true }),
      loadTable("divisions", { optional: true }),
      loadTable("units", { optional: true }),
      loadTable("position_families"),
      loadTable("position_levels"),
      loadTable("positions"),
      loadTable("position_family_levels", { optional: true }),
      loadTable("position_level_bands"),
      loadTable("employment_types"),
      loadTable("employee_statuses"),
      loadTable("genders", { optional: true }),
      loadTable("payroll_companies", { optional: true }),
      loadTable("payroll_types", { optional: true }),
      loadTable("payroll_groups", { optional: true }),
      loadTable("salary_structures", { optional: true }),
      loadTable("jobs", { optional: true }),
      loadTable("business_units", { optional: true }),
      loadTable("cost_centers", { optional: true }),
      loadTable("profit_centers", { optional: true }),
    ]);

    const companyById = byId(companies);
    const branchGroupById = byId(branchGroups);
    const branchById = byId(branches);
    const departmentById = byId(departments);
    const divisionById = byId(divisions);
    const familyById = byId(positionFamilies);
    const levelById = byId(positionLevels);
    const payrollCompanyById = byId(payrollCompanies);

    // =======================================================
    // Employee Scope -> Organization Reference
    // =======================================================

    const visibleCompanies = sortByCode(
      companies
        .filter(active)
        .filter((row) => canSeeEmployeeLike(guard, { company_id: row.id })),
      ["company_code", "code"]
    );

    const visibleCompanyIds = new Set(visibleCompanies.map((row) => row.id));

    const visibleBranches = sortByCode(
      branches
        .filter(active)
        .filter((row) => visibleCompanyIds.has(row.company_id))
        .filter((row) =>
          canSeeEmployeeLike(guard, {
            company_id: row.company_id,
            branch_group_id: row.branch_group_id || row.group_id || null,
            branch_id: row.id,
          })
        ),
      ["branch_code", "code"]
    );

    const visibleBranchIds = new Set(visibleBranches.map((row) => row.id));

    const departmentRefs = [];
    const validMappings = branchDepartments.filter(
      (row) => active(row) && visibleBranchIds.has(row.branch_id)
    );

    if (validMappings.length) {
      for (const mapping of validMappings) {
        const branch = branchById.get(mapping.branch_id);
        const department = departmentById.get(mapping.department_id);
        if (!branch || !department || !active(department)) continue;

        const scoped = {
          company_id: branch.company_id,
          branch_group_id: branch.branch_group_id || branch.group_id || null,
          branch_id: branch.id,
          department_id: department.id,
        };

        if (!canSeeEmployeeLike(guard, scoped)) continue;

        departmentRefs.push({ ...scoped, department });
      }
    } else {
      // fallback ถ้า Department เป็น Global Master และไม่มี mapping table
      for (const department of departments.filter(active)) {
        departmentRefs.push({
          company_id: null,
          branch_group_id: null,
          branch_id: null,
          department_id: department.id,
          department,
        });
      }
    }

    const visibleDepartmentIds = new Set(
      departmentRefs.map((row) => row.department_id)
    );

    const divisionRefs = [];
    for (const division of divisions.filter(active)) {
      if (
        division.department_id &&
        !visibleDepartmentIds.has(division.department_id)
      ) {
        continue;
      }

      const parents = departmentRefs.filter(
        (parent) =>
          !division.department_id || parent.department_id === division.department_id
      );

      for (const parent of parents) {
        const scoped = { ...parent, division_id: division.id };
        if (!canSeeEmployeeLike(guard, scoped)) continue;
        divisionRefs.push({ ...scoped, division });
      }
    }

    const visibleDivisionIds = new Set(divisionRefs.map((row) => row.division_id));

    const unitRefs = [];
    for (const unit of units.filter(active)) {
      if (unit.division_id && !visibleDivisionIds.has(unit.division_id)) continue;

      const parents = divisionRefs.filter(
        (parent) => !unit.division_id || parent.division_id === unit.division_id
      );

      for (const parent of parents) {
        const scoped = { ...parent, unit_id: unit.id };
        if (!canSeeEmployeeLike(guard, scoped)) continue;
        unitRefs.push({ ...scoped, unit });
      }
    }

    // =======================================================
    // Workbook
    // =======================================================

    const workbook = XLSX.utils.book_new();

    // Sheet ที่ HR/IT กรอกข้อมูลจริง — ไม่ใส่ Example Row ปน
    addSheet(workbook, "Employees", EMPLOYEE_HEADERS, []);
    addSheet(workbook, "Instructions", INSTRUCTIONS[0], INSTRUCTIONS.slice(1));

    addSheet(
      workbook,
      "References",
      ["employee_column", "reference_sheet", "คำอธิบาย"],
      [
        ["company_code", "REF_Companies", "บริษัท"],
        ["branch_group_code", "REF_Branch_Groups", "กลุ่มสังกัด"],
        ["branch_code", "REF_Branches", "สังกัด / สาขา"],
        ["department_code", "REF_Departments", "แผนก + สังกัดที่ใช้งาน"],
        ["division_code", "REF_Divisions", "ฝ่าย + แผนก"],
        ["unit_code", "REF_Units", "หน่วย + ฝ่าย"],
        ["position_family_code", "REF_Position_Families", "กลุ่มสายงาน"],
        ["position_level_code", "REF_Position_Levels", "ระดับตำแหน่ง"],
        ["position_code", "REF_Positions", "ตำแหน่ง"],
        ["salary_band_code", "REF_Salary_Bands", "Salary Band + Position Level"],
        ["employment_type_code", "REF_Employment_Types", "ประเภทการจ้าง"],
        ["employee_status_code", "REF_Employee_Statuses", "สถานะพนักงาน"],
        ["gender_code", "REF_Genders", "เพศ"],
        ["status", "REF_System_Status", "สถานะระบบ"],
        ["payroll_company_code", "REF_Payroll_Companies", "บริษัทเงินเดือน"],
        ["payroll_type_code", "REF_Payroll_Types", "รอบการจ่ายเงิน"],
        ["payroll_group_code", "REF_Payroll_Groups", "กลุ่มเงินเดือน"],
        ["salary_structure_code", "REF_Salary_Structures", "โครงสร้างเงินเดือน"],
        ["job_code", "REF_Jobs", "บทบาทงาน"],
        ["business_unit_code", "REF_Business_Units", "Business Unit"],
        ["cost_center_code", "REF_Cost_Centers", "Cost Center"],
        ["profit_center_code", "REF_Profit_Centers", "Profit Center"],
      ]
    );

    addSheet(
      workbook,
      "REF_Companies",
      ["company_code", "company_name_th", "company_name_en"],
      visibleCompanies.map((row) => [
        first(row, ["company_code", "code"]),
        first(row, ["company_name_th", "company_name", "name_th", "name"]),
        first(row, ["company_name_en", "name_en"]),
      ])
    );

    const visibleBranchGroupIds = new Set(
      visibleBranches
        .map((row) => row.branch_group_id || row.group_id)
        .filter(Boolean)
    );

    addSheet(
      workbook,
      "REF_Branch_Groups",
      ["branch_group_code", "branch_group_name"],
      sortByCode(
        branchGroups.filter(
          (row) => active(row) && (guard.hasAllScope || visibleBranchGroupIds.has(row.id))
        ),
        ["group_code", "branch_group_code", "code"]
      ).map((row) => [
        first(row, ["group_code", "branch_group_code", "code"]),
        first(row, ["group_name", "branch_group_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Branches",
      ["company_code", "branch_group_code", "branch_code", "branch_name"],
      visibleBranches.map((row) => {
        const company = companyById.get(row.company_id);
        const group = branchGroupById.get(row.branch_group_id || row.group_id);
        return [
          first(company, ["company_code", "code"]),
          first(group, ["group_code", "branch_group_code", "code"]),
          first(row, ["branch_code", "code"]),
          first(row, ["branch_name", "name"]),
        ];
      })
    );

    addSheet(
      workbook,
      "REF_Departments",
      ["company_code", "branch_group_code", "branch_code", "department_code", "department_name"],
      departmentRefs.map((ref) => {
        const company = companyById.get(ref.company_id);
        const group = branchGroupById.get(ref.branch_group_id);
        const branch = branchById.get(ref.branch_id);
        return [
          first(company, ["company_code", "code"]),
          first(group, ["group_code", "branch_group_code", "code"]),
          first(branch, ["branch_code", "code"]),
          first(ref.department, ["department_code", "code"]),
          first(ref.department, ["department_name", "name"]),
        ];
      })
    );

    addSheet(
      workbook,
      "REF_Divisions",
      ["branch_code", "department_code", "division_code", "division_name"],
      divisionRefs.map((ref) => [
        first(branchById.get(ref.branch_id), ["branch_code", "code"]),
        first(departmentById.get(ref.department_id), ["department_code", "code"]),
        first(ref.division, ["division_code", "code"]),
        first(ref.division, ["division_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Units",
      ["branch_code", "department_code", "division_code", "unit_code", "unit_name"],
      unitRefs.map((ref) => [
        first(branchById.get(ref.branch_id), ["branch_code", "code"]),
        first(departmentById.get(ref.department_id), ["department_code", "code"]),
        first(divisionById.get(ref.division_id), ["division_code", "code"]),
        first(ref.unit, ["unit_code", "code"]),
        first(ref.unit, ["unit_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Position_Families",
      ["position_family_code", "position_family_name"],
      sortByCode(positionFamilies.filter(active), ["family_code", "code"]).map((row) => [
        first(row, ["family_code", "position_family_code", "code"]),
        first(row, ["family_name", "position_family_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Position_Levels",
      ["position_level_code", "position_level_name"],
      sortByCode(positionLevels.filter(active), ["level_code", "code"]).map((row) => [
        first(row, ["level_code", "position_level_code", "code"]),
        first(row, ["level_name", "position_level_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Family_Levels",
      ["position_family_code", "position_family_name", "position_level_code", "position_level_name"],
      familyLevels.filter(active).map((row) => {
        const family = familyById.get(row.position_family_id);
        const level = levelById.get(row.position_level_id);
        return [
          first(family, ["family_code", "position_family_code", "code"]),
          first(family, ["family_name", "position_family_name", "name"]),
          first(level, ["level_code", "position_level_code", "code"]),
          first(level, ["level_name", "position_level_name", "name"]),
        ];
      })
    );

    addSheet(
      workbook,
      "REF_Positions",
      ["position_family_code", "position_code", "position_name"],
      sortByCode(positions.filter(active), ["position_code", "code"]).map((row) => [
        first(familyById.get(row.position_family_id), ["family_code", "position_family_code", "code"]),
        first(row, ["position_code", "code"]),
        first(row, ["position_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Salary_Bands",
      ["position_level_code", "salary_band_code", "salary_band_name", "salary_min", "salary_mid", "salary_max"],
      sortByCode(positionLevelBands.filter(active), ["band_code", "code"]).map((row) => [
        first(levelById.get(row.position_level_id), ["level_code", "position_level_code", "code"]),
        first(row, ["band_code", "code"]),
        first(row, ["band_name", "name"]),
        first(row, ["salary_min", "min_salary"]),
        first(row, ["salary_mid", "mid_salary"]),
        first(row, ["salary_max", "max_salary"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Employment_Types",
      ["employment_type_code", "employment_type_name"],
      sortByCode(employmentTypes.filter(active), ["employment_type_code", "type_code", "code"]).map((row) => [
        first(row, ["employment_type_code", "type_code", "code"]),
        first(row, ["employment_type_name", "type_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Employee_Statuses",
      ["employee_status_code", "employee_status_name"],
      sortByCode(employeeStatuses.filter(active), ["status_code", "code"]).map((row) => [
        first(row, ["status_code", "employee_status_code", "code"]),
        first(row, ["status_name", "employee_status_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Genders",
      ["gender_code", "gender_name_th", "gender_name_en"],
      sortByCode(genders.filter(active), ["gender_code", "code"]).map((row) => [
        first(row, ["gender_code", "code"]),
        first(row, ["gender_name_th", "gender_name", "name_th", "name"]),
        first(row, ["gender_name_en", "name_en"]),
      ])
    );

    addSheet(workbook, "REF_System_Status", ["status", "description"], [
      ["active", "ใช้งาน"],
      ["inactive", "ไม่ใช้งาน"],
      ["resigned", "ลาออก"],
    ]);

    const visiblePayrollCompanies = payrollCompanies
      .filter(active)
      .filter((row) => !row.company_id || visibleCompanyIds.has(row.company_id));

    addSheet(
      workbook,
      "REF_Payroll_Companies",
      ["company_code", "payroll_company_code", "payroll_company_name"],
      sortByCode(visiblePayrollCompanies, ["payroll_company_code", "company_code", "code"]).map((row) => [
        first(companyById.get(row.company_id), ["company_code", "code"]),
        first(row, ["payroll_company_code", "company_code", "code"]),
        first(row, ["payroll_company_name", "company_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Payroll_Types",
      ["payroll_type_code", "payroll_type_name", "payment_frequency"],
      sortByCode(payrollTypes.filter(active), ["payroll_type_code", "code"]).map((row) => [
        first(row, ["payroll_type_code", "code"]),
        first(row, ["payroll_type_name", "name"]),
        first(row, ["payment_frequency", "frequency"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Payroll_Groups",
      ["payroll_company_code", "payroll_group_code", "payroll_group_name"],
      sortByCode(payrollGroups.filter(active), ["payroll_group_code", "group_code", "code"]).map((row) => [
        first(payrollCompanyById.get(row.payroll_company_id), ["payroll_company_code", "company_code", "code"]),
        first(row, ["payroll_group_code", "group_code", "code"]),
        first(row, ["payroll_group_name", "group_name", "name"]),
      ])
    );

    addSheet(
      workbook,
      "REF_Salary_Structures",
      ["company_code", "salary_structure_code", "salary_structure_name"],
      sortByCode(
        salaryStructures.filter(active).filter((row) => !row.company_id || visibleCompanyIds.has(row.company_id)),
        ["salary_structure_code", "structure_code", "code"]
      ).map((row) => [
        first(companyById.get(row.company_id), ["company_code", "code"]),
        first(row, ["salary_structure_code", "structure_code", "code"]),
        first(row, ["salary_structure_name", "structure_name", "name"]),
      ])
    );

    const genericRefs = [
      {
        sheet: "REF_Jobs",
        headers: ["job_code", "job_name"],
        rows: jobs,
        code: ["job_code", "code"],
        name: ["job_name", "name"],
      },
      {
        sheet: "REF_Business_Units",
        headers: ["business_unit_code", "business_unit_name"],
        rows: businessUnits,
        code: ["business_unit_code", "code"],
        name: ["business_unit_name", "name"],
      },
      {
        sheet: "REF_Cost_Centers",
        headers: ["cost_center_code", "cost_center_name"],
        rows: costCenters,
        code: ["cost_center_code", "code"],
        name: ["cost_center_name", "name"],
      },
      {
        sheet: "REF_Profit_Centers",
        headers: ["profit_center_code", "profit_center_name"],
        rows: profitCenters,
        code: ["profit_center_code", "code"],
        name: ["profit_center_name", "name"],
      },
    ];

    for (const ref of genericRefs) {
      addSheet(
        workbook,
        ref.sheet,
        ref.headers,
        sortByCode(ref.rows.filter(active), ref.code).map((row) => [
          first(row, ref.code),
          first(row, ref.name),
        ])
      );
    }

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      compression: true,
    });

    const today = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const fileName = `employee_migration_template_${today}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("GENERATE_EMPLOYEE_MIGRATION_TEMPLATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถสร้าง Employee Migration Template ได้",
      },
      { status: 500 }
    );
  }
}
