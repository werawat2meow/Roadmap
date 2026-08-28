import * as XLSX from "xlsx";

import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
   Constants
========================================================= */

export const EMPLOYEE_IMPORT_TYPE =
  "employee_migration";

export const REQUIRED_EMPLOYEE_COLUMNS = [
  "employee_code",
  "first_name_th",
  "last_name_th",
  "company_code",
  "branch_code",
  "department_code",
  "position_family_code",
  "position_level_code",
  "position_code",
  "employment_type_code",
  "employee_status_code",
  "status",
  "start_work_date",
  "salary_band_code",
  "base_salary",
];

export const ALLOWED_EMPLOYEE_STATUSES = [
  "active",
  "inactive",
  "resigned",
];

const HEADER_ALIASES = {
  "employee_code*":
    "employee_code",

  "first_name_th*":
    "first_name_th",

  "last_name_th*":
    "last_name_th",

  "company_code*":
    "company_code",

  "branch_code*":
    "branch_code",

  "department_code*":
    "department_code",

  "position_family_code*":
    "position_family_code",

  "position_level_code*":
    "position_level_code",

  "position_code*":
    "position_code",

  "employment_type_code*":
    "employment_type_code",

  "employee_status_code*":
    "employee_status_code",

  "status*":
    "status",

  "start_work_date*":
    "start_work_date",

  "salary_band_code*":
    "salary_band_code",

  "base_salary*":
    "base_salary",
};

/* =========================================================
   Generic Helpers
========================================================= */

export function cleanText(
  value
) {
  return String(
    value ?? ""
  ).trim();
}

export function cleanNullableText(
  value
) {
  const text =
    cleanText(value);

  return text || null;
}

export function normalizeCode(
  value
) {
  return cleanText(
    value
  ).toUpperCase();
}

function normalizeHeader(
  value
) {
  const raw =
    cleanText(value)
      .replace(/\s+/g, "_")
      .toLowerCase();

  return (
    HEADER_ALIASES[raw] ||
    raw.replace(
      /\*+$/,
      ""
    )
  );
}

function normalizeBoolean(
  value,
  fallback = false
) {
  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  const text =
    cleanText(value)
      .toLowerCase();

  if (
    [
      "true",
      "1",
      "yes",
      "y",
    ].includes(text)
  ) {
    return true;
  }

  if (
    [
      "false",
      "0",
      "no",
      "n",
    ].includes(text)
  ) {
    return false;
  }

  return fallback;
}

function normalizeDateText(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return value
      .toISOString()
      .slice(0, 10);
  }

  const text =
    cleanText(value);

  if (!text) {
    return null;
  }

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return text;
  }

  const date =
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function normalizeNumber(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(
      String(value)
        .replaceAll(",", "")
        .trim()
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

function chunk(
  items,
  size = 100
) {
  const result = [];

  for (
    let index = 0;
    index < items.length;
    index += size
  ) {
    result.push(
      items.slice(
        index,
        index + size
      )
    );
  }

  return result;
}

function makeCodeMap(
  rows,
  codeField
) {
  const map =
    new Map();

  for (
    const row of
      rows || []
  ) {
    const code =
      normalizeCode(
        row?.[codeField]
      );

    if (code) {
      map.set(
        code,
        row
      );
    }
  }

  return map;
}

async function loadMaster(
  table,
  select,
  codeField
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(table)
      .select(select);

  if (error) {
    throw new Error(
      `${table}: ${error.message}`
    );
  }

  return makeCodeMap(
    data || [],
    codeField
  );
}

async function tryLoadMaster(
  table,
  select,
  codeField
) {
  try {
    return await loadMaster(
      table,
      select,
      codeField
    );
  } catch (error) {
    /*
     * Optional Master:
     * ถ้าระบบยังไม่มีตารางนั้น ให้ Map ว่าง
     * และจะ Error เฉพาะเมื่อ Excel ระบุ Code ของ Master นั้น
     */
    console.warn(
      `OPTIONAL_MASTER_NOT_AVAILABLE: ${table}`,
      error?.message
    );

    return new Map();
  }
}

/* =========================================================
   Parse XLSX
========================================================= */

export function parseEmployeeMigrationWorkbook(
  arrayBuffer
) {
  const workbook =
    XLSX.read(
      Buffer.from(
        arrayBuffer
      ),
      {
        type: "buffer",
        cellDates: true,
        raw: true,
      }
    );

  const sheetName =
    workbook.SheetNames.find(
      (name) =>
        cleanText(name)
          .toLowerCase() ===
        "employees"
    ) ||
    workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(
      "ไม่พบ Sheet Employees"
    );
  }

  const worksheet =
    workbook.Sheets[
      sheetName
    ];

  const matrix =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        header: 1,
        defval: "",
        raw: true,
        blankrows: false,
      }
    );

  if (
    !Array.isArray(matrix) ||
    matrix.length < 2
  ) {
    return {
      headers: [],
      rows: [],
    };
  }

  const headers =
    (matrix[0] || [])
      .map(
        normalizeHeader
      );

  const rows = [];

  for (
    let index = 1;
    index < matrix.length;
    index += 1
  ) {
    const source =
      matrix[index] || [];

    const empty =
      source.every(
        (value) =>
          !cleanText(value)
      );

    if (empty) {
      continue;
    }

    const object = {};

    headers.forEach(
      (
        header,
        columnIndex
      ) => {
        if (!header) {
          return;
        }

        object[header] =
          source[
            columnIndex
          ];
      }
    );

    rows.push({
      row_no:
        index + 1,

      raw:
        object,
    });
  }

  return {
    headers,
    rows,
  };
}

