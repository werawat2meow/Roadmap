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

/* =========================================================
   CONSTANTS
========================================================= */

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

/* =========================================================
   RESPONSE HELPERS
========================================================= */

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

/* =========================================================
   BASIC HELPERS
========================================================= */

function cleanNullableText(
  value
) {
  const cleaned =
    cleanText(value);

  return cleaned || null;
}

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
    code:
      error.code || null,

    message:
      error.message || null,

    details:
      error.details || null,

    hint:
      error.hint || null,
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
} = {}) {
  try {
    let query = supabaseAdmin
      .from("employees")
      .select(
        `
          id,
          status,
          start_work_date,
          resignation_date,
          probation_status
        `
      );

    if (companyId) {
      query = query.eq(
        "company_id",
        companyId
      );
    }

    if (branchGroupId) {
      query = query.eq(
        "branch_group_id",
        branchGroupId
      );
    }

    if (branchId) {
      query = query.eq(
        "branch_id",
        branchId
      );
    }

    if (departmentId) {
      query = query.eq(
        "department_id",
        departmentId
      );
    }

    if (divisionId) {
      query = query.eq(
        "division_id",
        divisionId
      );
    }

    if (unitId) {
      query = query.eq(
        "unit_id",
        unitId
      );
    }

    if (positionFamilyId) {
      query = query.eq(
        "position_family_id",
        positionFamilyId
      );
    }

    if (positionLevelId) {
      query = query.eq(
        "position_level_id",
        positionLevelId
      );
    }

    if (positionId) {
      query = query.eq(
        "position_id",
        positionId
      );
    }

    if (jobId) {
      query = query.eq(
        "job_id",
        jobId
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "getEmployeeSummary error:",
        error
      );

      return null;
    }

    const rows =
      Array.isArray(data)
        ? data
        : [];

    const now = new Date();

    const currentYear =
      now.getFullYear();

    const currentMonth =
      now.getMonth();

    const summary = {
      total: rows.length,

      active: 0,

      inactive: 0,

      resigned: 0,

      probation: 0,

      newThisMonth: 0,

      newThisYear: 0,

      resignedThisMonth: 0,

      resignedThisYear: 0,
    };

    for (const employee of rows) {
      if (
        employee.status ===
        "active"
      ) {
        summary.active += 1;
      }

      if (
        employee.status ===
        "inactive"
      ) {
        summary.inactive += 1;
      }

      if (
        employee.status ===
        "resigned"
      ) {
        summary.resigned += 1;
      }

      if (
        employee.probation_status ===
        "probation"
      ) {
        summary.probation += 1;
      }

      if (
        employee.start_work_date
      ) {
        const startDate =
          new Date(
            employee.start_work_date
          );

        if (
          !Number.isNaN(
            startDate.getTime()
          )
        ) {
          if (
            startDate.getFullYear() ===
            currentYear
          ) {
            summary.newThisYear += 1;

            if (
              startDate.getMonth() ===
              currentMonth
            ) {
              summary.newThisMonth += 1;
            }
          }
        }
      }

      if (
        employee.resignation_date
      ) {
        const resignationDate =
          new Date(
            employee.resignation_date
          );

        if (
          !Number.isNaN(
            resignationDate.getTime()
          )
        ) {
          if (
            resignationDate.getFullYear() ===
            currentYear
          ) {
            summary.resignedThisYear += 1;

            if (
              resignationDate.getMonth() ===
              currentMonth
            ) {
              summary.resignedThisMonth += 1;
            }
          }
        }
      }
    }

    return summary;
  } catch (error) {
    console.error(
      "getEmployeeSummary exception:",
      error
    );

    return null;
  }
}

/* =========================================================
   DUPLICATE CHECK HELPERS
========================================================= */

