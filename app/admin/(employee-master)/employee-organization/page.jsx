"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Button,
  Card,
  Form,
  Modal,
  Segmented,
  Space,
  Typography,
  message,
} from "antd";

import {
  ApartmentOutlined,
  BarsOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import LoadingOrb from "@/app/components/LoadingOrb";
import useScopedPermissions from "@/hooks/useScopedPermissions";

import EmployeeOrganizationSearch from "./components/EmployeeOrganizationSearch";
import EmployeeOrganizationSummaryCards from "./components/EmployeeOrganizationSummaryCards";
import EmployeeOrganizationTree from "./components/EmployeeOrganizationTree";
import EmployeeOrganizationTable from "./components/EmployeeOrganizationTable";

import EmployeeWizardModal from "@/app/admin/(employee-master)/employees/components/EmployeeWizardModal";
import {
  EMPLOYEE_STEP_FIELDS,
  EMPLOYEE_WIZARD_STEPS,
} from "@/app/admin/(employee-master)/employees/components/EmployeeWizardForm";

const { Title, Text } = Typography;

const DEFAULT_PAGE_SIZE = 20;

const LAST_WIZARD_STEP = EMPLOYEE_WIZARD_STEPS.length - 1;

const DEFAULT_FORM_VALUES = {
  /* -------------------------------------------------------
     Personal
  ------------------------------------------------------- */

  title_id: undefined,

  first_name_th: "",
  middle_name_th: "",
  last_name_th: "",

  first_name_en: "",
  middle_name_en: "",
  last_name_en: "",

  nickname_th: "",
  nickname_en: "",

  gender_id: undefined,
  marital_status_id: undefined,
  religion_id: undefined,
  nationality_id: undefined,
  country_id: undefined,


  birth_province_code: undefined,
  birth_district_code: undefined,
  birth_subdistrict_code: undefined,
  birth_postcode: "",

  birth_date: null,
  birth_place: "",
  blood_group: undefined,

  citizen_id: "",
  passport_no: "",
  passport_expire_date: null,

  employee_photo_path: null,
  employee_photo_url: null,

  position_family_id: undefined,
  position_level_id: undefined,
  position_id: undefined,
  job_id: undefined,

  /* -------------------------------------------------------
     Contact
  ------------------------------------------------------- */

  mobile_phone: "",
  home_phone: "",
  work_phone: "",

  personal_email: "",
  work_email: "",

  line_id: "",

  /* Statutory / Tax */
  tax_identity_type: "citizen_id",
  tax_identification_no: "",
  tax_filing_form_code: undefined,
  tax_resident_status: "resident",
  tax_withholding_company_id: undefined,
  statutory_effective_from: dayjs(),

  social_security_registered: false,
  social_security_no: "",
  insured_type: "section_33",
  social_security_company_id: undefined,

  /* Legacy compatibility */
  tax_id: "",

  /* -------------------------------------------------------
     Organization
  ------------------------------------------------------- */

  use_tax_company_for_organization: false,

  company_id: undefined,
  branch_group_id: undefined,
  branch_id: undefined,

  department_id: undefined,
  division_id: undefined,
  unit_id: undefined,

  position_id: undefined,
  job_id: undefined,

  business_unit_id: undefined,
  cost_center_id: undefined,
  profit_center_id: undefined,

  /* -------------------------------------------------------
     Employment
  ------------------------------------------------------- */

  employment_type_id: undefined,
  employee_status_id: undefined,

  start_work_date: dayjs(),

  probation_days: 119,
  probation_end_date: dayjs().add(
    119,
    "day"
  ),
  probation_status: "probation",

  confirmation_date: null,
  termination_date: null,
  resignation_date: null,
  retirement_date: null,

  status: "active",

  /* -------------------------------------------------------
     Payroll
  ------------------------------------------------------- */

  payroll_company_id: undefined,
  payroll_type_id: undefined,
  payroll_group_id: undefined,
  position_level_band_id: undefined,
  base_salary: undefined,

  payment_method_id: undefined,
  bank_id: undefined,
  bank_account_no: "",
  bank_account_name: "",
  bank_branch_name: "",

  /* -------------------------------------------------------
     Employee code
  ------------------------------------------------------- */

  employee_code_setting_id:
    undefined,

  employee_type: undefined,

  running_date: dayjs(),

  /* -------------------------------------------------------
     Account
  ------------------------------------------------------- */

  create_user_account: true,
  update_user_account: false,

  role_id: undefined,
  auth_email: "",

  account_is_active: true,

  /* -------------------------------------------------------
     Other
  ------------------------------------------------------- */

  remark: "",
};

const MASTER_ENDPOINTS = {
  companies:
    "/api/admin/companies?all=true&status=active&scope_context=ems.employees",
  branchGroups:
    "/api/admin/branch-groups?all=true&status=active&scope_context=ems.employees",
  branches:
    "/api/admin/branches?all=true&status=active&scope_context=ems.employees",
  departments:
    "/api/admin/departments?all=true&status=active&scope_context=ems.employees",
  branchDepartments:
    "/api/admin/branch-departments?all=true&status=active&scope_context=ems.employees",
  divisions:
    "/api/admin/divisions?all=true&status=active&scope_context=ems.employees",
  units:
    "/api/admin/units?all=true&status=active&scope_context=ems.employees",
  positions:
    "/api/admin/positions?all=true&status=active&scope_context=ems.employees",
  positionFamilies:
  "/api/admin/position-families?all=true&status=active&scope_context=ems.employees",
  positionLevels:
    "/api/admin/position-levels?all=true&status=active&scope_context=ems.employees",
  positionFamilyLevels:
    "/api/admin/position-family-levels?all=true",
  unitPositions:
    "/api/admin/unit-positions?all=true&status=active",
  jobs:
    "/api/admin/jobs?all=true&status=active",
  businessUnits:
    "/api/admin/business-units?all=true&status=active",
  costCenters:
    "/api/admin/cost-centers?all=true&status=active",
  profitCenters:
    "/api/admin/profit-centers?all=true&status=active",
  titles:
    "/api/admin/titles?all=true&status=active",
  genders:
    "/api/admin/genders?all=true&status=active",
  maritalStatuses:
    "/api/admin/marital-statuses?all=true&status=active",
  religions:
    "/api/admin/religions?all=true&status=active",
  nationalities:
    "/api/admin/nationalities?all=true&status=active",
  countries:
    "/api/admin/countries?all=true&status=active",
  employmentTypes:
    "/api/admin/employment-types?all=true&status=active",
  employeeStatuses:
    "/api/admin/employee-statuses?all=true&status=active",
  payrollCompanies:
    "/api/admin/payroll-companies?all=true&status=active",
  payrollTypes:
    "/api/admin/payroll-types?all=true&status=active",
  payrollGroups:
    "/api/admin/payroll-groups?all=true&status=active",
  positionLevelBands:
    "/api/admin/position-level-bands?all=true&status=active",
  banks:
    "/api/admin/banks?all=true&status=active",
  paymentMethods:
    "/api/admin/payment-methods?all=true&status=active&supports_payroll=true",
  employeeCodeSettings:
    "/api/admin/employee-code-settings?all=true&status=active&scope_context=ems.employees",
  roles:
    "/api/admin/roles?all=true&is_active=true",
};

function getApiMessage(
  result,
  fallback
) {
  return (
    result?.message ||
    result?.error ||
    fallback
  );
}

function cleanText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function cleanNullableText(value) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function cleanNullableUuid(value) {
  return cleanNullableText(value);
}

function parseInteger(
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

function parseDecimal(
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

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function formatDateForApi(value) {
  if (!value) {
    return null;
  }

  if (dayjs.isDayjs(value)) {
    return value.isValid()
      ? value.format("YYYY-MM-DD")
      : null;
  }

  const parsed = dayjs(value);

  return parsed.isValid()
    ? parsed.format("YYYY-MM-DD")
    : null;
}

function toDayjs(value) {
  if (!value) {
    return null;
  }

  if (dayjs.isDayjs(value)) {
    return value.isValid()
      ? value
      : null;
  }

  const parsed = dayjs(value);

  return parsed.isValid()
    ? parsed
    : null;
}

function normalizeRows(result) {
  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.items)) {
    return result.items;
  }

  if (Array.isArray(result)) {
    return result;
  }

  return [];
}

function normalizeEmployeeListResponse(
  result
) {
  const rows = normalizeRows(result);

  const pagination =
    result?.pagination || {};

  return {
    rows,

    total:
      Number(pagination.total) ||
      Number(result?.total) ||
      rows.length,

    page:
      Number(pagination.page) || 1,

    pageSize:
      Number(pagination.pageSize) ||
      DEFAULT_PAGE_SIZE,

    totalPages:
      Number(
        pagination.totalPages
      ) || 1,

    summary:
      result?.meta?.summary ||
      result?.summary ||
      null,
  };
}

function getUserAccount(record) {
  if (
    Array.isArray(
      record?.user_accounts
    )
  ) {
    return (
      record.user_accounts[0] ||
      null
    );
  }

  return (
    record?.user_accounts ||
    null
  );
}

function getRoleFromRecord(record) {
  const account =
    getUserAccount(record);

  if (!account) {
    return null;
  }

  return (
    account.roles ||
    account.role ||
    null
  );
}

function createEmployeeFormValues(record) {
  const account =
    getUserAccount(record);

  const role =
    getRoleFromRecord(record);

  const values = {
    /* -----------------------------------------------------
       Personal
    ----------------------------------------------------- */

    title_id:
      record.title_id ||
      undefined,

    first_name_th:
      record.first_name_th || "",

    middle_name_th:
      record.middle_name_th || "",

    last_name_th:
      record.last_name_th || "",

    first_name_en:
      record.first_name_en || "",

    middle_name_en:
      record.middle_name_en || "",

    last_name_en:
      record.last_name_en || "",

    nickname_th:
      record.nickname_th ||
      record.nick_name ||
      "",

    nickname_en:
      record.nickname_en || "",

    gender_id:
      record.gender_id ||
      undefined,

    marital_status_id:
      record.marital_status_id ||
      undefined,

    religion_id:
      record.religion_id ||
      undefined,

    nationality_id:
      record.nationality_id ||
      undefined,

    country_id:
      record.country_id ||
      undefined,

    birth_date:
      toDayjs(record.birth_date),

    birth_province_code:
      record.birth_province_code
        ? String(
            record.birth_province_code
          )
        : undefined,

    birth_district_code:
      record.birth_district_code
        ? String(
            record.birth_district_code
          )
        : undefined,

    birth_subdistrict_code:
      record.birth_subdistrict_code
        ? String(
            record.birth_subdistrict_code
          )
        : undefined,

    birth_postcode:
      record.birth_postcode || "",

    birth_place:
      record.birth_place || "",

    blood_group:
      record.blood_group ||
      undefined,

    citizen_id:
      record.citizen_id || "",

    passport_no:
      record.passport_no || "",

    passport_expire_date:
      toDayjs(
        record.passport_expire_date
      ),

    employee_photo_path:
      record.employee_photo_path ||
      null,

    employee_photo_url:
      record.employee_photo_url ||
      null,


    /* -----------------------------------------------------
       Contact
    ----------------------------------------------------- */

    mobile_phone:
      record.mobile_phone ||
      record.phone ||
      "",

    home_phone:
      record.home_phone || "",

    work_phone:
      record.work_phone || "",

    personal_email:
      record.personal_email || "",

    work_email:
      record.work_email ||
      record.email ||
      "",

    line_id:
      record.line_id || "",

    /*
     * Statutory fields are editable only during Create in this Wizard.
     * Existing employee statutory history is managed at
     * /admin/employee-statutory-profiles.
     */
    tax_identity_type:
      record.citizen_id
        ? "citizen_id"
        : record.passport_no
          ? "passport"
          : "tax_id",

    tax_identification_no:
      record.tax_id || "",

    tax_filing_form_code:
      undefined,

    tax_resident_status:
      "resident",

    tax_withholding_company_id:
      undefined,

    statutory_effective_from:
      toDayjs(
        record.start_work_date ||
          record.hire_date
      ) || dayjs(),

    social_security_registered:
      Boolean(
        record.social_security_no
      ),

    social_security_no:
      record.social_security_no ||
      "",

    insured_type:
      record.social_security_no
        ? "section_33"
        : undefined,

    social_security_company_id:
      undefined,

    /* Legacy compatibility */
    tax_id:
      record.tax_id || "",

    /* -----------------------------------------------------
       Organization
    ----------------------------------------------------- */

    use_tax_company_for_organization: false,

    company_id:
      record.company_id ||
      undefined,

    branch_group_id:
      record.branch_group_id ||
      undefined,

    branch_id:
      record.branch_id ||
      undefined,

    department_id:
      record.department_id ||
      undefined,

    division_id:
      record.division_id ||
      undefined,

    unit_id:
      record.unit_id ||
      undefined,

    position_id:
      record.position_id ||
      undefined,

    position_family_id:
      record.position_family_id ||
      record.positions
        ?.position_family_id ||
      undefined,

    position_level_id:
      record.position_level_id ||
      undefined,

    job_id:
      record.job_id ||
      undefined,

    business_unit_id:
      record.business_unit_id ||
      undefined,

    cost_center_id:
      record.cost_center_id ||
      undefined,

    profit_center_id:
      record.profit_center_id ||
      undefined,

    /* -----------------------------------------------------
       Employment
    ----------------------------------------------------- */

    employment_type_id:
      record.employment_type_id ||
      undefined,

    employee_status_id:
      record.employee_status_id ||
      undefined,

    start_work_date:
      toDayjs(
        record.start_work_date ||
          record.hire_date
      ),

    probation_days:
      parseInteger(
        record.probation_days,
        null
      ),

    probation_end_date:
      toDayjs(
        record.probation_end_date
      ),

    probation_status:
      record.probation_status ||
      "probation",

    confirmation_date:
      toDayjs(
        record.confirmation_date
      ),

    termination_date:
      toDayjs(
        record.termination_date
      ),

    resignation_date:
      toDayjs(
        record.resignation_date
      ),

    retirement_date:
      toDayjs(
        record.retirement_date
      ),

    status:
      record.status ||
      "active",

    /* -----------------------------------------------------
       Payroll
    ----------------------------------------------------- */

    payroll_company_id:
      record.payroll_company_id ||
      undefined,

    payroll_type_id:
      record.payroll_type_id ||
      undefined,

    payroll_group_id:
      record.payroll_group_id ||
      undefined,

    position_level_band_id:
      record.position_level_band_id ||
      undefined,

    base_salary:
      record.base_salary ??
      record.employee_compensations?.[0]
        ?.base_salary ??
      undefined,

    /*
     * บัญชีธนาคารแก้ไขผ่านหน้า employee-bank-accounts
     * ไม่ดึงมาแก้ใน Employee Wizard หลังสร้างแล้ว
     */
    payment_method_id:
      undefined,

    bank_id:
      undefined,

    bank_account_no:
      "",

    bank_account_name:
      "",

    bank_branch_name:
      "",

    /* -----------------------------------------------------
       Employee code

       ตอน Edit ไม่ Generate ใหม่
    ----------------------------------------------------- */

    employee_code_setting_id:
      undefined,

    employee_type:
      undefined,

    running_date:
      null,

    /* -----------------------------------------------------
       User Account
    ----------------------------------------------------- */

    create_user_account:
      false,

    update_user_account:
      false,

    role_id:
      account?.role_id ||
      role?.id ||
      undefined,

    auth_email:
      record.work_email ||
      record.personal_email ||
      "",

    account_is_active:
      account?.is_active ??
      true,

    /* -----------------------------------------------------
       Other
    ----------------------------------------------------- */

    remark:
      record.remark || "",
  };

  return values;
}

function resolveTaxIdentificationNo(values = {}) {
  const identityType =
    cleanText(
      values.tax_identity_type
    ) || "citizen_id";

  if (identityType === "citizen_id") {
    return cleanNullableText(
      values.citizen_id
    );
  }

  if (identityType === "passport") {
    return cleanNullableText(
      values.passport_no
    );
  }

  return cleanNullableText(
    values.tax_identification_no
  );
}

function buildEmployeeStatutoryPayload(
  values
) {
  const socialRegistered =
    Boolean(
      values.social_security_registered
    );

  return {
    tax_identity_type:
      cleanText(
        values.tax_identity_type
      ) || "citizen_id",

    tax_identification_no:
      values.tax_identity_type ===
      "tax_id"
        ? cleanNullableText(
            values.tax_identification_no
          )
        : null,

    tax_filing_form_code:
      cleanNullableText(
        values.tax_filing_form_code
      ),

    tax_resident_status:
      cleanText(
        values.tax_resident_status
      ) || "resident",

    tax_withholding_company_id:
      cleanNullableUuid(
        values.tax_withholding_company_id
      ),

    social_security_registered:
      socialRegistered,

    social_security_no:
      socialRegistered
        ? cleanNullableText(
            values.social_security_no
          )
        : null,

    insured_type:
      socialRegistered
        ? cleanNullableText(
            values.insured_type
          )
        : null,

    social_security_company_id:
      socialRegistered
        ? cleanNullableUuid(
            values.social_security_company_id
          )
        : null,

    effective_from:
      formatDateForApi(
        values.statutory_effective_from ||
          values.start_work_date
      ),

    effective_to: null,
    status: "active",
    remark: null,
  };
}

function buildEmployeePayload(values,{
    mode,
    selectedRecord,
  }
) {
  const isCreate =
    mode === "create";

  return {
    /* -----------------------------------------------------
       Personal
    ----------------------------------------------------- */

    title_id:
      cleanNullableUuid(
        values.title_id
      ),

    first_name_th:
      cleanText(
        values.first_name_th
      ),

    middle_name_th:
      cleanNullableText(
        values.middle_name_th
      ),

    last_name_th:
      cleanText(
        values.last_name_th
      ),

    first_name_en:
      cleanNullableText(
        values.first_name_en
      ),

    middle_name_en:
      cleanNullableText(
        values.middle_name_en
      ),

    last_name_en:
      cleanNullableText(
        values.last_name_en
      ),

    nickname_th:
      cleanNullableText(
        values.nickname_th
      ),

    nickname_en:
      cleanNullableText(
        values.nickname_en
      ),

    gender_id:
      cleanNullableUuid(
        values.gender_id
      ),

    marital_status_id:
      cleanNullableUuid(
        values.marital_status_id
      ),

    religion_id:
      cleanNullableUuid(
        values.religion_id
      ),

    nationality_id:
      cleanNullableUuid(
        values.nationality_id
      ),

    country_id:
      cleanNullableUuid(
        values.country_id
      ),

    birth_date:
      formatDateForApi(
        values.birth_date
      ),

    birth_place:
      cleanNullableText(
        values.birth_place
      ),

    blood_group:
      cleanNullableText(
        values.blood_group
      ),

    citizen_id:
      cleanNullableText(
        values.citizen_id
      ),

    passport_no:
      cleanNullableText(
        values.passport_no
      ),

    passport_expire_date:
      formatDateForApi(
        values.passport_expire_date
      ),

    employee_photo_path:
      cleanNullableText(
        values.employee_photo_path
      ),

    employee_photo_url:
      cleanNullableText(
        values.employee_photo_url
      ),

    birth_province_code:
      cleanNullableText(
        values.birth_province_code
      ),

    birth_district_code:
      cleanNullableText(
        values.birth_district_code
      ),

    birth_subdistrict_code:
      cleanNullableText(
        values.birth_subdistrict_code
      ),

    birth_postcode:
      cleanNullableText(
        values.birth_postcode
      ),


    /* -----------------------------------------------------
       Contact
    ----------------------------------------------------- */

    mobile_phone:
      cleanNullableText(
        values.mobile_phone
      ),

    home_phone:
      cleanNullableText(
        values.home_phone
      ),

    work_phone:
      cleanNullableText(
        values.work_phone
      ),

    personal_email:
      cleanNullableText(
        values.personal_email
      ),

    work_email:
      cleanNullableText(
        values.work_email
      ),

    line_id:
      cleanNullableText(
        values.line_id
      ),

    /*
     * Legacy compatibility:
     * employees.tax_id mirrors the selected Tax Identity.
     * The statutory source of truth is employee_statutory_profiles.
     */
    tax_id:
      isCreate
        ? resolveTaxIdentificationNo(
            values
          )
        : cleanNullableText(
            selectedRecord?.tax_id
          ),

    social_security_no:
      isCreate
        ? Boolean(
            values.social_security_registered
          )
          ? cleanNullableText(
              values.social_security_no
            )
          : null
        : cleanNullableText(
            selectedRecord
              ?.social_security_no
          ),

    /*
     * ส่ง Statutory เข้า /api/admin/employees พร้อม Employee
     * เพื่อให้ Backend บันทึก Employee + Tax/SSO เป็นชุดเดียวกัน
     * เฉพาะ Create เท่านั้น
     * Edit ใช้ /admin/employee-statutory-profiles เพื่อรักษา Effective History
     */
    ...(isCreate
      ? buildEmployeeStatutoryPayload(
          values
        )
      : {}),

    /* -----------------------------------------------------
       Organization
    ----------------------------------------------------- */

    company_id:
      cleanNullableUuid(
        values.company_id
      ),

    branch_group_id:
      cleanNullableUuid(
        values.branch_group_id
      ),

    branch_id:
      cleanNullableUuid(
        values.branch_id
      ),

    department_id:
      cleanNullableUuid(
        values.department_id
      ),

    division_id:
      cleanNullableUuid(
        values.division_id
      ),

    unit_id:
      cleanNullableUuid(
        values.unit_id
      ),

    position_id:
      cleanNullableUuid(
        values.position_id
      ),
    
    position_family_id:
      cleanNullableUuid(
        values.position_family_id
      ),

    position_level_id:
      cleanNullableUuid(
        values.position_level_id
      ),

    job_id:
      cleanNullableUuid(
        values.job_id
      ),

    business_unit_id:
      cleanNullableUuid(
        values.business_unit_id
      ),

    cost_center_id:
      cleanNullableUuid(
        values.cost_center_id
      ),

    profit_center_id:
      cleanNullableUuid(
        values.profit_center_id
      ),

    /* -----------------------------------------------------
       Employment
    ----------------------------------------------------- */

    employment_type_id:
      cleanNullableUuid(
        values.employment_type_id
      ),

    employee_status_id:
      cleanNullableUuid(
        values.employee_status_id
      ),

    start_work_date:
      formatDateForApi(
        values.start_work_date
      ),

    probation_days:
      parseInteger(
        values.probation_days,
        null
      ),

    probation_end_date:
      formatDateForApi(
        values.probation_end_date
      ),

    probation_status:
      cleanNullableText(
        values.probation_status
      ) || "probation",

    confirmation_date:
      formatDateForApi(
        values.confirmation_date
      ),

    termination_date:
      formatDateForApi(
        values.termination_date
      ),

    resignation_date:
      formatDateForApi(
        values.resignation_date
      ),

    retirement_date:
      formatDateForApi(
        values.retirement_date
      ),

    status:
      cleanText(values.status) ||
      "active",

    /* -----------------------------------------------------
       Payroll
    ----------------------------------------------------- */

    payroll_company_id:
      cleanNullableUuid(
        values.payroll_company_id
      ),

    payroll_type_id:
      cleanNullableUuid(
        values.payroll_type_id
      ),

    payroll_group_id:
      cleanNullableUuid(
        values.payroll_group_id
      ),

    position_level_band_id:
      cleanNullableUuid(
        values.position_level_band_id
      ),

    base_salary:
      isCreate
        ? parseDecimal(
            values.base_salary
          )
        : undefined,

    /* -----------------------------------------------------
       Initial Bank Account

       ไม่บันทึกลง employees
       API จะนำไป insert employee_bank_accounts
    ----------------------------------------------------- */

    payment_method_id:
      isCreate
        ? cleanNullableUuid(
            values.payment_method_id
          )
        : undefined,

    bank_id:
      isCreate
        ? cleanNullableUuid(
            values.bank_id
          )
        : undefined,

    bank_account_no:
      isCreate
        ? String(
            values.bank_account_no ||
              ""
          )
            .replace(/\D/g, "")
            .trim() || null
        : undefined,

    bank_account_name:
      isCreate
        ? cleanNullableText(
            values.bank_account_name
          )
        : undefined,

    bank_branch_name:
      isCreate
        ? cleanNullableText(
            values.bank_branch_name
          )
        : undefined,

    /* -----------------------------------------------------
       Employee code
    ----------------------------------------------------- */

    employee_code_setting_id:
      isCreate
        ? cleanNullableUuid(
            values.employee_code_setting_id
          )
        : undefined,

    employee_type:
      isCreate
        ? cleanNullableText(
            values.employee_type
          )
        : undefined,

    running_date:
      isCreate
        ? formatDateForApi(
            values.running_date ||
              values.start_work_date
          )
        : undefined,

    /* -----------------------------------------------------
       User Account
    ----------------------------------------------------- */

    create_user_account:
      isCreate
        ? Boolean(
            values.create_user_account
          )
        : undefined,

    update_user_account:
      !isCreate
        ? Boolean(
            values.update_user_account
          )
        : undefined,

    role_id:
      cleanNullableUuid(
        values.role_id
      ),

    auth_email:
      cleanNullableText(
        values.auth_email
      ),

    account_is_active:
      Boolean(
        values.account_is_active
      ),

    /* -----------------------------------------------------
       Other
    ----------------------------------------------------- */

    remark:
      cleanNullableText(
        values.remark
      ),

    /*
      employee_code ไม่ถูกส่งตอนแก้ไข
      API จะรักษารหัสเดิมไว้
    */

    employee_code:
      isCreate
        ? undefined
        : selectedRecord
            ?.employee_code,
  };
}

const DEFAULT_FILTERS = {
  search: "",
  company_id: "",
  branch_group_id: "",
  branch_id: "",
  department_id: "",
  division_id: "",
  unit_id: "",
  position_id: "",
  position_level_id: "",
  employment_type_id: "",
  employee_status_id: "",
};

const EMPTY_OPTIONS = {
  companies: [],
  branch_groups: [],
  branches: [],
  branch_departments: [],
  departments: [],
  divisions: [],
  units: [],
  position_levels: [],
  employment_types: [],
  employee_statuses: [],
};

const EMPTY_SUMMARY = {
  total: 0,
  working: 0,
  probation: 0,
  resigned: 0,
  inactive: 0,
  company_count: 0,
  branch_count: 0,
  department_count: 0,
  unit_count: 0,
};


export default function EmployeeOrganizationPage() {
  const {
    user,
    loadingUser: authLoading,
    canView,
    canCreate,
    canEdit,
  } = useScopedPermissions(
    "ems.employee_organization",
    {
      scopeType: "employee",
    }
  );

  const [viewMode, setViewMode] = useState("structure");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [organizationTree, setOrganizationTree] = useState([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summaryTruncated, setSummaryTruncated] = useState(false);


  /* =======================================================
     Employee Wizard

     หน้านี้เปิด Employee Wizard เดิมภายในหน้า
     /admin/employee-organization โดยตรง
     ไม่ใช้ /admin/employees เป็นทางผ่าน
  ======================================================= */

  const [form] = Form.useForm();

  const [masterData, setMasterData] = useState({
    companies: [],
    branchGroups: [],
    branches: [],
    departments: [],
    branchDepartments: [],
    divisions: [],
    units: [],
    positions: [],
    unitPositions: [],
    jobs: [],
    businessUnits: [],
    costCenters: [],
    profitCenters: [],

    titles: [],
    genders: [],
    maritalStatuses: [],
    religions: [],
    nationalities: [],
    countries: [],

    employmentTypes: [],
    employeeStatuses: [],

    payrollCompanies: [],
    payrollTypes: [],
    payrollGroups: [],
    positionLevelBands: [],
    banks: [],
    paymentMethods: [],

    employeeCodeSettings: [],
    roles: [],
    positionFamilies: [],
    positionLevels: [],
    positionFamilyLevels: [],
  });

  const scopedMasterData = masterData;

  const [masterLoading, setMasterLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [employeeActionLoading, setEmployeeActionLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const modalDisabled = modalMode === "view";

  const modalTitle = useMemo(() => {
    if (modalMode === "view") {
      return "รายละเอียดพนักงาน";
    }

    if (modalMode === "edit") {
      return "แก้ไขข้อมูลพนักงาน";
    }

    return "เพิ่มพนักงาน";
  }, [modalMode]);

  const canEditSelectedRecord = useMemo(() => {
    return Boolean(selectedRecord && canEdit);
  }, [selectedRecord, canEdit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters.search]);

  const fetchOptions = useCallback(async () => {
    if (!canView) return;

    setOptionsLoading(true);

    try {
      const response = await fetch(
        "/api/admin/employee-organization/options",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          getApiMessage(
            result,
            "ไม่สามารถโหลดตัวเลือกโครงสร้างองค์กรได้"
          )
        );
      }

      setOptions({
        ...EMPTY_OPTIONS,
        ...(result.data || {}),
      });
    } catch (error) {
      console.error("LOAD_EMPLOYEE_ORG_OPTIONS_ERROR", error);
      message.error(
        error?.message || "ไม่สามารถโหลดตัวเลือกโครงสร้างองค์กรได้"
      );
    } finally {
      setOptionsLoading(false);
    }
  }, [canView]);


  /* =======================================================
     Employee Wizard Master Data

     ใช้ชุด Master เดียวกับหน้า /admin/employees
     เพื่อไม่สร้าง Form / Validation / Master Logic ชุดใหม่
  ======================================================= */

  const fetchMasterEndpoint = useCallback(
    async (key, endpoint) => {
      try {
        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          console.error(`fetchMasterEndpoint ${key} error:`, {
            status: response.status,
            endpoint,
            result,
          });

          return {
            key,
            rows: [],
            error: getApiMessage(
              result,
              `ไม่สามารถโหลดข้อมูล ${key} ได้`
            ),
          };
        }

        return {
          key,
          rows: normalizeRows(result),
          error: null,
        };
      } catch (error) {
        console.error(`fetchMasterEndpoint ${key} exception:`, error);

        return {
          key,
          rows: [],
          error: error?.message || `ไม่สามารถโหลดข้อมูล ${key} ได้`,
        };
      }
    },
    []
  );

  const fetchMasterData = useCallback(async () => {
    if (!canView) {
      return;
    }

    setMasterLoading(true);

    try {
      const entries = Object.entries(MASTER_ENDPOINTS);

      const results = await Promise.all(
        entries.map(([key, endpoint]) =>
          fetchMasterEndpoint(key, endpoint)
        )
      );

      const nextData = {};
      const errors = [];

      for (const result of results) {
        nextData[result.key] = result.rows;

        if (result.error) {
          errors.push(result.error);
        }
      }

      setMasterData((current) => ({
        ...current,
        ...nextData,
      }));

      if (errors.length > 0) {
        console.warn(
          "Some employee master data could not be loaded:",
          errors
        );

        message.warning(
          "ข้อมูล Master บางส่วนโหลดไม่สำเร็จ กรุณาตรวจสอบ API ที่เกี่ยวข้อง"
        );
      }
    } catch (error) {
      console.error("fetchMasterData exception:", error);

      message.error(
        error?.message || "ไม่สามารถโหลดข้อมูล Master ได้"
      );
    } finally {
      setMasterLoading(false);
    }
  }, [canView, fetchMasterEndpoint]);

  const requestParams = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("include_summary", page === 1 ? "true" : "false");

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    const keys = [
      "company_id",
      "branch_group_id",
      "branch_id",
      "department_id",
      "division_id",
      "unit_id",
      "position_id",
      "position_level_id",
      "employment_type_id",
      "employee_status_id",
    ];

    for (const key of keys) {
      if (filters[key]) {
        params.set(key, filters[key]);
      }
    }

    return params;
  }, [
    page,
    pageSize,
    debouncedSearch,
    filters.company_id,
    filters.branch_group_id,
    filters.branch_id,
    filters.department_id,
    filters.division_id,
    filters.unit_id,
    filters.position_id,
    filters.position_level_id,
    filters.employment_type_id,
    filters.employee_status_id,
  ]);

  const fetchEmployees = useCallback(async () => {
    if (!canView) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/employee-organization?${requestParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          getApiMessage(
            result,
            "ไม่สามารถโหลดพนักงานตามโครงสร้างองค์กรได้"
          )
        );
      }

      setEmployees(Array.isArray(result.data) ? result.data : []);
      if (result.summary) {
        setSummary({
          ...EMPTY_SUMMARY,
          ...result.summary,
        });
      }

      if (Array.isArray(result.organization_tree)) {
        setOrganizationTree(result.organization_tree);
      }

      setTotal(Number(result?.pagination?.total || 0));

      if (page === 1) {
        setSummaryTruncated(Boolean(result?.meta?.summary_truncated));
      }
    } catch (error) {
      console.error("LOAD_EMPLOYEE_ORGANIZATION_ERROR", error);
      message.error(
        error?.message || "ไม่สามารถโหลดพนักงานตามโครงสร้างองค์กรได้"
      );
    } finally {
      setLoading(false);
    }
  }, [canView, requestParams]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleFilterChange = useCallback((key, value) => {
    setPage(1);

    setFilters((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === "company_id") {
        next.branch_group_id = "";
        next.branch_id = "";
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      }

      if (key === "branch_group_id") {
        next.branch_id = "";
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      }

      if (key === "branch_id") {
        next.department_id = "";
        next.division_id = "";
        next.unit_id = "";
      }

      if (key === "department_id") {
        next.division_id = "";
        next.unit_id = "";
      }

      if (key === "division_id") {
        next.unit_id = "";
      }

      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setDebouncedSearch("");
    setPage(1);
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchOptions(),
      fetchEmployees(),
    ]);
  }, [fetchEmployees, fetchOptions]);

  const handleTableChange = useCallback((nextPage, nextPageSize) => {
    if (nextPageSize !== pageSize) {
      setPageSize(nextPageSize);
      setPage(1);
      return;
    }

    setPage(nextPage);
  }, [pageSize]);

  const handleTreeSelect = useCallback((node) => {
    if (!node?.id || !node?.filters) return;

    setPage(1);
    setFilters((current) => ({
      ...current,
      company_id: node.filters.company_id || "",
      branch_group_id: node.filters.branch_group_id || "",
      branch_id: node.filters.branch_id || "",
      department_id: node.filters.department_id || "",
      division_id: node.filters.division_id || "",
      unit_id: node.filters.unit_id || "",
    }));
  }, []);

  /* =======================================================
     Employee Actions

     เปิด EmployeeWizardModal เดิมภายในหน้านี้โดยตรง
     - Create: เพิ่มพนักงานจากโครงสร้างที่ Filter อยู่
     - View: ดูรายละเอียดพนักงาน
     - Edit: แก้ไขข้อมูลพนักงาน

     ไม่ redirect ไป /admin/employees
  ======================================================= */

  const loadEmployeeDetail = useCallback(async (record) => {
    if (!record?.id) {
      throw new Error("ไม่พบรหัสพนักงาน");
    }

    setEmployeeActionLoading(true);

    try {
      /* ---------------------------------------------------
         1) ลอง Detail Endpoint ก่อน ถ้ามี GET รองรับ
      --------------------------------------------------- */

      try {
        const detailResponse = await fetch(
          `/api/admin/employees/${record.id}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (detailResponse.ok) {
          const detailResult = await detailResponse
            .json()
            .catch(() => null);

          const detailData =
            detailResult?.data &&
            !Array.isArray(detailResult.data)
              ? detailResult.data
              : detailResult;

          if (
            detailData?.id &&
            String(detailData.id) === String(record.id)
          ) {
            return detailData;
          }
        }
      } catch (detailError) {
        console.debug(
          "EMPLOYEE_DETAIL_ENDPOINT_FALLBACK",
          detailError
        );
      }

      /* ---------------------------------------------------
         2) Fallback ใช้ Employee List API เดิม
         หน้า /admin/employees ใช้ Row จาก API นี้กับ Wizard อยู่แล้ว
      --------------------------------------------------- */

      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", "50");
      params.set("include_summary", "false");

      const searchValue =
        record.employee_code ||
        record.first_name_th ||
        record.first_name_en ||
        "";

      if (searchValue) {
        params.set("search", String(searchValue));
      }

      const response = await fetch(
        `/api/admin/employees?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          getApiMessage(
            result,
            "ไม่สามารถโหลดรายละเอียดพนักงานได้"
          )
        );
      }

      const rows = normalizeRows(result);
      const employee = rows.find(
        (item) => String(item?.id || "") === String(record.id)
      );

      if (!employee) {
        throw new Error("ไม่พบข้อมูลพนักงานที่ต้องการ");
      }

      return employee;
    } finally {
      setEmployeeActionLoading(false);
    }
  }, []);

  const handleCreateEmployee = useCallback(() => {
    if (!canCreate) {
      message.warning("คุณไม่มีสิทธิ์เพิ่มพนักงานจากหน้านี้");
      return;
    }

    setSelectedRecord(null);
    setModalMode("create");
    setCurrentStep(0);

    form.resetFields();

    /* -----------------------------------------------------
       Prefill จากโครงสร้างที่ User กรองไว้
       แต่ยังให้ User เปลี่ยนได้ตาม Scope / Logic เดิมของ Wizard
    ----------------------------------------------------- */

    form.setFieldsValue({
      ...DEFAULT_FORM_VALUES,
      company_id: filters.company_id || undefined,
      branch_group_id: filters.branch_group_id || undefined,
      branch_id: filters.branch_id || undefined,
      department_id: filters.department_id || undefined,
      division_id: filters.division_id || undefined,
      unit_id: filters.unit_id || undefined,
      position_level_id: filters.position_level_id || undefined,
      position_id: filters.position_id || undefined,
      employment_type_id: filters.employment_type_id || undefined,
      employee_status_id: filters.employee_status_id || undefined,
    });

    setModalOpen(true);

    /* Lazy load Master ตอนเปิด Wizard เท่านั้น */
    fetchMasterData();
  }, [
    canCreate,
    fetchMasterData,
    filters.branch_group_id,
    filters.branch_id,
    filters.company_id,
    filters.department_id,
    filters.division_id,
    filters.employee_status_id,
    filters.employment_type_id,
    filters.position_id,
    filters.position_level_id,
    filters.unit_id,
    form,
  ]);

  const openExistingEmployee = useCallback(
    async (record, mode) => {
      if (!record?.id) {
        return;
      }

      try {
        const employee = await loadEmployeeDetail(record);

        setSelectedRecord(employee);
        setModalMode(mode);
        setCurrentStep(0);

        form.resetFields();
        form.setFieldsValue(createEmployeeFormValues(employee));

        setModalOpen(true);

        fetchMasterData();
      } catch (error) {
        console.error("OPEN_EMPLOYEE_WIZARD_ERROR", error);
        message.error(
          error?.message || "ไม่สามารถเปิดข้อมูลพนักงานได้"
        );
      }
    },
    [fetchMasterData, form, loadEmployeeDetail]
  );

  const handleViewEmployee = useCallback(
    (record) => {
      if (!canView) {
        message.warning("คุณไม่มีสิทธิ์ดูข้อมูลพนักงานรายนี้");
        return;
      }

      openExistingEmployee(record, "view");
    },
    [canView, openExistingEmployee]
  );

  const handleEditEmployee = useCallback(
    (record) => {
      if (!canEdit) {
        message.warning("คุณไม่มีสิทธิ์แก้ไขพนักงานจากหน้านี้");
        return;
      }

      openExistingEmployee(record, "edit");
    },
    [canEdit, openExistingEmployee]
  );

  const handleEditFromView = useCallback(() => {
    if (!selectedRecord || !canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานรายนี้");
      return;
    }

    setModalMode("edit");
  }, [selectedRecord, canEdit]);

  const handleCloseModal = useCallback(() => {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setSelectedRecord(null);
    setModalMode("create");
    setCurrentStep(0);

    form.resetFields();
  }, [saving, form]);

  const handlePreviousStep = useCallback(() => {
    setCurrentStep((current) => Math.max(current - 1, 0));
  }, []);

  const handleNextStep = useCallback(async () => {
    try {
      const fields = EMPLOYEE_STEP_FIELDS[currentStep] || [];

      await form.validateFields(fields);

      if (currentStep === 2) {
        const values = form.getFieldsValue([
          "company_id",
          "branch_id",
          "department_id",
          "position_id",
        ]);

        if (!values.company_id) {
          message.warning("กรุณาเลือกบริษัท");
          return;
        }

        if (!values.branch_id) {
          message.warning("กรุณาเลือกสังกัด");
          return;
        }

        if (!values.department_id) {
          message.warning("กรุณาเลือกแผนก");
          return;
        }

        if (!values.position_id) {
          message.warning("กรุณาเลือกตำแหน่ง");
          return;
        }
      }

      if (currentStep === 6) {
        const values = form.getFieldsValue([
          "create_user_account",
          "update_user_account",
          "role_id",
          "auth_email",
        ]);

        const accountEnabled =
          modalMode === "create"
            ? Boolean(values.create_user_account)
            : Boolean(values.update_user_account);

        if (accountEnabled && !values.role_id) {
          message.warning("กรุณาเลือก Role");
          return;
        }

        if (accountEnabled && !cleanText(values.auth_email)) {
          message.warning("กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ");
          return;
        }
      }

      setCurrentStep((current) =>
        Math.min(current + 1, LAST_WIZARD_STEP)
      );
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      console.error("handleNextStep error:", error);
    }
  }, [currentStep, form, modalMode]);

  const handleStepChange = useCallback(
    async (nextStep) => {
      if (nextStep < 0 || nextStep > LAST_WIZARD_STEP) {
        return;
      }

      if (modalMode === "view") {
        setCurrentStep(nextStep);
        return;
      }

      if (nextStep < currentStep) {
        setCurrentStep(nextStep);
        return;
      }

      try {
        for (
          let step = currentStep;
          step < nextStep;
          step += 1
        ) {
          const fields = EMPLOYEE_STEP_FIELDS[step] || [];

          if (fields.length) {
            await form.validateFields(fields);
          }
        }

        setCurrentStep(nextStep);
      } catch (error) {
        if (error?.errorFields) {
          message.warning(
            "กรุณากรอกข้อมูลในขั้นตอนปัจจุบันให้ครบก่อน"
          );
          return;
        }

        console.error("handleStepChange error:", error);
      }
    },
    [modalMode, currentStep, form]
  );

  const handlePhotoChange = useCallback(
    async (file) => {
      if (!file) {
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        message.warning("รองรับเฉพาะไฟล์ JPG, PNG, WEBP");
        return;
      }

      const maxSize = 5 * 1024 * 1024;

      if (file.size > maxSize) {
        message.warning("ไฟล์รูปพนักงานต้องไม่เกิน 5 MB");
        return;
      }

      setUploadLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        if (selectedRecord?.id) {
          formData.append("employeeId", selectedRecord.id);
        }

        const response = await fetch(
          "/api/admin/employees/upload-photo",
          {
            method: "POST",
            body: formData,
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.error || "ไม่สามารถอัปโหลดรูปพนักงานได้"
          );
        }

        if (!result?.url) {
          throw new Error("อัปโหลดรูปสำเร็จ แต่ไม่พบ URL ของรูป");
        }

        form.setFieldsValue({
          employee_photo_path: result.path || null,
          employee_photo_url: result.url || null,
        });

        message.success("อัปโหลดรูปพนักงานเรียบร้อยแล้ว");
      } catch (error) {
        console.error("UPLOAD_EMPLOYEE_PHOTO_ERROR:", error);
        message.error(
          error?.message || "ไม่สามารถอัปโหลดรูปพนักงานได้"
        );
      } finally {
        setUploadLoading(false);
      }
    },
    [form, selectedRecord]
  );

  const handleSubmit = useCallback(async () => {
    if (modalMode === "view") {
      handleCloseModal();
      return;
    }

    if (modalMode === "create" && !canCreate) {
      message.warning("คุณไม่มีสิทธิ์เพิ่มพนักงาน");
      return;
    }

    if (modalMode === "edit" && (!selectedRecord || !canEdit)) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานรายนี้");
      return;
    }

    const isEdit = modalMode === "edit";

    if (isEdit && !selectedRecord?.id) {
      message.error("ไม่พบรหัสพนักงานที่ต้องการแก้ไข");
      return;
    }

    try {
      const submitFields = Array.from(
        new Set(
          Object.values(EMPLOYEE_STEP_FIELDS)
            .flat()
            .filter(
              (fieldName) => fieldName !== "position_level_band_id"
            )
        )
      );

      await form.validateFields(submitFields);

      const values = form.getFieldsValue(true);
      const payload = buildEmployeePayload(values, {
        mode: modalMode,
        selectedRecord,
      });

      if (!payload.company_id) {
        message.warning("กรุณาเลือกบริษัท");
        setCurrentStep(2);
        return;
      }

      if (!payload.branch_id) {
        message.warning("กรุณาเลือกสังกัด");
        setCurrentStep(2);
        return;
      }

      if (!payload.department_id) {
        message.warning("กรุณาเลือกแผนก");
        setCurrentStep(2);
        return;
      }

      if (!payload.position_id) {
        message.warning("กรุณาเลือกตำแหน่ง");
        setCurrentStep(2);
        return;
      }

      if (!payload.employment_type_id) {
        message.warning("กรุณาเลือกประเภทการจ้าง");
        setCurrentStep(3);
        return;
      }

      if (!payload.employee_status_id) {
        message.warning("กรุณาเลือกสถานะพนักงาน");
        setCurrentStep(3);
        return;
      }

      if (!payload.start_work_date) {
        message.warning("กรุณาเลือกวันที่เริ่มงาน");
        setCurrentStep(3);
        return;
      }

      if (
        payload.status === "resigned" &&
        !payload.resignation_date
      ) {
        message.warning("พนักงานลาออกต้องระบุวันที่ลาออก");
        setCurrentStep(3);
        return;
      }

      if (!isEdit) {
        const selectedPositionLevelId = payload.position_level_id
          ? String(payload.position_level_id)
          : "";

        const hasSalaryBandForPositionLevel =
          Boolean(selectedPositionLevelId) &&
          (scopedMasterData.positionLevelBands || []).some(
            (item) =>
              String(item?.position_level_id || "") ===
              selectedPositionLevelId
          );

        const selectedPosition =
          (scopedMasterData.positions || []).find(
            (item) =>
              String(item?.id || "") ===
              String(payload.position_id || "")
          ) || null;

        const isConfirmedNonExecutive =
          selectedPosition?.is_executive === false;

        if (
          hasSalaryBandForPositionLevel &&
          isConfirmedNonExecutive &&
          !payload.position_level_band_id
        ) {
          message.warning("กรุณาเลือก Salary Band");
          setCurrentStep(5);
          return;
        }

        if (
          payload.base_salary === null ||
          payload.base_salary === undefined ||
          Number(payload.base_salary) < 0
        ) {
          message.warning("กรุณาระบุเงินเดือนฐาน");
          setCurrentStep(5);
          return;
        }

        const hasInitialBankAccount = Boolean(
          payload.bank_id ||
            payload.bank_account_no ||
            payload.bank_account_name ||
            payload.bank_branch_name
        );

        if (hasInitialBankAccount && !payload.bank_id) {
          message.warning("กรุณาเลือกธนาคาร");
          setCurrentStep(5);
          return;
        }

        if (
          hasInitialBankAccount &&
          !/^\d{10}$/.test(payload.bank_account_no || "")
        ) {
          message.warning("เลขบัญชีธนาคารต้องมี 10 หลัก");
          setCurrentStep(5);
          return;
        }

        if (hasInitialBankAccount && !payload.bank_account_name) {
          message.warning("กรุณากรอกชื่อบัญชีธนาคาร");
          setCurrentStep(5);
          return;
        }

        if (!payload.employee_code_setting_id) {
          message.warning("กรุณาเลือกรูปแบบรหัสพนักงาน");
          setCurrentStep(6);
          return;
        }

        if (!payload.employee_type) {
          message.warning("กรุณาเลือกประเภทสำหรับสร้างรหัสพนักงาน");
          setCurrentStep(6);
          return;
        }

        if (!payload.running_date) {
          message.warning("กรุณาเลือกวันที่ Running");
          setCurrentStep(6);
          return;
        }
      }

      const accountEnabled = isEdit
        ? Boolean(payload.update_user_account)
        : Boolean(payload.create_user_account);

      if (accountEnabled && !payload.role_id) {
        message.warning("กรุณาเลือก Role");
        setCurrentStep(6);
        return;
      }

      if (accountEnabled && !payload.auth_email) {
        message.warning("กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ");
        setCurrentStep(6);
        return;
      }

      setSaving(true);

      const url = isEdit
        ? `/api/admin/employees/${selectedRecord.id}`
        : "/api/admin/employees";

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let result = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        message.error(
          getApiMessage(
            result,
            isEdit
              ? "ไม่สามารถแก้ไขข้อมูลพนักงานได้"
              : "ไม่สามารถเพิ่มพนักงานได้"
          )
        );
        return;
      }

      const initialLogin = result?.data?.initial_login || null;

      setModalOpen(false);
      setSelectedRecord(null);
      setModalMode("create");
      setCurrentStep(0);
      form.resetFields();

      if (!isEdit && initialLogin) {
        Modal.success({
          title: "สร้างพนักงานและบัญชีผู้ใช้งานสำเร็จ",
          centered: true,
          width: 520,
          content: (
            <div className="space-y-3">
              <p>{result?.message || "เพิ่มพนักงานเรียบร้อยแล้ว"}</p>

              <div className="rounded-lg bg-slate-50 p-4">
                <div>
                  Username:{" "}
                  <strong>{initialLogin.username}</strong>
                </div>

                <div className="mt-2">
                  รหัสผ่านชั่วคราว:{" "}
                  <strong>{initialLogin.temporary_password}</strong>
                </div>
              </div>

              <p className="text-sm text-orange-600">
                กรุณาแจ้งพนักงานให้เปลี่ยนรหัสผ่านหลังเข้าสู่ระบบครั้งแรก
              </p>
            </div>
          ),
        });
      } else {
        message.success(
          result?.message ||
            (isEdit
              ? "แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว"
              : "เพิ่มพนักงานเรียบร้อยแล้ว")
        );
      }

      if (!isEdit && page !== 1) {
        setPage(1);
        return;
      }

      await fetchEmployees();
    } catch (error) {
      if (error?.errorFields) {
        const firstField = error.errorFields?.[0]?.name?.[0];

        const stepEntry = Object.entries(EMPLOYEE_STEP_FIELDS).find(
          ([, fields]) => fields.includes(firstField)
        );

        if (stepEntry) {
          setCurrentStep(Number(stepEntry[0]));
        }

        return;
      }

      console.error("handleSubmit unexpected error:", error);

      message.error(
        error?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลพนักงาน"
      );
    } finally {
      setSaving(false);
    }
  }, [
    modalMode,
    canCreate,
    canEdit,
    handleCloseModal,
    form,
    selectedRecord,
    page,
    fetchEmployees,
    scopedMasterData.positionLevelBands,
    scopedMasterData.positions,
  ]);

  if (authLoading) {
    return <LoadingOrb />;
  }

  if (!user || !canView) {
    return <LoadingOrb />;
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Space align="center" size={12}>
              <ApartmentOutlined className="text-2xl text-blue-600" />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  พนักงานตามโครงสร้างองค์กร
                </Title>
                <Text type="secondary">
                  Employee Organization View — ดูจำนวนและรายชื่อพนักงานตามบริษัท สังกัด แผนก ฝ่าย และหน่วยงาน
                </Text>
              </div>
            </Space>
          </div>

          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              loading={loading || optionsLoading || employeeActionLoading}
              onClick={handleRefresh}
            >
              รีเฟรช
            </Button>

            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateEmployee}
              >
                เพิ่มพนักงาน
              </Button>
            )}
          </Space>
        </div>
      </Card>

      <Alert
        showIcon
        type="info"
        title="เกี่ยวกับหน้านี้"
        description="ใช้ค้นหา เพิ่ม ดูรายละเอียด และแก้ไขข้อมูลพนักงานตามโครงสร้างองค์กร สามารถกรองจากบริษัทลงถึงหน่วยงาน รวมถึงตำแหน่ง ระดับตำแหน่ง ประเภทการจ้าง และสถานะพนักงานได้ โดยปุ่มเพิ่ม ดูรายละเอียด และแก้ไขจะเปิด Employee Wizard เดิมภายในหน้านี้โดยตรง"
      />

      <EmployeeOrganizationSearch
        filters={filters}
        options={options}
        loading={loading}
        optionsLoading={optionsLoading}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        onRefresh={handleRefresh}
      />

      <EmployeeOrganizationSummaryCards
        summary={summary}
        loading={loading}
      />

      {summaryTruncated && (
        <Alert
          showIcon
          type="warning"
          title="ข้อมูลสรุปมีจำนวนมาก"
          description="ระบบจำกัดข้อมูลที่ใช้สร้างภาพรวมไว้เพื่อประสิทธิภาพ แต่ตารางรายการพนักงานยังใช้ Pagination ตามปกติ"
        />
      )}

      <Card
        title={
          <Space>
            <ApartmentOutlined />
            <span>มุมมองพนักงานตามโครงสร้าง</span>
          </Space>
        }
        extra={
          <Segmented
            value={viewMode}
            onChange={setViewMode}
            options={[
              {
                label: "โครงสร้างองค์กร",
                value: "structure",
                icon: <ApartmentOutlined />,
              },
              {
                label: "รายชื่อพนักงาน",
                value: "list",
                icon: <BarsOutlined />,
              },
            ]}
          />
        }
      >
        {viewMode === "structure" ? (
          <EmployeeOrganizationTree
            data={organizationTree}
            loading={loading}
            onSelectNode={handleTreeSelect}
          />
        ) : (
          <EmployeeOrganizationTable
            data={employees}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            canView={canView}
            canEdit={canEdit}
            onView={handleViewEmployee}
            onEdit={handleEditEmployee}
            onChange={handleTableChange}
          />
        )}
      </Card>

      {viewMode === "structure" && (
        <Card title="รายชื่อพนักงานในโครงสร้างที่เลือก">
          <EmployeeOrganizationTable
            data={employees}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={total}
            canView={canView}
            canEdit={canEdit}
            onView={handleViewEmployee}
            onEdit={handleEditEmployee}
            onChange={handleTableChange}
          />
        </Card>
      )}


      <EmployeeWizardModal
        open={modalOpen}
        title={modalTitle}
        mode={modalMode}
        form={form}
        currentStep={currentStep}
        saving={saving}
        disabled={modalDisabled}
        canEdit={canEditSelectedRecord}
        selectedRecord={selectedRecord}
        masterData={scopedMasterData}
        masterLoading={masterLoading}
        uploadLoading={uploadLoading}
        onCancel={handleCloseModal}
        onSubmit={handleSubmit}
        onEdit={handleEditFromView}
        onPrevious={handlePreviousStep}
        onNext={handleNextStep}
        onStepChange={handleStepChange}
        onPhotoChange={handlePhotoChange}
      />
    </div>
  );
}