/* =========================================================
   Master Data
========================================================= */

export async function loadEmployeeImportMasters() {
  const [
    companies,
    branchGroups,
    branches,
    departments,
    divisions,
    units,
    positionFamilies,
    positionLevels,
    positions,
    jobs,
    businessUnits,
    costCenters,
    profitCenters,
    employmentTypes,
    employeeStatuses,
    payrollCompanies,
    payrollTypes,
    payrollGroups,
    salaryStructures,
    genders,
  ] =
    await Promise.all([
      loadMaster(
        "companies",
        "id,company_code,status",
        "company_code"
      ),

      tryLoadMaster(
        "branch_groups",
        "id,group_code,status",
        "group_code"
      ),

      loadMaster(
        "branches",
        "id,company_id,branch_code,status",
        "branch_code"
      ),

      loadMaster(
        "departments",
        "id,department_code,status",
        "department_code"
      ),

      tryLoadMaster(
        "divisions",
        "id,department_id,division_code,status",
        "division_code"
      ),

      tryLoadMaster(
        "units",
        "id,division_id,unit_code,status",
        "unit_code"
      ),

      loadMaster(
        "position_families",
        "id,family_code,status",
        "family_code"
      ),

      loadMaster(
        "position_levels",
        "id,level_code,status",
        "level_code"
      ),

      loadMaster(
        "positions",
        "id,position_code,position_family_id,status",
        "position_code"
      ),

      tryLoadMaster(
        "jobs",
        "id,job_code,status",
        "job_code"
      ),

      tryLoadMaster(
        "business_units",
        "id,business_unit_code,status",
        "business_unit_code"
      ),

      tryLoadMaster(
        "cost_centers",
        "id,cost_center_code,status",
        "cost_center_code"
      ),

      tryLoadMaster(
        "profit_centers",
        "id,profit_center_code,status",
        "profit_center_code"
      ),

      loadMaster(
        "employment_types",
        "id,employment_type_code,status",
        "employment_type_code"
      ),

      loadMaster(
        "employee_statuses",
        "id,status_code,status",
        "status_code"
      ),

      tryLoadMaster(
        "payroll_companies",
        "id,payroll_company_code,status",
        "payroll_company_code"
      ),

      tryLoadMaster(
        "payroll_types",
        "id,payroll_type_code,status",
        "payroll_type_code"
      ),

      tryLoadMaster(
        "payroll_groups",
        "id,payroll_group_code,status",
        "payroll_group_code"
      ),

      tryLoadMaster(
        "salary_structures",
        "id,salary_structure_code,status",
        "salary_structure_code"
      ),

      tryLoadMaster(
        "genders",
        "id,gender_code,status",
        "gender_code"
      ),
    ]);

  const {
    data:
      branchDepartmentRows,
    error:
      branchDepartmentError,
  } =
    await supabaseAdmin
      .from(
        "branch_departments"
      )
      .select(
        "branch_id,department_id,status"
      );

  if (
    branchDepartmentError
  ) {
    throw branchDepartmentError;
  }

  const branchDepartments =
    new Set(
      (branchDepartmentRows || [])
        .filter(
          (item) =>
            item.status !==
            "inactive"
        )
        .map(
          (item) =>
            `${item.branch_id}:${item.department_id}`
        )
    );

  const {
    data:
      familyLevelRows,
    error:
      familyLevelError,
  } =
    await supabaseAdmin
      .from(
        "position_family_levels"
      )
      .select(
        "position_family_id,position_level_id,status"
      );

  if (
    familyLevelError
  ) {
    throw familyLevelError;
  }

  const familyLevels =
    new Set(
      (familyLevelRows || [])
        .filter(
          (item) =>
            item.status !==
            "inactive"
        )
        .map(
          (item) =>
            `${item.position_family_id}:${item.position_level_id}`
        )
    );

  const {
    data:
      bandRows,
    error:
      bandError,
  } =
    await supabaseAdmin
      .from(
        "position_level_bands"
      )
      .select(
        "id,position_level_id,band_code,status"
      );

  if (bandError) {
    throw bandError;
  }

  const salaryBands =
    new Map();

  for (
    const item of
      bandRows || []
  ) {
    const key =
      `${item.position_level_id}:${normalizeCode(item.band_code)}`;

    salaryBands.set(
      key,
      item
    );
  }

  return {
    companies,
    branchGroups,
    branches,
    departments,
    divisions,
    units,
    positionFamilies,
    positionLevels,
    positions,
    jobs,
    businessUnits,
    costCenters,
    profitCenters,
    employmentTypes,
    employeeStatuses,
    payrollCompanies,
    payrollTypes,
    payrollGroups,
    salaryStructures,
    genders,
    branchDepartments,
    familyLevels,
    salaryBands,
  };
}

