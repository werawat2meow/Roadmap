import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  normalizeEmployeePayload,
  normalizeAccountPayload,
  normalizeEmployeeCodeRequest,
  cleanText,
} from "@/lib/employee/employeePayload";
import {
  validateEmployeeCreatePayload,
} from "@/lib/employee/employeeValidation";
import {
  createEmployeeTransaction,
  EMPLOYEE_DETAIL_SELECT,
  mapEmployeeDatabaseError,
} from "@/lib/employee/employeeTransaction";
import {requireScopedAccess,} from "@/lib/auth/requireScopedAccess";


const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALL_LIMIT = 5000;

const ALLOWED_STATUSES = [
  "active",
  "inactive",
  "resigned",
];

const ALLOWED_SORT_FIELDS = [
  "employee_code",

  "first_name_th",
  "last_name_th",

  "first_name_en",
  "last_name_en",

  "start_work_date",
  "probation_end_date",

  "created_at",
  "updated_at",

  "status",
];

const ALLOWED_SORT_DIRECTIONS = [
  "asc",
  "desc",
];

function successResponse(
  data,
  {
    status = 200,
    message = null,
    pagination = null,
    meta = null,
  } = {}
) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message =
      message;
  }

  if (pagination) {
    response.pagination =
      pagination;
  }

  if (meta) {
    response.meta =
      meta;
  }

  return NextResponse.json(
    response,
    {
      status,
    }
  );
}

function errorResponse(
  message,
  {
    status = 500,
    error = null,
    details = null,
  } = {}
) {
  const response = {
    success: false,
    message,
  };

  if (error) {
    response.error =
      error;
  }

  if (details) {
    response.details =
      details;
  }

  return NextResponse.json(
    response,
    {
      status,
    }
  );
}

function cleanNullableText(
  value
) {
  const cleaned =
    cleanText(value);

  return cleaned || null;
}

<<<<<<< HEAD

function calculateProbationEndDate(hireDate, days) {
  if (!hireDate || !days) return null;

  const date = new Date(hireDate);
  date.setDate(date.getDate() + Number(days));

  return date.toISOString().slice(0, 10);
}

/* =========================
   helper: escape ilike keyword
========================= */
function escapeLike(value = "") {
  return value.replace(/[%_,]/g, "\\$&");
=======
function parsePositiveInteger(
  value,
  fallback,
  max = null
) {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  if (
    max !== null &&
    parsed > max
  ) {
    return max;
  }

  return parsed;
>>>>>>> test_merge_all
}

function parseBoolean(
  value,
  fallback = false
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    value === "true" ||
    value === "1" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === "false" ||
    value === "0" ||
    value === 0
  ) {
    return false;
  }

  return fallback;
}

function sanitizeSearch(
  value
) {
  return cleanText(value)
    .replaceAll(
      ",",
      " "
    )
    .replaceAll(
      "(",
      " "
    )
    .replaceAll(
      ")",
      " "
    )
    .replaceAll(
      "%",
      ""
    )
    .replaceAll(
      "*",
      ""
    )
    .trim();
}

function getFilterValue(
  searchParams,
  key
) {
  return cleanNullableText(
    searchParams.get(key)
  );
}

function normalizeSortField(
  value
) {
  const field =
    cleanText(value);

  if (
    ALLOWED_SORT_FIELDS.includes(
      field
    )
  ) {
    return field;
  }

  return "created_at";
}

function normalizeSortDirection(
  value
) {
  const direction =
    cleanText(value)
      .toLowerCase();

  if (
    ALLOWED_SORT_DIRECTIONS.includes(
      direction
    )
  ) {
    return direction;
  }

  return "desc";
}

function getErrorStatus(
  error
) {
  if (!error) {
    return 500;
  }

  /*
    Unique violation
  */

  if (
    error.code ===
    "23505"
  ) {
    return 409;
  }

  /*
    Foreign key violation
  */

  if (
    error.code ===
    "23503"
  ) {
    return 400;
  }

  /*
    Check constraint violation
  */

  if (
    error.code ===
    "23514"
  ) {
    return 400;
  }

  /*
    Invalid UUID / invalid text representation
  */

  if (
    error.code ===
    "22P02"
  ) {
    return 400;
  }

  /*
    Not-null violation
  */

  if (
    error.code ===
    "23502"
  ) {
    return 400;
  }

  /*
    Undefined column
  */

  if (
    error.code ===
    "42703"
  ) {
    return 500;
  }

  /*
    PostgREST relationship error
  */

  if (
    error.code ===
    "PGRST200"
  ) {
    return 500;
  }

  return 500;
}

/* =========================================================
   DATABASE ERROR DETAILS
========================================================= */

function getDatabaseErrorDetails(
  error
) {
  if (!error) {
    return null;
  }

  return {
<<<<<<< HEAD
    id: item.id,
    employee_code: item.employee_code,
    first_name_th: item.first_name_th,
    last_name_th: item.last_name_th,
    first_name_en: item.first_name_en || "",
    last_name_en: item.last_name_en || "",
    full_name_th: `${item.first_name_th || ""} ${item.last_name_th || ""}`.trim(),
    full_name_en: `${item.first_name_en || ""} ${item.last_name_en || ""}`.trim(),
    nick_name: item.nick_name || "",
    gender: item.gender || "",
    phone: item.phone || "",
    email: item.email || "",
    citizen_id: item.citizen_id || "",
    passport_no: item.passport_no || "",
    birth_date: item.birth_date || "",
    line_id: item.line_id || "",
    employee_photo_url: item.employee_photo_url || "",
    nationality: item.nationality || "",
    hire_date: item.hire_date || "",
    employment_type: item.employment_type || "",
    status: item.status,
    employee_status_id: item.employee_status_id || "",
    resignation_date: item.resignation_date || "",
    employee_status_name: item.employee_statuses?.status_name || "-",
    employee_status_color: item.employee_statuses?.color || "slate",
    company_id: item.company_id || "",
    branch_id: item.branch_id || "",
    department_id: item.department_id || "",
    division_id: item.division_id || "",
    unit_id: item.unit_id || "",
    position_id: item.position_id || "",
    company_code: item.companies?.company_code || "",
    company_name: item.companies?.company_name_th || item.companies?.company_name_en || "-",
    branch_name: item.branches?.branch_name || "-",
    department_name: item.departments?.department_name || "-",
    division_name: item.divisions?.division_name || "-",
    unit_name: item.units?.unit_name || "-",
    position_name: item.positions?.position_name || "-",
    position_level: item.positions?.position_level || "",
    branch_group_id: item.branch_group_id || "",
    branch_group_code: item.branch_groups?.group_code || "",
    branch_group_name:item.branch_groups?.group_name || "-",
    branch_group_color:item.branch_groups?.group_color || "",
    job_id:item.job_id || "",
    job_code:item.jobs?.job_code || "",
    job_name:item.jobs?.job_name || "-",
    job_level:item.jobs?.job_level || "",
    management_level:item.jobs?.management_level ||item.positions?.position_level ||"",
    scope_type:item.jobs?.scope_type || "",
    job_color:item.jobs?.job_color || "",
    job_icon:item.jobs?.job_icon || "",
    can_manage_employees:Boolean(item.jobs?.can_manage_employees),
    can_approve_budget: Boolean(item.jobs?.can_approve_budget),

    /*
    * ส่ง Object เดิมไปด้วย
    * เพื่อรองรับหน้าที่อ่าน employee.jobs.management_level
    */
    jobs: item.jobs
      ? {
          job_code:
            item.jobs.job_code || "",

          job_name:
            item.jobs.job_name || "-",

          job_level:
            item.jobs.job_level || "",

          management_level:
            item.jobs.management_level ||
            "",

          scope_type:
            item.jobs.scope_type || "",

          job_color:
            item.jobs.job_color || "",

          job_icon:
            item.jobs.job_icon || "",

          can_manage_employees:
            Boolean(
              item.jobs.can_manage_employees
            ),

          can_approve_budget:
            Boolean(
              item.jobs.can_approve_budget
            ),
        }
      : null,

    positions: item.positions
      ? {
          position_name:
            item.positions.position_name ||
            "-",

          position_level:
            item.positions.position_level ||
            "",
        }
      : null,

    management_assignment_id: item.management_assignment_id || "",
    created_at: item.created_at,
    probation_days: item.probation_days ?? null,
    probation_end_date: item.probation_end_date || "",
    probation_status: item.probation_status || "",
    business_unit_id: item.business_unit_id || "",
    cost_center_id: item.cost_center_id || "",
    profit_center_id: item.profit_center_id || "",
    business_unit_code: item.business_units?.business_unit_code || "",
    business_unit_name: item.business_units?.business_unit_name || "-",
    cost_center_code: item.cost_centers?.cost_center_code || "",
    cost_center_name: item.cost_centers?.cost_center_name || "-",
    profit_center_code: item.profit_centers?.profit_center_code || "",
    profit_center_name: item.profit_centers?.profit_center_name || "-",
    payroll_company_id: item.payroll_company_id || "",
    payroll_type_id: item.payroll_type_id || "",
    payroll_company_code: item.payroll_companies?.payroll_company_code || "",
    payroll_company_name: item.payroll_companies?.payroll_company_name || "-",
    payroll_payment_day: item.payroll_companies?.payment_day === null || item.payroll_companies?.payment_day === undefined ? null : Number(item.payroll_companies.payment_day),
    payroll_company_master_id: item.payroll_companies?.companies?.id || "",
    payroll_company_master_code: item.payroll_companies?.companies?.company_code || "",
    payroll_company_master_name: item.payroll_companies?.companies?.company_name_th || item.payroll_companies?.companies?.company_name_en || "-",
    payroll_company_tax_id: item.payroll_companies?.companies?.tax_id || "",
    payroll_type_code: item.payroll_types?.payroll_type_code || "",
    payroll_type_name: item.payroll_types?.payroll_type_name || "-",
    payment_frequency: item.payroll_types?.payment_frequency || "",
    default_payment_day: item.payroll_types?.default_payment_day === null || item.payroll_types?.default_payment_day === undefined ? null : Number(item.payroll_types.default_payment_day),

=======
    code:
      error.code || null,

    message:
      error.message || null,

    details:
      error.details || null,

    hint:
      error.hint || null,
>>>>>>> test_merge_all
  };
}