async function findDuplicateEmployee({
  field,
  value,
}) {
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
          id,
          employee_code,
          first_name_th,
          last_name_th
        `
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

/* =========================================================
   DUPLICATE CHECKS
========================================================= */

async function checkEmployeeDuplicates(
  employee
) {
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

/* =========================================================
   POSITION ARCHITECTURE VALIDATION
========================================================= */

async function validatePositionArchitecture({
  positionFamilyId,

  positionLevelId,

  positionId,

  jobId = null,
}) {
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
/* =========================================================
   GET /api/admin/employees
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    /* -----------------------------------------------------
       GENERAL PARAMETERS
    ----------------------------------------------------- */

    const search =
      sanitizeSearch(
        searchParams.get("search")
      );

    const all =
      parseBoolean(
        searchParams.get("all"),
        false
      );

    const includeSummary =
      parseBoolean(
        searchParams.get(
          "include_summary"
        ),
        false
      );

    const page =
      parsePositiveInteger(
        searchParams.get("page"),
        DEFAULT_PAGE
      );

    const pageSize =
      parsePositiveInteger(
        searchParams.get(
          "pageSize"
        ),
        DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE
      );

    const sortField =
      normalizeSortField(
        searchParams.get(
          "sort_field"
        )
      );

    const sortDirection =
      normalizeSortDirection(
        searchParams.get(
          "sort_direction"
        )
      );

    /* -----------------------------------------------------
       ORGANIZATION FILTERS
    ----------------------------------------------------- */

    const companyId =
      getFilterValue(
        searchParams,
        "company_id"
      );

    const branchGroupId =
      getFilterValue(
        searchParams,
        "branch_group_id"
      );

    const branchId =
      getFilterValue(
        searchParams,
        "branch_id"
      );

    const departmentId =
      getFilterValue(
        searchParams,
        "department_id"
      );

    const divisionId =
      getFilterValue(
        searchParams,
        "division_id"
      );

    const unitId =
      getFilterValue(
        searchParams,
        "unit_id"
      );

    /* -----------------------------------------------------
       JOB ARCHITECTURE FILTERS
    ----------------------------------------------------- */

    const positionFamilyId =
      getFilterValue(
        searchParams,
        "position_family_id"
      );

    const positionLevelId =
      getFilterValue(
        searchParams,
        "position_level_id"
      );

    const positionId =
      getFilterValue(
        searchParams,
        "position_id"
      );

    const jobId =
      getFilterValue(
        searchParams,
        "job_id"
      );

    /* -----------------------------------------------------
       COST STRUCTURE FILTERS
    ----------------------------------------------------- */

    const businessUnitId =
      getFilterValue(
        searchParams,
        "business_unit_id"
      );

    const costCenterId =
      getFilterValue(
        searchParams,
        "cost_center_id"
      );

    const profitCenterId =
      getFilterValue(
        searchParams,
        "profit_center_id"
      );

    /* -----------------------------------------------------
       EMPLOYEE FILTERS
    ----------------------------------------------------- */

    const status =
      getFilterValue(
        searchParams,
        "status"
      );

    const employeeStatusId =
      getFilterValue(
        searchParams,
        "employee_status_id"
      );

    const employmentTypeId =
      getFilterValue(
        searchParams,
        "employment_type_id"
      );

    const genderId =
      getFilterValue(
        searchParams,
        "gender_id"
      );

    const nationalityId =
      getFilterValue(
        searchParams,
        "nationality_id"
      );

    const countryId =
      getFilterValue(
        searchParams,
        "country_id"
      );

    /* -----------------------------------------------------
       PAYROLL FILTERS
    ----------------------------------------------------- */

    const payrollCompanyId =
      getFilterValue(
        searchParams,
        "payroll_company_id"
      );

    const payrollTypeId =
      getFilterValue(
        searchParams,
        "payroll_type_id"
      );

    const payrollGroupId =
      getFilterValue(
        searchParams,
        "payroll_group_id"
      );

    const positionLevelBandId =
      getFilterValue(
        searchParams,
        "position_level_band_id"
      );

    /* -----------------------------------------------------
       ACCOUNT FILTERS
    ----------------------------------------------------- */

    const hasUserAccount =
      getFilterValue(
        searchParams,
        "has_user_account"
      );

    /* -----------------------------------------------------
       VALIDATE FILTERS
    ----------------------------------------------------- */

    const filterValidationError =
      validateEmployeeFilters({
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
        {
          status: 400,
        }
      );
    }

    const statusValidationError =
      validateEmployeeStatusFilter(
        status
      );

    if (statusValidationError) {
      return errorResponse(
        statusValidationError,
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       BUILD QUERY
    ----------------------------------------------------- */

    let query = supabaseAdmin
      .from("employees")
      .select(
        EMPLOYEE_DETAIL_SELECT,
        {
          count: all
            ? undefined
            : "exact",
        }
      );

    /* -----------------------------------------------------
       SEARCH
    ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       ORGANIZATION FILTERS
    ----------------------------------------------------- */

    if (companyId) {
      query = query.eq(
        "company_id",
        companyId
      );
    }

    if (branchGroupId) {
      query = query.eq(
        "branch_group_id",
        branchGroupId
      );
    }

    if (branchId) {
      query = query.eq(
        "branch_id",
        branchId
      );
    }

    if (departmentId) {
      query = query.eq(
        "department_id",
        departmentId
      );
    }

    if (divisionId) {
      query = query.eq(
        "division_id",
        divisionId
      );
    }

    if (unitId) {
      query = query.eq(
        "unit_id",
        unitId
      );
    }

    /* -----------------------------------------------------
       JOB ARCHITECTURE FILTERS
    ----------------------------------------------------- */

    if (positionFamilyId) {
      query = query.eq(
        "position_family_id",
        positionFamilyId
      );
    }

    if (positionLevelId) {
      query = query.eq(
        "position_level_id",
        positionLevelId
      );
    }

    if (positionId) {
      query = query.eq(
        "position_id",
        positionId
      );
    }

    if (jobId) {
      query = query.eq(
        "job_id",
        jobId
      );
    }

    /* -----------------------------------------------------
       COST STRUCTURE FILTERS
    ----------------------------------------------------- */

    if (businessUnitId) {
      query = query.eq(
        "business_unit_id",
        businessUnitId
      );
    }

    if (costCenterId) {
      query = query.eq(
        "cost_center_id",
        costCenterId
      );
    }

    if (profitCenterId) {
      query = query.eq(
        "profit_center_id",
        profitCenterId
      );
    }

    /* -----------------------------------------------------
       EMPLOYEE FILTERS
    ----------------------------------------------------- */

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    if (employeeStatusId) {
      query = query.eq(
        "employee_status_id",
        employeeStatusId
      );
    }

    if (employmentTypeId) {
      query = query.eq(
        "employment_type_id",
        employmentTypeId
      );
    }

    if (genderId) {
      query = query.eq(
        "gender_id",
        genderId
      );
    }

    if (nationalityId) {
      query = query.eq(
        "nationality_id",
        nationalityId
      );
    }

    if (countryId) {
      query = query.eq(
        "country_id",
        countryId
      );
    }

    /* -----------------------------------------------------
       PAYROLL FILTERS
    ----------------------------------------------------- */

    if (payrollCompanyId) {
      query = query.eq(
        "payroll_company_id",
        payrollCompanyId
      );
    }

    if (payrollTypeId) {
      query = query.eq(
        "payroll_type_id",
        payrollTypeId
      );
    }

    if (payrollGroupId) {
      query = query.eq(
        "payroll_group_id",
        payrollGroupId
      );
    }

    if (positionLevelBandId) {
      query = query.eq(
        "position_level_band_id",
        positionLevelBandId
      );
    }

    /* -----------------------------------------------------
       USER ACCOUNT FILTER
    ----------------------------------------------------- */

    if (
      hasUserAccount === "true"
    ) {
      query = query.not(
        "user_accounts",
        "is",
        null
      );
    }

    if (
      hasUserAccount === "false"
    ) {
      /*
        PostgREST embedded relation filtering
        กรณีไม่มี user_accounts โดยตรงอาจไม่ทำงาน
        เหมือน scalar column

        จึงต้องดึง employee_id ที่มีบัญชีออกก่อน
      */

      const {
        data: accountRows,
        error: accountError,
      } = await supabaseAdmin
        .from("user_accounts")
        .select("employee_id")
        .not(
          "employee_id",
          "is",
          null
        );

      if (accountError) {
        console.error(
          "GET employee account filter error:",
          accountError
        );

        return errorResponse(
          "ไม่สามารถกรองพนักงานที่ไม่มีบัญชีผู้ใช้งานได้",
          {
            status:
              getErrorStatus(
                accountError
              ),

            error:
              mapEmployeeDatabaseError(
                accountError
              ),

            details:
              getDatabaseErrorDetails(
                accountError
              ),
          }
        );
      }

      const employeeIdsWithAccount =
        (accountRows || [])
          .map(
            (item) =>
              item.employee_id
          )
          .filter(Boolean);

      if (
        employeeIdsWithAccount.length >
        0
      ) {
        query = query.not(
          "id",
          "in",
          `(${employeeIdsWithAccount.join(
            ","
          )})`
        );
      }
    }

    /* -----------------------------------------------------
       SORTING
    ----------------------------------------------------- */

    query = query
      .order(
        sortField,
        {
          ascending:
            sortDirection ===
            "asc",

          nullsFirst: false,
        }
      )
      .order(
        "employee_code",
        {
          ascending: true,
        }
      );

    /* -----------------------------------------------------
       PAGINATION
    ----------------------------------------------------- */

    if (all) {
      query = query.limit(
        ALL_LIMIT
      );
    } else {
      const from =
        (page - 1) *
        pageSize;

      const to =
        from +
        pageSize -
        1;

      query = query.range(
        from,
        to
      );
    }

    /* -----------------------------------------------------
       EXECUTE QUERY
    ----------------------------------------------------- */

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
          status:
            getErrorStatus(error),

          error:
            mapEmployeeDatabaseError(
              error
            ),

          details:
            getDatabaseErrorDetails(
              error
            ),
        }
      );
    }

    const rows =
      Array.isArray(data)
        ? data
        : [];

    /* -----------------------------------------------------
       ALL RESPONSE
    ----------------------------------------------------- */

    if (all) {
      return successResponse(
        rows,
        {
          meta: {
            total:
              rows.length,

            limit:
              ALL_LIMIT,

            all: true,
          },
        }
      );
    }

    /* -----------------------------------------------------
       PAGINATION RESPONSE
    ----------------------------------------------------- */

    const total =
      Number(count || 0);

    const totalPages =
      Math.max(
        Math.ceil(
          total / pageSize
        ),
        1
      );

    /* -----------------------------------------------------
       SUMMARY
    ----------------------------------------------------- */

    let summary = null;

    if (includeSummary) {
      summary =
        await getEmployeeSummary({
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

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },

        meta: {
          sortField,

          sortDirection,

          search:
            search || null,

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
/* =========================================================
   POST /api/admin/employees
========================================================= */

export async function POST(req) {
  try {
    /* -----------------------------------------------------
       READ BODY
    ----------------------------------------------------- */

    let body = null;

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

    /* -----------------------------------------------------
       NORMALIZE WIZARD PAYLOAD
    ----------------------------------------------------- */

    const employee =
      normalizeEmployeePayload(
        body
      );

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