/* =========================================================
   Existing Employees + Compensation
========================================================= */

async function findEmployeesByField(
  field,
  values
) {
  const result = [];

  const unique =
    [
      ...new Set(
        values.filter(
          Boolean
        )
      ),
    ];

  for (
    const group of
      chunk(
        unique,
        100
      )
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("employees")
        .select(
          `
            id,
            employee_code,
            external_employee_id,
            company_id,
            branch_group_id,
            branch_id,
            department_id,
            division_id,
            unit_id,
            position_id,
            position_family_id,
            position_level_id,
            position_level_band_id,
            salary_structure_id,
            status
          `
        )
        .in(
          field,
          group
        );

    if (error) {
      throw error;
    }

    result.push(
      ...(data || [])
    );
  }

  return result;
}

export async function loadExistingEmployees(
  normalizedRows
) {
  const employeeCodes =
    normalizedRows
      .map(
        (item) =>
          item.employee_code
      )
      .filter(Boolean);

  const externalIds =
    normalizedRows
      .map(
        (item) =>
          item.external_employee_id
      )
      .filter(Boolean);

  const [
    byCodeRows,
    byExternalRows,
  ] =
    await Promise.all([
      findEmployeesByField(
        "employee_code",
        employeeCodes
      ),

      externalIds.length
        ? findEmployeesByField(
            "external_employee_id",
            externalIds
          )
        : Promise.resolve(
            []
          ),
    ]);

  const byCode =
    new Map();

  const byExternal =
    new Map();

  for (
    const item of
      byCodeRows
  ) {
    byCode.set(
      normalizeCode(
        item.employee_code
      ),
      item
    );
  }

  for (
    const item of
      byExternalRows
  ) {
    if (
      item.external_employee_id
    ) {
      byExternal.set(
        cleanText(
          item.external_employee_id
        ),
        item
      );
    }
  }

  return {
    byCode,
    byExternal,
  };
}