/* =========================================================
   UUID HELPERS
========================================================= */

function isUuid(
  value
) {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value).trim()
  );
}

function validateOptionalUuid(
  value,
  fieldLabel
) {
  if (!value) {
    return null;
  }

  if (!isUuid(value)) {
    return `${fieldLabel} ไม่ถูกต้อง`;
  }

  return null;
}

/* =========================================================
   FILTER VALIDATION
========================================================= */

function validateEmployeeFilters({
  companyId,
  branchGroupId,
  branchId,
  departmentId,
  divisionId,
  unitId,

  positionFamilyId,
  positionLevelId,
  positionId,
  jobId,

  businessUnitId,
  costCenterId,
  profitCenterId,

  employeeStatusId,
  employmentTypeId,
  genderId,
  nationalityId,

  payrollCompanyId,
  payrollTypeId,
  payrollGroupId,
  positionLevelBandId,
}) {
  const filters = [
    [
      companyId,
      "รหัสบริษัท",
    ],

    [
      branchGroupId,
      "รหัสกรุ๊ปสังกัด",
    ],

    [
      branchId,
      "รหัสสังกัด",
    ],

    [
      departmentId,
      "รหัสแผนก",
    ],

    [
      divisionId,
      "รหัสฝ่าย",
    ],

    [
      unitId,
      "รหัสหน่วยงาน",
    ],

    [
      positionFamilyId,
      "รหัสกลุ่มสายงาน",
    ],

    [
      positionLevelId,
      "รหัสระดับตำแหน่ง",
    ],

    [
      positionId,
      "รหัสตำแหน่ง",
    ],

    [
      jobId,
      "รหัสบทบาทงาน",
    ],

    [
      businessUnitId,
      "รหัส Business Unit",
    ],

    [
      costCenterId,
      "รหัส Cost Center",
    ],

    [
      profitCenterId,
      "รหัส Profit Center",
    ],

    [
      employeeStatusId,
      "รหัสสถานะพนักงาน",
    ],

    [
      employmentTypeId,
      "รหัสประเภทการจ้าง",
    ],

    [
      genderId,
      "รหัสเพศ",
    ],

    [
      nationalityId,
      "รหัสสัญชาติ",
    ],

    [
      payrollCompanyId,
      "รหัสบริษัทเงินเดือน",
    ],

    [
      payrollTypeId,
      "รหัสประเภทเงินเดือน",
    ],

    [
      payrollGroupId,
      "รหัสกลุ่มเงินเดือน",
    ],

    [
      positionLevelBandId,
      "รหัสช่วงเงินเดือน",
    ],
  ];

  for (
    const [
      value,
      label,
    ] of filters
  ) {
    const error =
      validateOptionalUuid(
        value,
        label
      );

    if (error) {
      return error;
    }
  }

  return null;
}

/* =========================================================
   STATUS VALIDATION
========================================================= */

function validateEmployeeStatusFilter(
  status
) {
  if (!status) {
    return null;
  }

  if (
    !ALLOWED_STATUSES.includes(
      status
    )
  ) {
    return "สถานะพนักงานไม่ถูกต้อง";
  }

  return null;
}


/* =========================================================
   EMPLOYEE SUMMARY
========================================================= */

