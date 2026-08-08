/* =========================================================
   CONSTANTS
========================================================= */

export const ALLOWED_EMPLOYEE_STATUSES = [
  "active",
  "inactive",
  "resigned",
];

export const ALLOWED_CODE_EMPLOYEE_TYPES = [
  "executive",
  "thai",
  "non_b",
  "myanmar",
  "parttime",
];

/* =========================================================
   BASIC HELPERS
========================================================= */

export function cleanText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

export function cleanNullableText(value) {
  const cleaned = cleanText(value);

  return cleaned || null;
}

export function cleanNullableUuid(value) {
  return cleanNullableText(value);
}

export function cleanDate(value) {
  const cleaned = cleanText(value);

  return cleaned || null;
}

export function cleanInteger(
  value,
  fallback = null
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed)
    ? parsed
    : fallback;
}

export function cleanBoolean(
  value,
  fallback = false
) {
  if (typeof value === "boolean") {
    return value;
  }

  if (
    value === "true" ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  if (
    value === "false" ||
    value === 0 ||
    value === "0"
  ) {
    return false;
  }

  return fallback;
}

/* =========================================================
   NAME HELPERS
========================================================= */

export function getEmployeeFullNameTh(
  employee = {}
) {
  return [
    employee.first_name_th,
    employee.middle_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function getEmployeeFullNameEn(
  employee = {}
) {
  return [
    employee.first_name_en,
    employee.middle_name_en,
    employee.last_name_en,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

/* =========================================================
   NORMALIZE EMPLOYEE PAYLOAD
========================================================= */

export function normalizeEmployeePayload(
  body = {}
) {
  const status =
    ALLOWED_EMPLOYEE_STATUSES.includes(
      cleanText(body.status)
    )
      ? cleanText(body.status)
      : "active";

  return {
    /* -----------------------------------------------------
       Organization
    ----------------------------------------------------- */

    company_id:
      cleanNullableUuid(
        body.company_id
      ),

    branch_group_id:
      cleanNullableUuid(
        body.branch_group_id
      ),

    branch_id:
      cleanNullableUuid(
        body.branch_id
      ),

    department_id:
      cleanNullableUuid(
        body.department_id
      ),

    division_id:
      cleanNullableUuid(
        body.division_id
      ),

    unit_id:
      cleanNullableUuid(
        body.unit_id
      ),
    
    position_family_id:
      cleanNullableUuid(
        body.position_family_id
      ),

    position_level_id:
      cleanNullableUuid(
        body.position_level_id
      ),

    position_id:
      cleanNullableUuid(
        body.position_id
      ),

    job_id:
      cleanNullableUuid(
        body.job_id
      ),

    business_unit_id:
      cleanNullableUuid(
        body.business_unit_id
      ),

    cost_center_id:
      cleanNullableUuid(
        body.cost_center_id
      ),

    profit_center_id:
      cleanNullableUuid(
        body.profit_center_id
      ),

    current_assignment_id:
      cleanNullableUuid(
        body.current_assignment_id
      ),

    /* -----------------------------------------------------
       Personal
    ----------------------------------------------------- */

    title_id:
      cleanNullableUuid(
        body.title_id
      ),

    first_name_th:
      cleanText(
        body.first_name_th
      ),

    middle_name_th:
      cleanNullableText(
        body.middle_name_th
      ),

    last_name_th:
      cleanText(
        body.last_name_th
      ),

    first_name_en:
      cleanNullableText(
        body.first_name_en
      ),

    middle_name_en:
      cleanNullableText(
        body.middle_name_en
      ),

    last_name_en:
      cleanNullableText(
        body.last_name_en
      ),

    nickname_th:
      cleanNullableText(
        body.nickname_th
      ),

    nickname_en:
      cleanNullableText(
        body.nickname_en
      ),

    gender_id:
      cleanNullableUuid(
        body.gender_id
      ),

    marital_status_id:
      cleanNullableUuid(
        body.marital_status_id
      ),

    religion_id:
      cleanNullableUuid(
        body.religion_id
      ),

    nationality_id:
      cleanNullableUuid(
        body.nationality_id
      ),

    country_id:
      cleanNullableUuid(
        body.country_id
      ),

    birth_date:
      cleanDate(
        body.birth_date
      ),

    birth_place:
      cleanNullableText(
        body.birth_place
      ),
    
    birth_province_code:
      cleanNullableText(
        body.birth_province_code
      ),

    birth_district_code:
      cleanNullableText(
        body.birth_district_code
      ),

    birth_subdistrict_code:
      cleanNullableText(
        body.birth_subdistrict_code
      ),

    birth_postcode:
      cleanNullableText(
        body.birth_postcode
      ),

    blood_group:
      cleanNullableText(
        body.blood_group
      ),

    citizen_id:
      cleanNullableText(
        body.citizen_id
      ),

    passport_no:
      cleanNullableText(
        body.passport_no
      ),

    passport_expire_date:
      cleanDate(
        body.passport_expire_date
      ),

    tax_id:
      cleanNullableText(
        body.tax_id
      ),

    social_security_no:
      cleanNullableText(
        body.social_security_no
      ),

    /* -----------------------------------------------------
       Contact
    ----------------------------------------------------- */

    mobile_phone:
      cleanNullableText(
        body.mobile_phone
      ),

    home_phone:
      cleanNullableText(
        body.home_phone
      ),

    work_phone:
      cleanNullableText(
        body.work_phone
      ),

    personal_email:
      cleanNullableText(
        body.personal_email
      )?.toLowerCase() || null,

    work_email:
      cleanNullableText(
        body.work_email
      )?.toLowerCase() || null,

    line_id:
      cleanNullableText(
        body.line_id
      ),

    /* -----------------------------------------------------
       Employment
    ----------------------------------------------------- */

    employment_type_id:
      cleanNullableUuid(
        body.employment_type_id
      ),

    employee_status_id:
      cleanNullableUuid(
        body.employee_status_id
      ),

    start_work_date:
      cleanDate(
        body.start_work_date
      ),

    probation_days:
      cleanInteger(
        body.probation_days,
        null
      ),

    probation_end_date:
      cleanDate(
        body.probation_end_date
      ),

    probation_status:
      cleanNullableText(
        body.probation_status
      ) || "probation",

    confirmation_date:
      cleanDate(
        body.confirmation_date
      ),

    termination_date:
      cleanDate(
        body.termination_date
      ),

    resignation_date:
      cleanDate(
        body.resignation_date
      ),

    retirement_date:
      cleanDate(
        body.retirement_date
      ),

    /* -----------------------------------------------------
       Payroll
    ----------------------------------------------------- */

    payroll_company_id:
      cleanNullableUuid(
        body.payroll_company_id
      ),

    payroll_type_id:
      cleanNullableUuid(
        body.payroll_type_id
      ),

    payroll_group_id:
      cleanNullableUuid(
        body.payroll_group_id
      ),

    salary_structure_id:
      cleanNullableUuid(
        body.salary_structure_id
      ),

    /* -----------------------------------------------------
       Files
    ----------------------------------------------------- */

    employee_photo_path:
      cleanNullableText(
        body.employee_photo_path
      ),

    employee_photo_url:
      cleanNullableText(
        body.employee_photo_url
      ),

    signature_path:
      cleanNullableText(
        body.signature_path
      ),

    signature_url:
      cleanNullableText(
        body.signature_url
      ),

    /* -----------------------------------------------------
       System
    ----------------------------------------------------- */

    status,

    remark:
      cleanNullableText(
        body.remark
      ),

    created_by:
      cleanNullableUuid(
        body.created_by
      ),

    updated_by:
      cleanNullableUuid(
        body.updated_by
      ),
  };
}

/* =========================================================
   NORMALIZE ACCOUNT PAYLOAD
========================================================= */

export function normalizeAccountPayload(
  body = {}
) {
  const authEmail =
    cleanNullableText(
      body.auth_email
    ) ||
    cleanNullableText(
      body.work_email
    ) ||
    cleanNullableText(
      body.personal_email
    );

  return {
    create_user_account:
      body.create_user_account ===
      undefined
        ? true
        : cleanBoolean(
            body.create_user_account,
            true
          ),

    role_id:
      cleanNullableUuid(
        body.role_id
      ),

    auth_email:
      authEmail?.toLowerCase() ||
      null,

    is_active:
      body.account_is_active ===
      undefined
        ? true
        : cleanBoolean(
            body.account_is_active,
            true
          ),
  };
}

/* =========================================================
   NORMALIZE EMPLOYEE CODE REQUEST
========================================================= */

export function normalizeEmployeeCodeRequest(
  body = {}
) {
  const employeeType =
    cleanText(
      body.employee_type
    ).toLowerCase();

  return {
    employee_code_setting_id:
      cleanNullableUuid(
        body.employee_code_setting_id
      ),

    employee_type:
      employeeType,

    running_date:
      cleanDate(
        body.running_date
      ) ||
      cleanDate(
        body.start_work_date
      ) ||
      new Date()
        .toISOString()
        .slice(0, 10),
  };
}