export async function loadActiveCompensations(
  employeeIds
) {
  const map =
    new Map();

  const unique =
    [
      ...new Set(
        employeeIds.filter(
          Boolean
        )
      ),
    ];

  for (
    const group of
      chunk(
        unique,
        100
      )
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "employee_compensations"
        )
        .select(
          `
            id,
            employee_id,
            salary_structure_id,
            position_id,
            position_level_id,
            position_level_band_id,
            payroll_company_id,
            payroll_type_id,
            payroll_group_id,
            currency_code,
            base_salary,
            effective_from,
            effective_to,
            source_type,
            status
          `
        )
        .in(
          "employee_id",
          group
        )
        .is(
          "effective_to",
          null
        )
        .eq(
          "status",
          "active"
        );

    if (error) {
      throw error;
    }

    for (
      const item of
        data || []
    ) {
      map.set(
        item.employee_id,
        item
      );
    }
  }

  return map;
}

/* =========================================================
   Normalize + Resolve
========================================================= */

function getMasterByCode(
  map,
  code
) {
  if (!code) {
    return null;
  }

  return (
    map.get(
      normalizeCode(
        code
      )
    ) ||
    null
  );
}

function pushMissingMaster(
  errors,
  label,
  code
) {
  errors.push(
    `ไม่พบ ${label}: ${code}`
  );
}

export function normalizeEmployeeImportRow(
  row
) {
  const raw =
    row?.raw || {};

  return {
    row_no:
      row.row_no,

    employee_code:
      normalizeCode(
        raw.employee_code
      ),

    external_employee_id:
      cleanNullableText(
        raw.external_employee_id
      ),

    first_name_th:
      cleanText(
        raw.first_name_th
      ),

    last_name_th:
      cleanText(
        raw.last_name_th
      ),

    first_name_en:
      cleanNullableText(
        raw.first_name_en
      ),

    last_name_en:
      cleanNullableText(
        raw.last_name_en
      ),

    nickname_th:
      cleanNullableText(
        raw.nickname_th
      ),

    gender_code:
      normalizeCode(
        raw.gender_code
      ),

    birth_date:
      normalizeDateText(
        raw.birth_date
      ),

    citizen_id:
      cleanNullableText(
        raw.citizen_id
      ),

    passport_no:
      cleanNullableText(
        raw.passport_no
      ),

    mobile_phone:
      cleanNullableText(
        raw.mobile_phone
      ),

    personal_email:
      cleanNullableText(
        raw.personal_email
      ),

    company_code:
      normalizeCode(
        raw.company_code
      ),

    branch_group_code:
      normalizeCode(
        raw.branch_group_code
      ),

    branch_code:
      normalizeCode(
        raw.branch_code
      ),

    department_code:
      normalizeCode(
        raw.department_code
      ),

    division_code:
      normalizeCode(
        raw.division_code
      ),

    unit_code:
      normalizeCode(
        raw.unit_code
      ),

    position_family_code:
      normalizeCode(
        raw.position_family_code
      ),

    position_level_code:
      normalizeCode(
        raw.position_level_code
      ),

    position_code:
      normalizeCode(
        raw.position_code
      ),

    job_code:
      normalizeCode(
        raw.job_code
      ),

    business_unit_code:
      normalizeCode(
        raw.business_unit_code
      ),

    cost_center_code:
      normalizeCode(
        raw.cost_center_code
      ),

    profit_center_code:
      normalizeCode(
        raw.profit_center_code
      ),

    employment_type_code:
      normalizeCode(
        raw.employment_type_code
      ),

    employee_status_code:
      normalizeCode(
        raw.employee_status_code
      ),

    status:
      cleanText(
        raw.status
      ).toLowerCase(),

    start_work_date:
      normalizeDateText(
        raw.start_work_date
      ),

    resignation_date:
      normalizeDateText(
        raw.resignation_date
      ),

    payroll_company_code:
      normalizeCode(
        raw.payroll_company_code
      ),

    payroll_type_code:
      normalizeCode(
        raw.payroll_type_code
      ),

    payroll_group_code:
      normalizeCode(
        raw.payroll_group_code
      ),

    salary_structure_code:
      normalizeCode(
        raw.salary_structure_code
      ),

    salary_band_code:
      normalizeCode(
        raw.salary_band_code
      ),

    base_salary:
      normalizeNumber(
        raw.base_salary
      ),

    remark:
      cleanNullableText(
        raw.remark
      ),

    raw_data:
      raw,
  };
}