async function getEmployeeSummary({
  guard = null,
  currentEmployeeId = null,

  companyId = null,
  branchGroupId = null,
  branchId = null,
  departmentId = null,
  divisionId = null,
  unitId = null,

  positionFamilyId = null,
  positionLevelId = null,
  positionId = null,
  jobId = null,

  employeeStatusId = null,
  employmentTypeId = null,

  status = null,
} = {}) {
  const SUMMARY_SELECT = `
    id,
    employee_status_id,
    employment_type_id,
    start_work_date,
    resignation_date,
    status,
    employee_statuses:employee_status_id (
      id,
      status_code,
      status_name,
      is_working,
      is_payroll,
      is_benefit,
      is_headcount
    )
  `;

  const applySummaryFilters = (query) => {
    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (branchGroupId) {
      query = query.eq("branch_group_id", branchGroupId);
    }

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    if (divisionId) {
      query = query.eq("division_id", divisionId);
    }

    if (unitId) {
      query = query.eq("unit_id", unitId);
    }

    if (positionFamilyId) {
      query = query.eq("position_family_id", positionFamilyId);
    }

    if (positionLevelId) {
      query = query.eq("position_level_id", positionLevelId);
    }

    if (positionId) {
      query = query.eq("position_id", positionId);
    }

    if (jobId) {
      query = query.eq("job_id", jobId);
    }

    if (employeeStatusId) {
      query = query.eq("employee_status_id", employeeStatusId);
    }

    if (employmentTypeId) {
      query = query.eq("employment_type_id", employmentTypeId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    return query;
  };

  try {
    /* =====================================================
       SCOPE ROWS

       ตัวเองถูกแยกออกจาก Scoped Query แล้วเติมกลับ 1 ครั้ง
       เพื่อให้กฎเป็น:

       SELF + EMPLOYEES IN SCOPE
    ===================================================== */

    let scopedQuery = supabaseAdmin
      .from("employees")
      .select(SUMMARY_SELECT);

    if (guard) {
      scopedQuery = guard.applyEmployeeScope(scopedQuery);
    }

    if (currentEmployeeId) {
      scopedQuery = scopedQuery.neq("id", currentEmployeeId);
    }

    scopedQuery = applySummaryFilters(scopedQuery);

    const {
      data: scopedData,
      error: scopedError,
    } = await scopedQuery;

    if (scopedError) {
      console.error("getEmployeeSummary scoped error:", scopedError);
      return null;
    }

    let rows = Array.isArray(scopedData)
      ? scopedData
      : [];

    /* =====================================================
       SELF ROW

       Self View bypass เฉพาะ Scope เท่านั้น
       Permission ems.employees.view ยังถูกตรวจโดย guard ก่อนแล้ว
       และ Filter ที่ผู้ใช้เลือกยังทำงานตามปกติ
    ===================================================== */

    if (currentEmployeeId) {
      let selfQuery = supabaseAdmin
        .from("employees")
        .select(SUMMARY_SELECT)
        .eq("id", currentEmployeeId);

      selfQuery = applySummaryFilters(selfQuery);

      const {
        data: selfData,
        error: selfError,
      } = await selfQuery.maybeSingle();

      if (selfError) {
        console.error("getEmployeeSummary self error:", selfError);
      } else if (selfData) {
        rows = [selfData, ...rows];
      }
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const summary = {
      total: rows.length,
      active: 0,
      inactive: 0,
      probation: 0,
      resigned: 0,
      newThisMonth: 0,
      newThisYear: 0,
      resignedThisMonth: 0,
      resignedThisYear: 0,
    };

    for (const employee of rows) {
      const employeeStatus = employee.employee_statuses || null;

      const statusCode = String(
        employeeStatus?.status_code || ""
      )
        .trim()
        .toUpperCase();

      if (employeeStatus?.is_working === true) {
        summary.active += 1;
      }

      if (statusCode === "PROBATION") {
        summary.probation += 1;
      }

      if (statusCode === "RESIGNED") {
        summary.resigned += 1;
      }

      if (
        employeeStatus?.is_working === false &&
        statusCode !== "RESIGNED"
      ) {
        summary.inactive += 1;
      }

      if (employee.start_work_date) {
        const startDate = new Date(employee.start_work_date);

        if (!Number.isNaN(startDate.getTime())) {
          if (startDate.getFullYear() === currentYear) {
            summary.newThisYear += 1;

            if (startDate.getMonth() === currentMonth) {
              summary.newThisMonth += 1;
            }
          }
        }
      }

      if (
        statusCode === "RESIGNED" &&
        employee.resignation_date
      ) {
        const resignationDate = new Date(
          employee.resignation_date
        );

        if (!Number.isNaN(resignationDate.getTime())) {
          if (resignationDate.getFullYear() === currentYear) {
            summary.resignedThisYear += 1;

            if (resignationDate.getMonth() === currentMonth) {
              summary.resignedThisMonth += 1;
            }
          }
        }
      }
    }

    return summary;
  } catch (error) {
    console.error("getEmployeeSummary exception:", error);
    return null;
  }
}

async function findDuplicateEmployee({field,value,}) {
  if (!field || !value) {
    return {
      success: true,
      data: null,
    };
  }

  try {
    let query = supabaseAdmin
      .from("employees")
      .select(
        `
<<<<<<< HEAD
        id,
        employee_code,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        nick_name,
        gender,
        phone,
        email,
        employee_photo_url,
        nationality,
        hire_date,
        employment_type,
        probation_days,
        probation_end_date,
        probation_status,
        status,
        employee_status_id,
        resignation_date,
        company_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        branch_group_id,
        job_id,
        management_assignment_id,
        business_unit_id,
        cost_center_id,
        profit_center_id,
        payroll_company_id,
        payroll_type_id,
        created_at,
        citizen_id,
        passport_no,
        birth_date,
        line_id,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en,
          tax_id
        ),
        branch_groups (
          group_code,
          group_name,
          group_color
        ),
        jobs (
          job_code,
          job_name,
          job_level,
          management_level,
          scope_type,
          job_color,
          job_icon,
          can_manage_employees,
          can_approve_budget
        ),
        employee_statuses (
          status_name,
          color
        ),
        branches (
          branch_name
        ),
        departments (
          department_name
        ),
        divisions (
          division_name
        ),
        units (
          unit_name
        ),
        positions (
          position_name,
          position_level
        ),
        business_units (
          business_unit_code,
          business_unit_name
        ),
        cost_centers (
          cost_center_code,
          cost_center_name
        ),
        profit_centers (
          profit_center_code,
          profit_center_name
        ),
        payroll_companies (
          id,
          payroll_company_code,
          payroll_company_name,
          payroll_type_id,
          payment_day,
          status,
          companies (
            id,
            company_code,
            company_name_th,
            company_name_en,
            tax_id
          )
        ),
        payroll_types (
          id,
          payroll_type_code,
          payroll_type_name,
          payment_frequency,
          default_payment_day,
          status
        )
      `,
        { count: "exact" }
=======
          id,
          employee_code,
          first_name_th,
          last_name_th
        `
>>>>>>> test_merge_all
      )
      .limit(1);

    if (
      field === "work_email" ||
      field === "personal_email"
    ) {
      query = query.ilike(
        field,
        value
      );
    } else {
      query = query.eq(
        field,
        value
      );
    }

    const {
      data,
      error,
    } = await query.maybeSingle();

    if (error) {
      return {
        success: false,
        data: null,
        error,
      };
    }

    return {
      success: true,
      data: data || null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error,
    };
  }
}

async function checkEmployeeDuplicates(employee) {
  try {
    const duplicateRules = [
      {
        field: "citizen_id",

        value:
          employee.citizen_id,

        duplicateMessage:
          "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว",

        checkErrorMessage:
          "ไม่สามารถตรวจสอบเลขบัตรประชาชนซ้ำได้",
      },

      {
        field: "passport_no",

        value:
          employee.passport_no,

        duplicateMessage:
          "เลขหนังสือเดินทางนี้มีอยู่ในระบบแล้ว",

        checkErrorMessage:
          "ไม่สามารถตรวจสอบเลขหนังสือเดินทางซ้ำได้",
      },

      {
        field: "work_email",

        value:
          employee.work_email,

        duplicateMessage:
          "อีเมลบริษัทนี้มีอยู่ในระบบแล้ว",

        checkErrorMessage:
          "ไม่สามารถตรวจสอบอีเมลบริษัทซ้ำได้",
      },
    ];

    for (
      const rule of duplicateRules
    ) {
      if (!rule.value) {
        continue;
      }

      const result =
        await findDuplicateEmployee({
          field:
            rule.field,

          value:
            rule.value,
        });

      if (!result.success) {
        return {
          success: false,

          message:
            rule.checkErrorMessage,

          status: 500,

          error:
            result.error,
        };
      }

      if (result.data) {
        return {
          success: false,

          message:
            rule.duplicateMessage,

          status: 409,

          duplicate: {
            field:
              rule.field,

            employee_id:
              result.data.id,

            employee_code:
              result.data
                .employee_code,

            employee_name:
              `${result.data.first_name_th || ""} ${result.data.last_name_th || ""}`.trim(),
          },
        };
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "checkEmployeeDuplicates exception:",
      error
    );

    return {
      success: false,

      message:
        "เกิดข้อผิดพลาดในการตรวจสอบข้อมูลพนักงานซ้ำ",

      status: 500,

      error,
    };
  }
}

async function validatePositionArchitecture({positionFamilyId,positionLevelId,positionId,jobId = null,}) {
  try {
    if (!positionFamilyId) {
      return {
        success: false,

        status: 400,

        message:
          "กรุณาเลือกกลุ่มสายงาน",
      };
    }

    if (!positionLevelId) {
      return {
        success: false,

        status: 400,

        message:
          "กรุณาเลือกระดับตำแหน่ง",
      };
    }

    if (!positionId) {
      return {
        success: false,

        status: 400,

        message:
          "กรุณาเลือกตำแหน่ง",
      };
    }

    /* -----------------------------------------------------
       Validate Family
    ----------------------------------------------------- */

    const {
      data: family,
      error: familyError,
    } = await supabaseAdmin
      .from(
        "position_families"
      )
      .select(
        `
          id,
          family_code,
          family_name,
          status
        `
      )
      .eq(
        "id",
        positionFamilyId
      )
      .maybeSingle();

    if (familyError) {
      return {
        success: false,

        status:
          getErrorStatus(
            familyError
          ),

        message:
          "ไม่สามารถตรวจสอบกลุ่มสายงานได้",

        error:
          familyError,
      };
    }

    if (!family) {
      return {
        success: false,

        status: 404,

        message:
          "ไม่พบกลุ่มสายงานที่เลือก",
      };
    }

    if (
      family.status &&
      family.status !== "active"
    ) {
      return {
        success: false,

        status: 400,

        message:
          "กลุ่มสายงานที่เลือกไม่ได้เปิดใช้งาน",
      };
    }

    /* -----------------------------------------------------
       Validate Level
    ----------------------------------------------------- */

    const {
      data: level,
      error: levelError,
    } = await supabaseAdmin
      .from(
        "position_levels"
      )
      .select(
        `
          id,
          level_code,
          level_name,
          status
        `
      )
      .eq(
        "id",
        positionLevelId
      )
      .maybeSingle();

    if (levelError) {
      return {
        success: false,

        status:
          getErrorStatus(
            levelError
          ),

        message:
          "ไม่สามารถตรวจสอบระดับตำแหน่งได้",

        error:
          levelError,
      };
    }

    if (!level) {
      return {
        success: false,

        status: 404,

        message:
          "ไม่พบระดับตำแหน่งที่เลือก",
      };
    }

    if (
      level.status &&
      level.status !== "active"
    ) {
      return {
        success: false,

        status: 400,

        message:
          "ระดับตำแหน่งที่เลือกไม่ได้เปิดใช้งาน",
      };
    }

    /* -----------------------------------------------------
       Validate Family ↔ Level Mapping
    ----------------------------------------------------- */

    const {
      data: familyLevel,
      error:
        familyLevelError,
    } = await supabaseAdmin
      .from(
        "position_family_levels"
      )
      .select(
        `
          id,
          position_family_id,
          position_level_id
        `
      )
      .eq(
        "position_family_id",
        positionFamilyId
      )
      .eq(
        "position_level_id",
        positionLevelId
      )
      .maybeSingle();

    if (familyLevelError) {
      return {
        success: false,

        status:
          getErrorStatus(
            familyLevelError
          ),

        message:
          "ไม่สามารถตรวจสอบระดับของกลุ่มสายงานได้",

        error:
          familyLevelError,
      };
    }

    if (!familyLevel) {
      return {
        success: false,

        status: 400,

        message:
          "ระดับตำแหน่งที่เลือกไม่ได้อยู่ในกลุ่มสายงานนี้",
      };
    }

    /* -----------------------------------------------------
       Validate Position
    ----------------------------------------------------- */

    const {
      data: position,
      error:
        positionError,
    } = await supabaseAdmin
      .from("positions")
      .select(
        `
          id,
          position_code,
          position_name,
          position_family_id,
          job_id,
          is_manager,
          is_executive,
          status
        `
      )
      .eq(
        "id",
        positionId
      )
      .maybeSingle();

    if (positionError) {
      return {
        success: false,

        status:
          getErrorStatus(
            positionError
          ),

        message:
          "ไม่สามารถตรวจสอบตำแหน่งได้",

        error:
          positionError,
      };
    }

    if (!position) {
      return {
        success: false,

        status: 404,

        message:
          "ไม่พบตำแหน่งที่เลือก",
      };
    }

    if (
      position.status !==
      "active"
    ) {
      return {
        success: false,

        status: 400,

        message:
          "ตำแหน่งที่เลือกไม่ได้เปิดใช้งาน",
      };
    }

    if (
      position.position_family_id !==
      positionFamilyId
    ) {
      return {
        success: false,

        status: 400,

        message:
          "ตำแหน่งที่เลือกไม่ได้อยู่ในกลุ่มสายงานนี้",
      };
    }

    /* -----------------------------------------------------
       Validate Job
    ----------------------------------------------------- */

    const resolvedJobId =
      jobId ||
      position.job_id ||
      null;

    if (
      jobId &&
      position.job_id &&
      jobId !==
        position.job_id
    ) {
      return {
        success: false,

        status: 400,

        message:
          "บทบาทงานที่เลือกไม่ตรงกับตำแหน่ง",
      };
    }

    if (resolvedJobId) {
      const {
        data: job,
        error: jobError,
      } = await supabaseAdmin
        .from("jobs")
        .select(
          `
            id,
            job_code,
            job_name,
            status
          `
        )
        .eq(
          "id",
          resolvedJobId
        )
        .maybeSingle();

      if (jobError) {
        return {
          success: false,

          status:
            getErrorStatus(
              jobError
            ),

          message:
            "ไม่สามารถตรวจสอบบทบาทงานได้",

          error:
            jobError,
        };
      }

      if (!job) {
        return {
          success: false,

          status: 404,

          message:
            "ไม่พบบทบาทงานที่เลือก",
        };
      }

      if (
        job.status &&
        job.status !==
          "active"
      ) {
        return {
          success: false,

          status: 400,

          message:
            "บทบาทงานที่เลือกไม่ได้เปิดใช้งาน",
        };
      }

      return {
        success: true,

        data: {
          family,

          level,

          familyLevel,

          position,

          job,

          resolvedJobId,
        },
      };
    }

    return {
      success: true,

      data: {
        family,

        level,

        familyLevel,

        position,

        job: null,

        resolvedJobId: null,
      },
    };
  } catch (error) {
    console.error(
      "validatePositionArchitecture exception:",
      error
    );

    return {
      success: false,

      status: 500,

      message:
        "เกิดข้อผิดพลาดในการตรวจสอบโครงสร้างตำแหน่ง",

      error,
    };
  }
}

export async function GET(req) {
  try {
    /* =======================================================
       Permission + Scope

       Enterprise Rule:
       - ต้องมี ems.employees.view
       - ตัวเองเห็นได้เสมอเมื่อมี Permission นี้
       - คนอื่นต้องอยู่ใน Scope ของ Login User
       - Search / Filter ยังจำกัดทั้ง Self และ Scoped Rows
    ========================================================= */

    const guard = await requireScopedAccess(
      "ems.employees",
      "view"
    );

    if (!guard.ok) {
      return guard.response;
    }

    const currentEmployeeId =
      guard?.access?.employee_id ||
      guard?.access?.user?.employee_id ||
      guard?.user?.employee_id ||
      guard?.employee_id ||
      null;

    const { searchParams } = new URL(req.url);

    /* -----------------------------------------------------
       GENERAL PARAMETERS
    ----------------------------------------------------- */

    const search = sanitizeSearch(
      searchParams.get("search")
    );

    const all = parseBoolean(
      searchParams.get("all"),
      false
    );

    const includeSummary = parseBoolean(
      searchParams.get("include_summary"),
      false
    );

    const page = parsePositiveInteger(
      searchParams.get("page"),
      DEFAULT_PAGE
    );

    const pageSize = parsePositiveInteger(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    const sortField = normalizeSortField(
      searchParams.get("sort_field")
    );

    const sortDirection = normalizeSortDirection(
      searchParams.get("sort_direction")
    );

    /* -----------------------------------------------------
       ORGANIZATION FILTERS
    ----------------------------------------------------- */

    const companyId = getFilterValue(
      searchParams,
      "company_id"
    );

    const branchGroupId = getFilterValue(
      searchParams,
      "branch_group_id"
    );

    const branchId = getFilterValue(
      searchParams,
      "branch_id"
    );

    const departmentId = getFilterValue(
      searchParams,
      "department_id"
    );

    const divisionId = getFilterValue(
      searchParams,
      "division_id"
    );

    const unitId = getFilterValue(
      searchParams,
      "unit_id"
    );

    /* -----------------------------------------------------
       JOB ARCHITECTURE FILTERS
    ----------------------------------------------------- */

    const positionFamilyId = getFilterValue(
      searchParams,
      "position_family_id"
    );

    const positionLevelId = getFilterValue(
      searchParams,
      "position_level_id"
    );

    const positionId = getFilterValue(
      searchParams,
      "position_id"
    );

    const jobId = getFilterValue(
      searchParams,
      "job_id"
    );

    /* -----------------------------------------------------
       COST STRUCTURE FILTERS
    ----------------------------------------------------- */

    const businessUnitId = getFilterValue(
      searchParams,
      "business_unit_id"
    );

    const costCenterId = getFilterValue(
      searchParams,
      "cost_center_id"
    );

    const profitCenterId = getFilterValue(
      searchParams,
      "profit_center_id"
    );

    /* -----------------------------------------------------
       EMPLOYEE FILTERS
    ----------------------------------------------------- */

    const status = getFilterValue(
      searchParams,
      "status"
    );

    const employeeStatusId = getFilterValue(
      searchParams,
      "employee_status_id"
    );

    const employmentTypeId = getFilterValue(
      searchParams,
      "employment_type_id"
    );

    const genderId = getFilterValue(
      searchParams,
      "gender_id"
    );

    const nationalityId = getFilterValue(
      searchParams,
      "nationality_id"
    );

    const countryId = getFilterValue(
      searchParams,
      "country_id"
    );

    /* -----------------------------------------------------
       PAYROLL FILTERS
    ----------------------------------------------------- */

    const payrollCompanyId = getFilterValue(
      searchParams,
      "payroll_company_id"
    );

    const payrollTypeId = getFilterValue(
      searchParams,
      "payroll_type_id"
    );

    const payrollGroupId = getFilterValue(
      searchParams,
      "payroll_group_id"
    );

    const positionLevelBandId = getFilterValue(
      searchParams,
      "position_level_band_id"
    );

    /* -----------------------------------------------------
       ACCOUNT FILTERS
    ----------------------------------------------------- */

    const hasUserAccount = getFilterValue(
      searchParams,
      "has_user_account"
    );

    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    const filterValidationError = validateEmployeeFilters({
      companyId,
      branchGroupId,
      branchId,
      departmentId,
      divisionId,
      unitId,
      positionFamilyId,
      positionLevelId,
      positionId,
      jobId,
      businessUnitId,
      costCenterId,
      profitCenterId,
      employeeStatusId,
      employmentTypeId,
      genderId,
      nationalityId,
      payrollCompanyId,
      payrollTypeId,
      payrollGroupId,
      positionLevelBandId,
    });

    if (filterValidationError) {
      return errorResponse(
        filterValidationError,
        { status: 400 }
      );
    }

    const statusValidationError =
      validateEmployeeStatusFilter(status);

    if (statusValidationError) {
      return errorResponse(
        statusValidationError,
        { status: 400 }
      );
    }

    /* =====================================================
       ACCOUNT IDS FOR has_user_account=false
    ===================================================== */

    let employeeIdsWithAccount = [];

    if (hasUserAccount === "false") {
      const {
        data: accountRows,
        error: accountError,
      } = await supabaseAdmin
        .from("user_accounts")
        .select("employee_id")
        .not("employee_id", "is", null);

      if (accountError) {
        console.error(
          "GET employee account filter error:",
          accountError
        );

        return errorResponse(
          "ไม่สามารถกรองพนักงานที่ไม่มีบัญชีผู้ใช้งานได้",
          {
            status: getErrorStatus(accountError),
            error: mapEmployeeDatabaseError(accountError),
            details: getDatabaseErrorDetails(accountError),
          }
        );
      }

      employeeIdsWithAccount = (accountRows || [])
        .map((item) => item.employee_id)
        .filter(Boolean);
    }

    /* =====================================================
       SHARED FILTER BUILDER

       ใช้ตัวเดียวกันทั้ง Self Query และ Scoped Query
       เพื่อไม่ให้ Self ฝืน Search/Filter ที่ผู้ใช้เลือก
    ===================================================== */

    const applyListFilters = (inputQuery) => {
      let query = inputQuery;

      if (search) {
        query = query.or(
          [
            `employee_code.ilike.%${search}%`,
            `first_name_th.ilike.%${search}%`,
            `middle_name_th.ilike.%${search}%`,
            `last_name_th.ilike.%${search}%`,
            `first_name_en.ilike.%${search}%`,
            `middle_name_en.ilike.%${search}%`,
            `last_name_en.ilike.%${search}%`,
            `nickname_th.ilike.%${search}%`,
            `nickname_en.ilike.%${search}%`,
            `nick_name.ilike.%${search}%`,
            `citizen_id.ilike.%${search}%`,
            `passport_no.ilike.%${search}%`,
            `tax_id.ilike.%${search}%`,
            `social_security_no.ilike.%${search}%`,
            `mobile_phone.ilike.%${search}%`,
            `home_phone.ilike.%${search}%`,
            `work_phone.ilike.%${search}%`,
            `phone.ilike.%${search}%`,
            `personal_email.ilike.%${search}%`,
            `work_email.ilike.%${search}%`,
            `email.ilike.%${search}%`,
            `line_id.ilike.%${search}%`,
            `birth_place.ilike.%${search}%`,
            `birth_postcode.ilike.%${search}%`,
          ].join(",")
        );
      }

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      if (branchGroupId) {
        query = query.eq("branch_group_id", branchGroupId);
      }

      if (branchId) {
        query = query.eq("branch_id", branchId);
      }

      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }

      if (divisionId) {
        query = query.eq("division_id", divisionId);
      }

      if (unitId) {
        query = query.eq("unit_id", unitId);
      }

      if (positionFamilyId) {
        query = query.eq("position_family_id", positionFamilyId);
      }

      if (positionLevelId) {
        query = query.eq("position_level_id", positionLevelId);
      }

      if (positionId) {
        query = query.eq("position_id", positionId);
      }

      if (jobId) {
        query = query.eq("job_id", jobId);
      }

      if (businessUnitId) {
        query = query.eq("business_unit_id", businessUnitId);
      }

      if (costCenterId) {
        query = query.eq("cost_center_id", costCenterId);
      }

      if (profitCenterId) {
        query = query.eq("profit_center_id", profitCenterId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (employeeStatusId) {
        query = query.eq("employee_status_id", employeeStatusId);
      }

      if (employmentTypeId) {
        query = query.eq("employment_type_id", employmentTypeId);
      }

      if (genderId) {
        query = query.eq("gender_id", genderId);
      }

      if (nationalityId) {
        query = query.eq("nationality_id", nationalityId);
      }

      if (countryId) {
        query = query.eq("country_id", countryId);
      }

      if (payrollCompanyId) {
        query = query.eq("payroll_company_id", payrollCompanyId);
      }

      if (payrollTypeId) {
        query = query.eq("payroll_type_id", payrollTypeId);
      }

      if (payrollGroupId) {
        query = query.eq("payroll_group_id", payrollGroupId);
      }

      if (positionLevelBandId) {
        query = query.eq(
          "position_level_band_id",
          positionLevelBandId
        );
      }

      if (hasUserAccount === "true") {
        query = query.not("user_accounts", "is", null);
      }

      if (
        hasUserAccount === "false" &&
        employeeIdsWithAccount.length > 0
      ) {
        query = query.not(
          "id",
          "in",
          `(${employeeIdsWithAccount.join(",")})`
        );
      }

      return query;
    };

    /* =====================================================
       1. LOAD SELF

       สำคัญ:
       - ไม่ apply Scope กับ Query นี้
       - แต่ Permission ผ่าน guard แล้ว
       - Filter/Search ยังบังคับตามปกติ
    ===================================================== */

    let selfEmployee = null;

    if (currentEmployeeId) {
      let selfQuery = supabaseAdmin
        .from("employees")
        .select(EMPLOYEE_DETAIL_SELECT)
        .eq("id", currentEmployeeId);

      selfQuery = applyListFilters(selfQuery);

      const {
        data: selfData,
        error: selfError,
      } = await selfQuery.maybeSingle();

      if (selfError) {
        console.error(
          "GET /api/admin/employees self query error:",
          selfError
        );
      } else {
        selfEmployee = selfData || null;
      }
    }

    const includeSelf = Boolean(selfEmployee);

    /* =====================================================
       2. SCOPED EMPLOYEES

       ตัวเองถูก exclude จาก Scoped Query เสมอ
       เพื่อไม่ให้ซ้ำ และทำ Pagination ได้ถูกต้อง
    ===================================================== */

    let query = supabaseAdmin
      .from("employees")
      .select(
        EMPLOYEE_DETAIL_SELECT,
        {
          count: all ? undefined : "exact",
        }
      );

    query = guard.applyEmployeeScope(query);

    if (currentEmployeeId) {
      query = query.neq("id", currentEmployeeId);
    }

    query = applyListFilters(query);

    query = query
      .order(sortField, {
        ascending: sortDirection === "asc",
        nullsFirst: false,
      })
      .order("employee_code", {
        ascending: true,
      });

    /* =====================================================
       3. PAGINATION

       ถ้า Self ผ่าน Search/Filter:
       - Self เป็น Row แรกของหน้า 1
       - Scoped rows เลื่อน Offset ไป 1
       - หน้า 2/3/... ไม่ข้ามหรือซ้ำ
    ===================================================== */

    let discardFetchedRows = false;

    if (all) {
      const scopedLimit = Math.max(
        ALL_LIMIT - (includeSelf ? 1 : 0),
        0
      );

      query = query.limit(scopedLimit);
    } else {
      const globalFrom =
        (page - 1) * pageSize;

      const rowsForThisPage =
        includeSelf && page === 1
          ? Math.max(pageSize - 1, 0)
          : pageSize;

      const scopedFrom = includeSelf
        ? Math.max(globalFrom - 1, 0)
        : globalFrom;

      if (rowsForThisPage === 0) {
        /*
         * ยังต้อง execute เพื่อให้ count ถูกต้อง
         * แต่จะ discard data row ที่ fetch มา
         */
        discardFetchedRows = true;
        query = query.range(
          scopedFrom,
          scopedFrom
        );
      } else {
        const scopedTo =
          scopedFrom +
          rowsForThisPage -
          1;

        query = query.range(
          scopedFrom,
          scopedTo
        );
      }
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      console.error(
        "GET /api/admin/employees error:",
        error
      );

      return errorResponse(
        "ไม่สามารถโหลดข้อมูลพนักงานได้",
        {
          status: getErrorStatus(error),
          error: mapEmployeeDatabaseError(error),
          details: getDatabaseErrorDetails(error),
        }
      );
    }

    let scopedRows = Array.isArray(data)
      ? data
      : [];

    if (discardFetchedRows) {
      scopedRows = [];
    }

    const rows =
      includeSelf && (all || page === 1)
        ? [selfEmployee, ...scopedRows]
        : scopedRows;

    /* -----------------------------------------------------
       ALL RESPONSE
    ----------------------------------------------------- */

    if (all) {
      return successResponse(
        rows,
        {
          meta: {
            total: rows.length,
            limit: ALL_LIMIT,
            all: true,
            selfIncluded: includeSelf,
            currentEmployeeId,
          },
        }
      );
    }

    /* -----------------------------------------------------
       PAGINATION RESPONSE
    ----------------------------------------------------- */

    const scopedTotal = Number(count || 0);

    const total =
      scopedTotal +
      (includeSelf ? 1 : 0);

    const totalPages = Math.max(
      Math.ceil(total / pageSize),
      1
    );

    /* -----------------------------------------------------
       SUMMARY = SELF + SCOPE
    ----------------------------------------------------- */

    let summary = null;

    if (includeSummary) {
      summary = await getEmployeeSummary({
        guard,
        currentEmployeeId,
        companyId,
        branchGroupId,
        branchId,
        departmentId,
        divisionId,
        unitId,
        positionFamilyId,
        positionLevelId,
        positionId,
        jobId,
        employeeStatusId,
        employmentTypeId,
        status,
      });
    }

    return successResponse(
      rows,
      {
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },

        meta: {
          sortField,
          sortDirection,
          search: search || null,

          access: {
            currentEmployeeId,
            selfIncluded: includeSelf,
            rule: "SELF_PLUS_SCOPE",
          },

          filters: {
            companyId,
            branchGroupId,
            branchId,
            departmentId,
            divisionId,
            unitId,
            positionFamilyId,
            positionLevelId,
            positionId,
            jobId,
            businessUnitId,
            costCenterId,
            profitCenterId,
            employeeStatusId,
            employmentTypeId,
            genderId,
            nationalityId,
            countryId,
            payrollCompanyId,
            payrollTypeId,
            payrollGroupId,
            positionLevelBandId,
            status,
            hasUserAccount,
          },

          summary,
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/employees exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน",
      {
        status: 500,
        error: error?.message || "Unknown error",
        details: getDatabaseErrorDetails(error),
      }
    );
  }
}

export async function POST(req) {
  try {
    /* -----------------------------------------------------
       READ BODY
    ----------------------------------------------------- */

    let body = null;

<<<<<<< HEAD
    const citizen_id = body?.citizen_id?.replace(/\D/g, "")?.trim() || null;
    const passport_no = body?.passport_no?.trim() || null;
    const birth_date = body?.birth_date || null;
    const line_id = body?.line_id?.trim() || null;

    const employee_photo_url = body?.employee_photo_url?.trim() || null;
    const nationality = body?.nationality || null;
    const hire_date = body?.hire_date || null;
    const employment_type = body?.employment_type || null;
    const employee_status_id = body?.employee_status_id || null;
    const resignation_date = body?.resignation_date || null;
    const status = body?.status || "active";

    const company_id = body?.company_id || null;
    const branch_group_id = body?.branch_group_id || null;
    const branch_id = body?.branch_id || null;
    const department_id = body?.department_id || null;
    const division_id = body?.division_id || null;
    const unit_id = body?.unit_id || null;
    const position_id = body?.position_id || null;
    const job_id = body?.job_id || null;
    const management_assignment_id = body?.management_assignment_id || null;
    const business_unit_id = body?.business_unit_id || null;
    const cost_center_id = body?.cost_center_id || null;
    const profit_center_id = body?.profit_center_id || null;
    const payroll_company_id = body?.payroll_company_id || null;
    const payroll_type_id = body?.payroll_type_id || null;

    let probation_days = null;
    let probation_end_date = null;
    let probation_status = null;
    let selectedJob = null;


    if (!first_name_th || !last_name_th) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อและนามสกุล" },
        { status: 400 }
      );
    }

    if (!hire_date) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกวันที่เริ่มงาน" },
        { status: 400 }
      );
    }

    if (!position_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกตำแหน่ง" },
        { status: 400 }
      );
    }

    if (!nationality) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสัญชาติ" },
        { status: 400 }
      );
    }

    if (!employee_status_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสถานะพนักงาน" },
        { status: 400 }
      );
    }

    if (citizen_id && citizen_id.length !== 13) {
      return NextResponse.json(
        { success: false, error: "เลขบัตรประชาชนต้องมี 13 หลัก" },
        { status: 400 }
      );
    }

    if (!payroll_company_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Payroll Company",
        },
        { status: 400 }
      );
    }

    if (!payroll_type_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกประเภท Payroll",
        },
        { status: 400 }
      );
    }

    const { data: selectedPayrollCompany, error: payrollCompanyError, } = await supabaseAdmin
      .from("payroll_companies")
      .select(`
        id,
        payroll_type_id,
        status,
        companies (
          id,
          company_code,
          company_name_th,
          tax_id
        )
      `)
      .eq("id", payroll_company_id)
      .maybeSingle();

    if (payrollCompanyError) {
      throw payrollCompanyError;
    }

    if (!selectedPayrollCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Payroll Company ที่เลือก",
        },
        { status: 400 }
      );
    }

    if (selectedPayrollCompany.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Payroll Company ที่เลือกถูกปิดใช้งาน",
        },
        { status: 400 }
      );
    }


    const {data: selectedPayrollType,error: payrollTypeError,} = await supabaseAdmin
      .from("payroll_types")
      .select(`
        id,
        payroll_type_code,
        payroll_type_name,
        payment_frequency,
        default_payment_day,
        status
      `)
      .eq("id", payroll_type_id)
      .maybeSingle();

    if (payrollTypeError) {
      throw payrollTypeError;
    }

    if (!selectedPayrollType) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบประเภท Payroll ที่เลือก",
        },
        { status: 400 }
      );
    }

    if (selectedPayrollType.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "ประเภท Payroll ที่เลือกถูกปิดใช้งาน",
        },
        { status: 400 }
      );
    }

    if (employment_type) {
      const { data: employmentTypeData, error: employmentTypeError } =
        await supabaseAdmin
          .from("employment_types")
          .select(`
            type_code,
            probation_required,
            probation_days,
            auto_confirm_after_probation
          `)
          .eq("type_code", employment_type)
          .maybeSingle();

      if (employmentTypeError) throw employmentTypeError;

      if (employmentTypeData?.probation_required) {
        probation_days = Number(employmentTypeData.probation_days || 0);
        probation_end_date = calculateProbationEndDate(hire_date, probation_days);
        probation_status = "probation";
      } else {
        probation_days = null;
        probation_end_date = null;
        probation_status = "passed";
      }
    }

    const { data: selectedPosition, error: positionError } =
      await supabaseAdmin
        .from("positions")
        .select("id, position_level")
        .eq("id", position_id)
        .single();
=======
    try {
      body = await req.json();
    } catch (error) {
      return errorResponse(
        "รูปแบบ Request Body ไม่ถูกต้อง",
        {
          status: 400,

          error:
            error?.message ||
            null,
        }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Request Body ต้องเป็น Object",
        {
          status: 400,
        }
      );
    }
>>>>>>> test_merge_all

    /* -----------------------------------------------------
       NORMALIZE WIZARD PAYLOAD
    ----------------------------------------------------- */

<<<<<<< HEAD
    if (job_id) {
      const { data: jobData, error: jobError } = await supabaseAdmin
        .from("jobs")
        .select(`
          id,
          job_code,
          job_name,
          job_level,
          management_level,
          scope_type,
          business_unit_required,
          cost_center_required,
          profit_center_required,
          gl_mapping_required
        `)
        .eq("id", job_id)
        .maybeSingle();

      if (jobError) throw jobError;

      selectedJob = jobData;

      const jobScopeType = selectedJob?.scope_type || "";

      if (jobScopeType === "company" && !company_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "กรุณาเลือกบริษัทสำหรับ Job นี้",
          },
          { status: 400 }
        );
      }

      if (jobScopeType === "branch_group" && !branch_group_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "กรุณาเลือกกรุ๊ปสังกัดสำหรับ Job นี้",
          },
          { status: 400 }
        );
      }

      if (jobScopeType === "branch" && !branch_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "กรุณาเลือกสาขาสำหรับ Job นี้",
          },
          { status: 400 }
        );
      }

      if (jobScopeType === "department" && !department_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "กรุณาเลือกแผนกสำหรับ Job นี้",
          },
          { status: 400 }
        );
      }

      if (jobScopeType === "division" && !division_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "กรุณาเลือกฝ่ายสำหรับ Job นี้",
          },
          { status: 400 }
        );
      }

      if ( jobScopeType === "unit" && !unit_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "กรุณาเลือกหน่วยงานสำหรับ Job นี้",
          },
          { status: 400 }
        );
      }

      if (selectedJob?.business_unit_required && !business_unit_id) {
        return NextResponse.json(
          { success: false, error: "กรุณาเลือก Business Unit" },
          { status: 400 }
        );
      }

      if (selectedJob?.cost_center_required && !cost_center_id) {
        return NextResponse.json(
          { success: false, error: "กรุณาเลือก Cost Center" },
          { status: 400 }
        );
      }

      if (selectedJob?.profit_center_required && !profit_center_id) {
        return NextResponse.json(
          { success: false, error: "กรุณาเลือก Profit Center" },
          { status: 400 }
        );
      }
    }

    const employee_type_digit = getEmployeeTypeDigit({
      nationality,
      employmentType: employment_type,
      positionLevel: selectedPosition?.position_level,
    });
=======
    const employee =
      normalizeEmployeePayload(
        body
      );
>>>>>>> test_merge_all

    const guard = await requireScopedAccess("ems.employees","create");
    if (!guard.ok) {
      return guard.response;
    }


    /* -----------------------------------------------------
   RESOLVE EMPLOYMENT TYPE DEFAULTS

   employment_types
     → default_employee_status_id
     → employee_statuses
----------------------------------------------------- */

<<<<<<< HEAD
    const payload = {
      employee_code,
      first_name_th,
      last_name_th,
      first_name_en,
      last_name_en,
      nick_name,
      gender,
      phone,
      email,
      citizen_id,
      passport_no,
      birth_date,
      line_id,
      employee_photo_url,
      nationality,
      hire_date,
      employment_type,
      employee_status_id,
      resignation_date,
      status,
      company_id,
      branch_group_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      job_id,
      management_assignment_id,
      business_unit_id,
      cost_center_id,
      profit_center_id,
      payroll_company_id,
      payroll_type_id,
      employee_type_digit,
      employee_year_2d,
      employee_running_no,
      probation_days,
      probation_end_date,
      probation_status,
    };

    const { data, error } = await supabaseAdmin
      .from("employees")
      .insert([payload])
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        nick_name,
        gender,
        phone,
        email,
        citizen_id,
        passport_no,
        birth_date,
        line_id,
        employee_photo_url,
        nationality,
        hire_date,
        employment_type,
        status,
        employee_status_id,
        resignation_date,
        probation_days,
        probation_end_date,
        probation_status,
        company_id,
        branch_group_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        job_id,
        management_assignment_id,
        business_unit_id,
        cost_center_id,
        profit_center_id,
        payroll_company_id,
        payroll_type_id,
        created_at,
        updated_at,

        employee_statuses (
          status_name,
          color
        ),

        companies (
          id,
          company_code,
          company_name_th,
          company_name_en,
          tax_id
        ),

        branch_groups (
          group_code,
          group_name,
          group_color
        ),

        branches (
          branch_code,
          branch_name
        ),

        departments (
          department_code,
          department_name
        ),

        divisions (
          division_code,
          division_name
        ),

        units (
          unit_code,
          unit_name
        ),

        positions (
          position_code,
          position_name,
          position_level
        ),

        business_units (
          business_unit_code,
          business_unit_name
        ),

        cost_centers (
          cost_center_code,
          cost_center_name
        ),

        profit_centers (
          profit_center_code,
          profit_center_name
        ),
        payroll_companies (
          id,
          payroll_company_code,
          payroll_company_name,
          payroll_type_id,
          payment_day,
          status,

          companies (
            id,
            company_code,
            company_name_th,
            company_name_en,
            tax_id
          )
        ),
        payroll_types (
          id,
          payroll_type_code,
          payroll_type_name,
          payment_frequency,
          default_payment_day,
          status
        ),
        jobs (
          job_code,
          job_name,
          job_level,
          management_level,
          scope_type,
          job_color,
          job_icon,
          can_manage_employees,
          can_approve_budget
        )
      `)
      .single();

    if (error) throw error;

    const mappedEmployee = mapEmployee(data);

    await writeActivityLog({
      module_name: "employees",
      action_type: "create",
      reference_table: "employees",
      reference_id: data.id,
      description: `เพิ่มพนักงาน ${data.first_name_th} ${data.last_name_th} (${data.employee_code})`,
      new_data: mappedEmployee,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลพนักงานสำเร็จ",
      data: mappedEmployee,
    });
  } catch (error) {
    console.error("CREATE_EMPLOYEE_ERROR:", error);

    return NextResponse.json(
=======
if (
  employee.employment_type_id
) {
  if (
    !isUuid(
      employee.employment_type_id
    )
  ) {
    return errorResponse(
      "ประเภทการจ้างไม่ถูกต้อง",
>>>>>>> test_merge_all
      {
        status: 400,
      }
    );
  }

  const {
    data: employmentType,
    error: employmentTypeError,
  } = await supabaseAdmin
    .from("employment_types")
    .select(`
      id,
      type_code,
      type_name,
      status,
      probation_required,
      probation_days,
      auto_confirm_after_probation,
      default_employee_status_id
    `)
    .eq(
      "id",
      employee.employment_type_id
    )
    .maybeSingle();

  if (employmentTypeError) {
    return errorResponse(
      "ไม่สามารถตรวจสอบประเภทการจ้างได้",
      {
        status:
          getErrorStatus(
            employmentTypeError
          ),

        error:
          employmentTypeError.message,

        details:
          getDatabaseErrorDetails(
            employmentTypeError
          ),
      }
    );
  }

  if (!employmentType) {
    return errorResponse(
      "ไม่พบประเภทการจ้างที่เลือก",
      {
        status: 404,
      }
    );
  }

  if (
    employmentType.status !==
    "active"
  ) {
    return errorResponse(
      "ประเภทการจ้างที่เลือกไม่ได้เปิดใช้งาน",
      {
        status: 400,
      }
    );
  }

  /* =====================================================
     Default Employee Status

     เป็น DEFAULT
     ถ้า Frontend ยังไม่ได้ส่ง employee_status_id
     ให้ใช้ค่าจาก employment_types
  ===================================================== */

  if (
    !employee.employee_status_id &&
    employmentType
      .default_employee_status_id
  ) {
    employee.employee_status_id =
      employmentType
        .default_employee_status_id;
  }

  /* =====================================================
     Default Probation Days
  ===================================================== */

  if (
    employmentType
      .probation_required
  ) {
    employee.probation_days =
      Number(
        employmentType
          .probation_days || 0
      );
  }
}

    const account =
      normalizeAccountPayload(
        body
      );

    const codeRequest =
      normalizeEmployeeCodeRequest(
        body
      );

    /* -----------------------------------------------------
       VALIDATE CREATE PAYLOAD
    ----------------------------------------------------- */

    const validationError =
      validateEmployeeCreatePayload({
        employee,
        account,
        codeRequest,
      });

    if (validationError) {
      return errorResponse(
        validationError,
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       CURRENT USER SCOPE

       ใช้ Scope ของรหัสพนักงานที่ Login อยู่เท่านั้น
       หลาย ID ในระดับเดียวกัน = OR
       คนละระดับที่มี Scope = AND
    ----------------------------------------------------- */

    if (!guard.canAccessEmployee(employee)) {
      return errorResponse(
        "คุณไม่มีสิทธิ์เพิ่มพนักงานใน Scope องค์กรที่เลือก",
        {
          status: 403,
        }
      );
    }

    /* -----------------------------------------------------
       VALIDATE POSITION ARCHITECTURE

       Flow:
       Position Family
       → Position Family Level
       → Position Level
       → Position
       → Job
    ----------------------------------------------------- */

    const architectureResult =
      await validatePositionArchitecture({
        positionFamilyId:
          employee.position_family_id,

        positionLevelId:
          employee.position_level_id,

        positionId:
          employee.position_id,

        jobId:
          employee.job_id,
      });

    if (
      !architectureResult.success
    ) {
      return errorResponse(
        architectureResult.message ||
          "โครงสร้างตำแหน่งไม่ถูกต้อง",
        {
          status:
            architectureResult.status ||
            400,

          error:
            architectureResult.error
              ?.message ||
            architectureResult.error ||
            null,

          details:
            getDatabaseErrorDetails(
              architectureResult.error
            ),
        }
      );
    }

    /*
      ถ้า Frontend ไม่ส่ง job_id
      แต่ Position มี job_id
      ให้ใช้ค่าจาก Position อัตโนมัติ
    */

    if (
      !employee.job_id &&
      architectureResult.data
        ?.resolvedJobId
    ) {
      employee.job_id =
        architectureResult.data
          .resolvedJobId;
    }

    /* -----------------------------------------------------
       VALIDATE ACCOUNT OPTION

       create_user_account = false
       ไม่บังคับ role_id / auth_email
    ----------------------------------------------------- */

    if (
      account.create_user_account &&
      !account.role_id
    ) {
      return errorResponse(
        "กรุณาเลือกบทบาทผู้ใช้งาน",
        {
          status: 400,
        }
      );
    }

    if (
      account.create_user_account &&
      !account.auth_email
    ) {
      return errorResponse(
        "กรุณาระบุอีเมลสำหรับสร้างบัญชีผู้ใช้งาน",
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       VALIDATE ROLE

       Role 1 รายการ
       เชื่อมหลาย Permission ผ่าน role_permissions
    ----------------------------------------------------- */

    if (
      account.create_user_account &&
      account.role_id
    ) {
      const {
        data: role,
        error: roleError,
      } = await supabaseAdmin
        .from("roles")
        .select(
          `
            id,
            role_code,
            role_name,
            is_active,
            is_system
          `
        )
        .eq(
          "id",
          account.role_id
        )
        .maybeSingle();

      if (roleError) {
        return errorResponse(
          "ไม่สามารถตรวจสอบบทบาทผู้ใช้งานได้",
          {
            status:
              getErrorStatus(
                roleError
              ),

            error:
              mapEmployeeDatabaseError(
                roleError
              ),

            details:
              getDatabaseErrorDetails(
                roleError
              ),
          }
        );
      }

      if (!role) {
        return errorResponse(
          "ไม่พบบทบาทผู้ใช้งานที่เลือก",
          {
            status: 404,
          }
        );
      }

      if (
        role.is_active ===
        false
      ) {
        return errorResponse(
          "บทบาทผู้ใช้งานที่เลือกไม่ได้เปิดใช้งาน",
          {
            status: 400,
          }
        );
      }
    }

    /* -----------------------------------------------------
       VALIDATE EMPLOYEE CODE SETTING
    ----------------------------------------------------- */

    if (
      !codeRequest
        .employee_code_setting_id
    ) {
      return errorResponse(
        "กรุณาเลือกรูปแบบรหัสพนักงาน",
        {
          status: 400,
        }
      );
    }

    if (
      !codeRequest.employee_type
    ) {
      return errorResponse(
        "กรุณาเลือกประเภทสำหรับสร้างรหัสพนักงาน",
        {
          status: 400,
        }
      );
    }

    if (
      !codeRequest.running_date
    ) {
      return errorResponse(
        "กรุณาระบุวันที่ Running",
        {
          status: 400,
        }
      );
    }

    const {
      data: codeSetting,
      error: codeSettingError,
    } = await supabaseAdmin
      .from(
        "employee_code_settings"
      )
      .select(
        `
          id,
          company_id,
          code_name,
          code_pattern,
          running_digits,
          year_digits,
          executive_digit,
          thai_digit,
          non_b_digit,
          myanmar_digit,
          parttime_digit,
          running_start,
          reset_policy,
          is_default,
          effective_date,
          expire_date,
          status
        `
      )
      .eq(
        "id",
        codeRequest
          .employee_code_setting_id
      )
      .maybeSingle();

    if (codeSettingError) {
      return errorResponse(
        "ไม่สามารถตรวจสอบรูปแบบรหัสพนักงานได้",
        {
          status:
            getErrorStatus(
              codeSettingError
            ),

          error:
            mapEmployeeDatabaseError(
              codeSettingError
            ),

          details:
            getDatabaseErrorDetails(
              codeSettingError
            ),
        }
      );
    }

    if (!codeSetting) {
      return errorResponse(
        "ไม่พบรูปแบบรหัสพนักงานที่เลือก",
        {
          status: 404,
        }
      );
    }

    if (
      codeSetting.status !==
      "active"
    ) {
      return errorResponse(
        "รูปแบบรหัสพนักงานที่เลือกไม่ได้เปิดใช้งาน",
        {
          status: 400,
        }
      );
    }

    if (
      codeSetting.company_id !==
      employee.company_id
    ) {
      return errorResponse(
        "รูปแบบรหัสพนักงานไม่ได้อยู่ในบริษัทที่เลือก",
        {
          status: 400,
        }
      );
    }

    const runningDate =
      new Date(
        codeRequest.running_date
      );

    if (
      Number.isNaN(
        runningDate.getTime()
      )
    ) {
      return errorResponse(
        "วันที่ Running ไม่ถูกต้อง",
        {
          status: 400,
        }
      );
    }

    const effectiveDate =
      codeSetting.effective_date
        ? new Date(
            codeSetting
              .effective_date
          )
        : null;

    const expireDate =
      codeSetting.expire_date
        ? new Date(
            codeSetting
              .expire_date
          )
        : null;

    if (
      effectiveDate &&
      !Number.isNaN(
        effectiveDate.getTime()
      ) &&
      runningDate <
        effectiveDate
    ) {
      return errorResponse(
        "วันที่ Running อยู่ก่อนวันที่เริ่มใช้งานรูปแบบรหัสพนักงาน",
        {
          status: 400,
        }
      );
    }

    if (
      expireDate &&
      !Number.isNaN(
        expireDate.getTime()
      ) &&
      runningDate >
        expireDate
    ) {
      return errorResponse(
        "รูปแบบรหัสพนักงานหมดอายุแล้ว",
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       DUPLICATE CHECKS

       employee_code ยังตรวจไม่ได้ตรงนี้
       เพราะต้อง Reserve Running ก่อน
    ----------------------------------------------------- */

    const duplicateResult =
      await checkEmployeeDuplicates(
        employee
      );

    if (
      !duplicateResult.success
    ) {
      return errorResponse(
        duplicateResult.message,
        {
          status:
            duplicateResult.status ||
            409,

          error:
            duplicateResult.error
              ?.message ||
            null,

          details:
            duplicateResult.duplicate ||
            getDatabaseErrorDetails(
              duplicateResult.error
            ),
        }
      );
    }

    /* -----------------------------------------------------
       CREATE EMPLOYEE TRANSACTION

       Flow:
       1. Validate organization
       2. Validate payroll
       3. Validate role
       4. Reserve employee running number
       5. Generate employee code
       6. bcrypt hash employee code
       7. Create Supabase Auth user
       8. Insert employees
       9. Insert user_accounts
       10. Write activity log
    ----------------------------------------------------- */

    const result =
      await createEmployeeTransaction({
        employee,

        account,

        codeRequest,
      });

    if (!result.success) {
      const status =
        Number(
          result.status
        ) || 500;

      return errorResponse(
        result.message ||
          "ไม่สามารถเพิ่มพนักงานได้",
        {
          status,

          error:
            result.error?.message ||
            result.error ||
            null,

          details:
            getDatabaseErrorDetails(
              result.error
            ),
        }
      );
    }

    /* -----------------------------------------------------
       SUCCESS RESPONSE
    ----------------------------------------------------- */

    return successResponse(
      result.data,
      {
        status: 201,

        message:
          result.message ||
          "เพิ่มพนักงานเรียบร้อยแล้ว",

        meta: {
          accountCreated:
            Boolean(
              account
                .create_user_account
            ),

          roleId:
            account.role_id ||
            null,

          positionArchitecture: {
            positionFamilyId:
              employee
                .position_family_id ||
              null,

            positionLevelId:
              employee
                .position_level_id ||
              null,

            positionId:
              employee.position_id ||
              null,

            jobId:
              employee.job_id ||
              null,
          },

          employeeCodeSettingId:
            codeRequest
              .employee_code_setting_id ||
            null,

          /*
            Permission ไม่ได้บันทึกตรง user_accounts

            user_accounts.role_id
              → roles.id
              → role_permissions.role_id
              → permissions.id
          */

          permissionModel:
            "role_permissions",
        },
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/employees exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการเพิ่มพนักงาน",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",

        details:
          getDatabaseErrorDetails(
            error
          ),
      }
    );
  }
}