export function resolveEmployeeImportRow({
  row,
  masters,
  existingEmployees,
  activeCompensations,
  scopeGuard,
}) {
  const errors = [];
  const warnings = [];

  for (
    const field of
      REQUIRED_EMPLOYEE_COLUMNS
  ) {
    const value =
      row?.[field];

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      errors.push(
        `กรุณาระบุ ${field}`
      );
    }
  }

  if (
    row.status &&
    !ALLOWED_EMPLOYEE_STATUSES.includes(
      row.status
    )
  ) {
    errors.push(
      "status ต้องเป็น active, inactive หรือ resigned"
    );
  }

  if (
    row.status ===
      "resigned" &&
    !row.resignation_date
  ) {
    errors.push(
      "พนักงานลาออกต้องระบุ resignation_date"
    );
  }

  if (
    row.base_salary ===
      null ||
    row.base_salary <
      0
  ) {
    errors.push(
      "base_salary ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป"
    );
  }

  const company =
    getMasterByCode(
      masters.companies,
      row.company_code
    );

  const branch =
    getMasterByCode(
      masters.branches,
      row.branch_code
    );

  const department =
    getMasterByCode(
      masters.departments,
      row.department_code
    );

  const positionFamily =
    getMasterByCode(
      masters.positionFamilies,
      row.position_family_code
    );

  const positionLevel =
    getMasterByCode(
      masters.positionLevels,
      row.position_level_code
    );

  const position =
    getMasterByCode(
      masters.positions,
      row.position_code
    );

  const employmentType =
    getMasterByCode(
      masters.employmentTypes,
      row.employment_type_code
    );

  const employeeStatus =
    getMasterByCode(
      masters.employeeStatuses,
      row.employee_status_code
    );

  if (
    row.company_code &&
    !company
  ) {
    pushMissingMaster(
      errors,
      "บริษัท",
      row.company_code
    );
  }

  if (
    row.branch_code &&
    !branch
  ) {
    pushMissingMaster(
      errors,
      "สังกัด",
      row.branch_code
    );
  }

  if (
    row.department_code &&
    !department
  ) {
    pushMissingMaster(
      errors,
      "แผนก",
      row.department_code
    );
  }

  if (
    row.position_family_code &&
    !positionFamily
  ) {
    pushMissingMaster(
      errors,
      "กลุ่มสายงาน",
      row.position_family_code
    );
  }

  if (
    row.position_level_code &&
    !positionLevel
  ) {
    pushMissingMaster(
      errors,
      "ระดับตำแหน่ง",
      row.position_level_code
    );
  }

  if (
    row.position_code &&
    !position
  ) {
    pushMissingMaster(
      errors,
      "ตำแหน่ง",
      row.position_code
    );
  }

  if (
    row.employment_type_code &&
    !employmentType
  ) {
    pushMissingMaster(
      errors,
      "ประเภทการจ้าง",
      row.employment_type_code
    );
  }

  if (
    row.employee_status_code &&
    !employeeStatus
  ) {
    pushMissingMaster(
      errors,
      "สถานะพนักงาน",
      row.employee_status_code
    );
  }

  if (
    company &&
    branch &&
    branch.company_id &&
    branch.company_id !==
      company.id
  ) {
    errors.push(
      `สังกัด ${row.branch_code} ไม่ได้อยู่ในบริษัท ${row.company_code}`
    );
  }

  if (
    branch &&
    department &&
    !masters.branchDepartments.has(
      `${branch.id}:${department.id}`
    )
  ) {
    errors.push(
      `แผนก ${row.department_code} ไม่ได้ผูกกับสังกัด ${row.branch_code}`
    );
  }

  if (
    positionFamily &&
    positionLevel &&
    !masters.familyLevels.has(
      `${positionFamily.id}:${positionLevel.id}`
    )
  ) {
    errors.push(
      `ระดับตำแหน่ง ${row.position_level_code} ไม่ได้อยู่ในกลุ่มสายงาน ${row.position_family_code}`
    );
  }

  if (
    position &&
    positionFamily &&
    position.position_family_id &&
    position.position_family_id !==
      positionFamily.id
  ) {
    errors.push(
      `ตำแหน่ง ${row.position_code} ไม่ได้อยู่ในกลุ่มสายงาน ${row.position_family_code}`
    );
  }

  const salaryBand =
    positionLevel
      ? masters.salaryBands.get(
          `${positionLevel.id}:${row.salary_band_code}`
        )
      : null;

  if (
    row.salary_band_code &&
    !salaryBand
  ) {
    errors.push(
      `ไม่พบ Salary Band ${row.salary_band_code} ภายใต้ระดับ ${row.position_level_code}`
    );
  }

  const branchGroup =
    getMasterByCode(
      masters.branchGroups,
      row.branch_group_code
    );

  const division =
    getMasterByCode(
      masters.divisions,
      row.division_code
    );

  const unit =
    getMasterByCode(
      masters.units,
      row.unit_code
    );

  const job =
    getMasterByCode(
      masters.jobs,
      row.job_code
    );

  const businessUnit =
    getMasterByCode(
      masters.businessUnits,
      row.business_unit_code
    );

  const costCenter =
    getMasterByCode(
      masters.costCenters,
      row.cost_center_code
    );

  const profitCenter =
    getMasterByCode(
      masters.profitCenters,
      row.profit_center_code
    );

  const payrollCompany =
    getMasterByCode(
      masters.payrollCompanies,
      row.payroll_company_code
    );

  const payrollType =
    getMasterByCode(
      masters.payrollTypes,
      row.payroll_type_code
    );

  const payrollGroup =
    getMasterByCode(
      masters.payrollGroups,
      row.payroll_group_code
    );

  const salaryStructure =
    getMasterByCode(
      masters.salaryStructures,
      row.salary_structure_code
    );

  const gender =
    getMasterByCode(
      masters.genders,
      row.gender_code
    );

  const optionalChecks = [
    [
      row.branch_group_code,
      branchGroup,
      "กลุ่มสังกัด",
    ],
    [
      row.division_code,
      division,
      "ฝ่าย",
    ],
    [
      row.unit_code,
      unit,
      "หน่วย",
    ],
    [
      row.job_code,
      job,
      "บทบาทงาน",
    ],
    [
      row.business_unit_code,
      businessUnit,
      "Business Unit",
    ],
    [
      row.cost_center_code,
      costCenter,
      "Cost Center",
    ],
    [
      row.profit_center_code,
      profitCenter,
      "Profit Center",
    ],
    [
      row.payroll_company_code,
      payrollCompany,
      "บริษัทเงินเดือน",
    ],
    [
      row.payroll_type_code,
      payrollType,
      "รอบการจ่ายเงิน",
    ],
    [
      row.payroll_group_code,
      payrollGroup,
      "กลุ่มเงินเดือน",
    ],
    [
      row.salary_structure_code,
      salaryStructure,
      "โครงสร้างเงินเดือน",
    ],
    [
      row.gender_code,
      gender,
      "เพศ",
    ],
  ];

  for (
    const [
      code,
      record,
      label,
    ] of optionalChecks
  ) {
    if (
      code &&
      !record
    ) {
      pushMissingMaster(
        errors,
        label,
        code
      );
    }
  }

  if (
    division &&
    department &&
    division.department_id &&
    division.department_id !==
      department.id
  ) {
    errors.push(
      `ฝ่าย ${row.division_code} ไม่ได้อยู่ในแผนก ${row.department_code}`
    );
  }

  if (
    unit &&
    division &&
    unit.division_id &&
    unit.division_id !==
      division.id
  ) {
    errors.push(
      `หน่วย ${row.unit_code} ไม่ได้อยู่ในฝ่าย ${row.division_code}`
    );
  }

  const employeePayload = {
    employee_code:
      row.employee_code,

    external_employee_id:
      row.external_employee_id,

    first_name_th:
      row.first_name_th,

    last_name_th:
      row.last_name_th,

    first_name_en:
      row.first_name_en,

    last_name_en:
      row.last_name_en,

    nickname_th:
      row.nickname_th,

    gender_id:
      gender?.id ||
      null,

    birth_date:
      row.birth_date,

    citizen_id:
      row.citizen_id,

    passport_no:
      row.passport_no,

    mobile_phone:
      row.mobile_phone,

    personal_email:
      row.personal_email,

    company_id:
      company?.id ||
      null,

    branch_group_id:
      branchGroup?.id ||
      null,

    branch_id:
      branch?.id ||
      null,

    department_id:
      department?.id ||
      null,

    division_id:
      division?.id ||
      null,

    unit_id:
      unit?.id ||
      null,

    position_family_id:
      positionFamily?.id ||
      null,

    position_level_id:
      positionLevel?.id ||
      null,

    position_id:
      position?.id ||
      null,

    position_level_band_id:
      salaryBand?.id ||
      null,

    job_id:
      job?.id ||
      null,

    business_unit_id:
      businessUnit?.id ||
      null,

    cost_center_id:
      costCenter?.id ||
      null,

    profit_center_id:
      profitCenter?.id ||
      null,

    employment_type_id:
      employmentType?.id ||
      null,

    employee_status_id:
      employeeStatus?.id ||
      null,

    status:
      row.status,

    start_work_date:
      row.start_work_date,

    hire_date:
      row.start_work_date,

    resignation_date:
      row.resignation_date,

    payroll_company_id:
      payrollCompany?.id ||
      null,

    payroll_type_id:
      payrollType?.id ||
      null,

    payroll_group_id:
      payrollGroup?.id ||
      null,

    salary_structure_id:
      salaryStructure?.id ||
      null,

    remark:
      row.remark,
  };

  const existing =
    row.external_employee_id
      ? existingEmployees
          .byExternal
          .get(
            row.external_employee_id
          ) ||
        existingEmployees
          .byCode
          .get(
            row.employee_code
          )
      : existingEmployees
          .byCode
          .get(
            row.employee_code
          );

  const action =
    existing
      ? "update"
      : "insert";

  if (
    existing &&
    row.external_employee_id &&
    existing.employee_code &&
    normalizeCode(
      existing.employee_code
    ) !==
      row.employee_code
  ) {
    warnings.push(
      `พบ external_employee_id เดิม โดยรหัสในระบบใหม่คือ ${existing.employee_code}; Migration จะรักษา employee_code ที่มีอยู่ในระบบใหม่`
    );

    employeePayload.employee_code =
      existing.employee_code;
  }

  if (
    scopeGuard &&
    !scopeGuard.canAccessEmployee(
      employeePayload
    )
  ) {
    errors.push(
      "ข้อมูลอยู่นอก Employee Scope ที่คุณได้รับสิทธิ์"
    );
  }

  if (
    existing &&
    scopeGuard &&
    !scopeGuard.canAccessEmployee(
      existing
    )
  ) {
    errors.push(
      "ไม่มีสิทธิ์แก้ไขพนักงานเดิมรายนี้"
    );
  }

  const currentCompensation =
    existing
      ? activeCompensations.get(
          existing.id
        ) ||
        null
      : null;

  if (
    currentCompensation &&
    currentCompensation.source_type !==
      "migration" &&
    (
      Number(
        currentCompensation.base_salary
      ) !==
        Number(
          row.base_salary
        ) ||
      currentCompensation.position_level_band_id !==
        salaryBand?.id
    )
  ) {
    errors.push(
      "พนักงานนี้มีค่าตอบแทนปัจจุบันที่ไม่ได้มาจาก Migration และไม่ตรงกับ Excel จึงไม่อัปเดตทับอัตโนมัติ"
    );
  }

  const compensationPayload = {
    salary_structure_id:
      salaryStructure?.id ||
      null,

    position_id:
      position?.id ||
      null,

    position_level_id:
      positionLevel?.id ||
      null,

    position_level_band_id:
      salaryBand?.id ||
      null,

    payroll_company_id:
      payrollCompany?.id ||
      null,

    payroll_type_id:
      payrollType?.id ||
      null,

    payroll_group_id:
      payrollGroup?.id ||
      null,

    currency_code:
      "THB",

    base_salary:
      row.base_salary,

    effective_from:
      row.start_work_date,

    effective_to:
      null,

    source_type:
      "migration",

    status:
      "active",

    reason:
      "Employee Migration",

    remark:
      row.remark,
  };

  return {
    ...row,

    action,

    existing_employee_id:
      existing?.id ||
      null,

    employee_payload:
      employeePayload,

    compensation_payload:
      compensationPayload,

    current_compensation:
      currentCompensation,

    errors,
    warnings,

    valid:
      errors.length ===
      0,
  };
}

/* =========================================================
   Full Validation
========================================================= */

export async function validateEmployeeMigration({
  parsedRows,
  scopeGuard,
}) {
  const normalizedRows =
    parsedRows.map(
      normalizeEmployeeImportRow
    );

  const [
    masters,
    existingEmployees,
  ] =
    await Promise.all([
      loadEmployeeImportMasters(),

      loadExistingEmployees(
        normalizedRows
      ),
    ]);

  const existingIds =
    [
      ...existingEmployees
        .byCode
        .values(),
      ...existingEmployees
        .byExternal
        .values(),
    ]
      .map(
        (item) =>
          item.id
      );

  const activeCompensations =
    await loadActiveCompensations(
      existingIds
    );

  const resolvedRows =
    normalizedRows.map(
      (row) =>
        resolveEmployeeImportRow({
          row,
          masters,
          existingEmployees,
          activeCompensations,
          scopeGuard,
        })
    );

  const duplicateCodes =
    new Map();

  for (
    const row of
      resolvedRows
  ) {
    const code =
      row.employee_code;

    if (!code) {
      continue;
    }

    duplicateCodes.set(
      code,
      (
        duplicateCodes.get(
          code
        ) ||
        0
      ) +
        1
    );
  }

  for (
    const row of
      resolvedRows
  ) {
    if (
      row.employee_code &&
      duplicateCodes.get(
        row.employee_code
      ) > 1
    ) {
      row.errors.push(
        `employee_code ${row.employee_code} ซ้ำในไฟล์`
      );

      row.valid = false;
    }
  }

  const summary = {
    total:
      resolvedRows.length,

    valid:
      resolvedRows.filter(
        (item) =>
          item.valid
      ).length,

    invalid:
      resolvedRows.filter(
        (item) =>
          !item.valid
      ).length,

    insert:
      resolvedRows.filter(
        (item) =>
          item.valid &&
          item.action ===
            "insert"
      ).length,

    update:
      resolvedRows.filter(
        (item) =>
          item.valid &&
          item.action ===
            "update"
      ).length,
  };

  return {
    rows:
      resolvedRows,

    summary,
  };
}

/* =========================================================
   Execute Row
========================================================= */

export async function executeEmployeeMigrationRow({
  row,
  actorId,
}) {
  let employeeId =
    row.existing_employee_id;

  let action =
    row.action;

  if (
    action ===
    "insert"
  ) {
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("employees")
        .insert({
          ...row.employee_payload,

          created_by:
            actorId,

          updated_by:
            actorId,
        })
        .select("id")
        .single();

    if (error) {
      throw error;
    }

    employeeId =
      data.id;
  } else {
    const {
      error,
    } =
      await supabaseAdmin
        .from("employees")
        .update({
          ...row.employee_payload,

          updated_by:
            actorId,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          employeeId
        );

    if (error) {
      throw error;
    }
  }

  const compensation =
    row.current_compensation;

  if (
    compensation &&
    compensation.source_type ===
      "migration"
  ) {
    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "employee_compensations"
        )
        .update({
          ...row.compensation_payload,

          employee_id:
            employeeId,

          updated_by:
            actorId,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          compensation.id
        );

    if (error) {
      throw error;
    }
  } else if (!compensation) {
    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "employee_compensations"
        )
        .insert({
          ...row.compensation_payload,

          employee_id:
            employeeId,

          created_by:
            actorId,

          updated_by:
            actorId,
        });

    if (error) {
      throw error;
    }
  }

  return {
    employee_id:
      employeeId,

    action,
  };
}

/* =========================================================
   Concurrency Helper
========================================================= */

export async function mapWithConcurrency(
  items,
  concurrency,
  worker
) {
  const results =
    new Array(
      items.length
    );

  let cursor = 0;

  async function run() {
    while (true) {
      const index =
        cursor;

      cursor += 1;

      if (
        index >=
        items.length
      ) {
        return;
      }

      try {
        results[index] =
          await worker(
            items[index],
            index
          );
      } catch (error) {
        results[index] = {
          success: false,
          error:
            error?.message ||
            "Import failed",
        };
      }
    }
  }

  await Promise.all(
    Array.from(
      {
        length:
          Math.max(
            1,
            concurrency
          ),
      },
      () => run()
    )
  );

  return results;
}
