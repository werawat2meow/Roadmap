"use client";

import {useCallback,useEffect,useMemo,useState,} from "react";
import {Form,message,Modal,} from "antd";
import {TeamOutlined,} from "@ant-design/icons";
import dayjs from "dayjs";
import LoadingOrb from "@/app/components/LoadingOrb";
import MasterLayout from "@/app/admin/(employee-master)/components/master/MasterLayout";
import MasterPageHeader from "@/app/admin/(employee-master)/components/master/MasterPageHeader";
import PageInfoAlert from "@/app/admin/(employee-master)/components/common/PageInfoAlert";
import EmployeeSearch from "./components/EmployeeSearch";
import EmployeeSummaryCards from "./components/EmployeeSummaryCards";
import EmployeeTable from "./components/EmployeeTable";
import EmployeeWizardModal from "./components/EmployeeWizardModal";
import {EMPLOYEE_STEP_FIELDS, EMPLOYEE_WIZARD_STEPS} from "./components/EmployeeWizardForm";
import useScopedPermissions from "@/hooks/useScopedPermissions";

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

  tax_id: "",
  social_security_no: "",

  /* -------------------------------------------------------
     Organization
  ------------------------------------------------------- */

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
  salary_structure_id: undefined,

  /* -------------------------------------------------------
     Employee code
  ------------------------------------------------------- */

  employee_code_setting_id:
    undefined,

  employee_type: "thai",

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
  employeeCodeSettings:
    "/api/admin/employee-code-settings?all=true&status=active",
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

    tax_id:
      record.tax_id || "",

    social_security_no:
      record.social_security_no ||
      "",

    /* -----------------------------------------------------
       Organization
    ----------------------------------------------------- */

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

    salary_structure_id:
      record.salary_structure_id ||
      undefined,

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

    tax_id:
      cleanNullableText(
        values.tax_id
      ),

    social_security_no:
      cleanNullableText(
        values.social_security_no
      ),

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

    salary_structure_id:
      cleanNullableUuid(
        values.salary_structure_id
      ),

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

export default function EmployeesPage() {

  /* =========================================================
     Permission + Employee Scope
  ========================================================= */
  const {user, loadingUser:authLoading,

    /* Permission */
    canView,
    canCreate,
    canEdit,
    canDelete,

    /* Scope */
    hasAllScope,

    accessibleCompanyIds,
    accessibleBranchGroupIds,
    accessibleBranchIds,
    accessibleDepartmentIds,
    accessibleDivisionIds,
    accessibleUnitIds,
  } =
    useScopedPermissions(
      "ems.employees",
      {
        scopeType:
          "employee",
      }
    );
  
  /* ========================================================
    End Scope
  ========================================================== */  
  const [form] = Form.useForm();

  const [employees,setEmployees,] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    resigned: 0,
    probation: 0,
  });

  const [page, setPage] =useState(1);
  const [pageSize, setPageSize] =useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] =useState(0);

  /* =======================================================
     MASTER DATA
  ======================================================= */

  const [ masterData,setMasterData,] = useState({
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

    employeeCodeSettings: [],
    roles: [],
    positionFamilies: [],
    positionLevels: [],
    positionFamilyLevels: [],
  });

  /* =======================================================
     CURRENT USER SCOPED MASTER DATA

     Frontend ใช้เพื่อ UX เท่านั้น
     Backend /api/admin/employees ยังเป็นตัว enforce จริง
  ======================================================= */

  /*
   * Master APIs ถูกกรองด้วย Current User + ems.employees.view
   * ที่ Backend แล้ว จึงไม่ filter Scope ซ้ำฝั่ง Frontend
   * เพื่อไม่ให้ Company/Group/Branch ที่เป็น parent ซ้ำซ้อน
   * มาบีบข้อมูลจนกลายเป็น 0 อีกครั้ง
   */
  const scopedMasterData = masterData;

  /* =======================================================
     FILTERS
  ======================================================= */

  const [search, setSearch] = useState("");
  const [debouncedSearch,setDebouncedSearch,] = useState("");

  const [companyId,setCompanyId,] = useState("");
  const [branchGroupId,setBranchGroupId,] = useState("");
  const [branchId,setBranchId,] = useState("");
  const [departmentId,setDepartmentId,] = useState("");
  const [employeeStatusId,setEmployeeStatusId,] = useState("");
  const [employmentTypeId,setEmploymentTypeId,] = useState("");
  const [status, setStatus] =useState("");
  const [hasUserAccount,setHasUserAccount,] = useState("");
  const [loading, setLoading] = useState(false);
  const [masterLoading,setMasterLoading,] = useState(false);
  const [saving, setSaving] =useState(false);
  const [deletingId,setDeletingId,] = useState(null);
  const [uploadLoading,setUploadLoading,] = useState(false);
  const [modalOpen,setModalOpen,] = useState(false);
  const [modalMode,setModalMode,] = useState("create");
  const [selectedRecord,setSelectedRecord,] = useState(null);
  const [currentStep,setCurrentStep] = useState(0);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(
        search.trim()
      );

      setPage(1);
    }, 400);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  const fetchMasterEndpoint = useCallback(
      async (
        key,
        endpoint
      ) => {
        try {
          const response = await fetch(
            endpoint,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const result =
            await response.json();

          if (!response.ok) {
            console.error(
              `fetchMasterEndpoint ${key} error:`,
              {
                status: response.status,
                endpoint,
                result,
              }
            );

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
            rows:
              normalizeRows(result),
            error: null,
          };
        } catch (error) {
          console.error(
            `fetchMasterEndpoint ${key} exception:`,
            error
          );

          return {
            key,
            rows: [],
            error:
              error?.message ||
              `ไม่สามารถโหลดข้อมูล ${key} ได้`,
          };
        }
      },
      []
    );

  const fetchMasterData =
    useCallback(async () => {
      if (!canView) {
        return;
      }

      setMasterLoading(true);

      try {
        const entries =
          Object.entries(
            MASTER_ENDPOINTS
          );

        const results =
          await Promise.all(
            entries.map(
              ([key, endpoint]) =>
                fetchMasterEndpoint(
                  key,
                  endpoint
                )
            )
          );

        const nextData = {};

        const errors = [];

        for (const result of results) {
          nextData[result.key] =
            result.rows;

          if (result.error) {
            errors.push(
              result.error
            );
          }
        }

        setMasterData(
          (current) => ({
            ...current,
            ...nextData,
          })
        );

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
        console.error(
          "fetchMasterData exception:",
          error
        );

        message.error(
          error?.message ||
            "ไม่สามารถโหลดข้อมูล Master ได้"
        );
      } finally {
        setMasterLoading(false);
      }
    }, [
      canView,
      fetchMasterEndpoint,
    ]);

  const fetchEmployees =
    useCallback(async () => {
      if (!canView) {
        return;
      }

      setLoading(true);

      try {
        const params =
          new URLSearchParams();

        params.set(
          "page",
          String(page)
        );

        params.set(
          "pageSize",
          String(pageSize)
        );

        params.set(
          "include_summary",
          "true"
        );

        if (debouncedSearch) {
          params.set(
            "search",
            debouncedSearch
          );
        }

        if (companyId) {
          params.set(
            "company_id",
            companyId
          );
        }

        if (branchGroupId) {
          params.set(
            "branch_group_id",
            branchGroupId
          );
        }

        if (branchId) {
          params.set(
            "branch_id",
            branchId
          );
        }

        if (departmentId) {
          params.set(
            "department_id",
            departmentId
          );
        }

        if (employeeStatusId) {
          params.set(
            "employee_status_id",
            employeeStatusId
          );
        }

        if (employmentTypeId) {
          params.set(
            "employment_type_id",
            employmentTypeId
          );
        }

        if (status) {
          params.set(
            "status",
            status
          );
        }

        if (hasUserAccount) {
          params.set(
            "has_user_account",
            hasUserAccount
          );
        }

        const response = await fetch(
          `/api/admin/employees?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          message.error(
            getApiMessage(
              result,
              "ไม่สามารถโหลดข้อมูลพนักงานได้"
            )
          );

          setEmployees([]);
          setTotal(0);

          return;
        }

        const normalized =
          normalizeEmployeeListResponse(
            result
          );

        setEmployees(
          normalized.rows
        );

        setTotal(
          normalized.total
        );

        if (normalized.summary) {
          setSummary({
            total:
              Number(
                normalized.summary
                  .total
              ) || 0,

            active:
              Number(
                normalized.summary
                  .active
              ) || 0,

            inactive:
              Number(
                normalized.summary
                  .inactive
              ) || 0,

            resigned:
              Number(
                normalized.summary
                  .resigned
              ) || 0,

            probation:
              Number(
                normalized.summary
                  .probation
              ) || 0,
          });
        } else {
          setSummary({
            total:
              normalized.total,

            active:
              normalized.rows.filter(
                (item) =>
                  item.status ===
                  "active"
              ).length,

            inactive:
              normalized.rows.filter(
                (item) =>
                  item.status ===
                  "inactive"
              ).length,

            resigned:
              normalized.rows.filter(
                (item) =>
                  item.status ===
                  "resigned"
              ).length,

            probation:
              normalized.rows.filter(
                (item) =>
                  item.probation_status ===
                  "probation"
              ).length,
          });
        }

        const totalPages = Math.max(
          Math.ceil(
            normalized.total /
              pageSize
          ),
          1
        );

        if (page > totalPages) {
          setPage(totalPages);
        }
      } catch (error) {
        console.error(
          "fetchEmployees exception:",
          error
        );

        setEmployees([]);
        setTotal(0);

        message.error(
          error?.message ||
            "ไม่สามารถโหลดข้อมูลพนักงานได้"
        );
      } finally {
        setLoading(false);
      }
    }, [
      canView,
      page,
      pageSize,
      debouncedSearch,
      companyId,
      branchGroupId,
      branchId,
      departmentId,
      employeeStatusId,
      employmentTypeId,
      status,
      hasUserAccount,
    ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchMasterData();
  }, [
    authLoading,
    user,
    canView,
    fetchMasterData,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !canView
    ) {
      return;
    }

    fetchEmployees();
  }, [
    authLoading,
    user,
    canView,
    fetchEmployees,
  ]);

  const handleCreate =
    useCallback(() => {
      if (!canCreate) {
        message.warning(
          "คุณไม่มีสิทธิ์เพิ่มพนักงาน"
        );

        return;
      }

      setSelectedRecord(null);
      setModalMode("create");
      setCurrentStep(0);

      form.resetFields();

      form.setFieldsValue({
        ...DEFAULT_FORM_VALUES,
      });

      setModalOpen(true);
    }, [
      canCreate,
      form,
    ]);

  const handleView = useCallback( (record) => {
    if (!canView) {
      message.warning("คุณไม่มีสิทธิ์ดูข้อมูลพนักงานรายนี้");
      return;
    }
      setSelectedRecord(record);
      setModalMode("view");
      setCurrentStep(0);
      form.resetFields();
      form.setFieldsValue(createEmployeeFormValues(record)
      );
      setModalOpen(true);
    },
    [canView,form,]
  );

  const handleEdit = useCallback((record) => {
    if (!canEdit) {
      message.warning(
        "คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานรายนี้"
      );
      return;
    }
      setSelectedRecord(record);
      setModalMode("edit");
      setCurrentStep(0);
      form.resetFields();
      form.setFieldsValue(createEmployeeFormValues(record));
      setModalOpen(true);
    },
    [canEdit,form,]
  );

  const handleEditFromView = useCallback(() => {
    if (!selectedRecord || !canEdit) {
      message.warning("คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานรายนี้");
      return;
    }
    setModalMode("edit");
  }, [selectedRecord,canEdit,]);

  const handleCloseModal =
    useCallback(() => {
      if (saving) {
        return;
      }

      setModalOpen(false);
      setSelectedRecord(null);
      setModalMode("create");
      setCurrentStep(0);

      form.resetFields();
    }, [
      saving,
      form,
    ]);

  const handlePreviousStep =
    useCallback(() => {
      setCurrentStep(
        (current) =>
          Math.max(
            current - 1,
            0
          )
      );
    }, []);

  const handleNextStep = useCallback(async () => {
      try {
        const fields =
          EMPLOYEE_STEP_FIELDS[
            currentStep
          ] || [];

        await form.validateFields(
          fields
        );

        /*
          Step องค์กร:
          ตรวจความสัมพันธ์เบื้องต้น
        */

        if (currentStep === 2) {
          const values =
            form.getFieldsValue([
              "company_id",
              "branch_id",
              "department_id",
              "position_id",
            ]);

          if (!values.company_id) {
            message.warning(
              "กรุณาเลือกบริษัท"
            );

            return;
          }

          if (!values.branch_id) {
            message.warning(
              "กรุณาเลือกสังกัด"
            );

            return;
          }

          if (!values.department_id) {
            message.warning(
              "กรุณาเลือกแผนก"
            );

            return;
          }

          if (!values.position_id) {
            message.warning(
              "กรุณาเลือกตำแหน่ง"
            );

            return;
          }
        }

        if (currentStep === 6) {
          const values =
            form.getFieldsValue([
              "create_user_account",
              "update_user_account",
              "role_id",
              "auth_email",
            ]);

          const accountEnabled = modalMode === "create"? Boolean(values.create_user_account): Boolean(values.update_user_account);

          if (accountEnabled &&!values.role_id) {
            message.warning("กรุณาเลือก Role");
            return;
          }

          if (accountEnabled && !cleanText(values.auth_email)) {
            message.warning(
              "กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ"
            );
            return;
          }
        }

        setCurrentStep(
          (current) =>
            Math.min(
              current + 1,
              LAST_WIZARD_STEP
            )
        );
      } catch (error) {
        if (error?.errorFields) {
          return;
        }

        console.error(
          "handleNextStep error:",
        error
      );
    }
  }, [currentStep,form,modalMode,]);

  const handleStepChange = useCallback(
    async (nextStep) => {
      if (
        nextStep < 0 ||
        nextStep >
          LAST_WIZARD_STEP
      ) {
        return;
      }

      if (
        modalMode === "view"
      ) {
        setCurrentStep(nextStep);
        return;
      }

      if (
        nextStep <
        currentStep
      ) {
        setCurrentStep(nextStep);
        return;
      }

      try {
        for (
          let step =
            currentStep;
          step < nextStep;
          step += 1
        ) {
          const fields =
            EMPLOYEE_STEP_FIELDS[
              step
            ] || [];

          if (
            fields.length
          ) {
            await form.validateFields(
              fields
            );
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

        console.error(
          "handleStepChange error:",
          error
        );
      }
    },
    [
      modalMode,
      currentStep,
      form,
    ]
  );

  const handlePhotoChange =
    useCallback(
      async (file) => {
        if (!file) {
          return;
        }

        if (
          !file.type?.startsWith(
            "image/"
          )
        ) {
          message.warning(
            "กรุณาเลือกไฟล์รูปภาพ"
          );

          return;
        }

        const maxSize =
          5 * 1024 * 1024;

        if (file.size > maxSize) {
          message.warning(
            "ไฟล์รูปพนักงานต้องไม่เกิน 5 MB"
          );

          return;
        }

        setUploadLoading(true);

        try {
          const previewUrl =
            URL.createObjectURL(file);

          form.setFieldsValue({
            employee_photo_path:
              null,

            employee_photo_url:
              previewUrl,

            employee_photo_file:
              file,
          });
        } finally {
          setUploadLoading(false);
        }
      },
      [form]
    );

  const handleSubmit = useCallback(async () => {

    if (modalMode === "view") {
      handleCloseModal();
      return;
    }

    if (modalMode === "create" && !canCreate) {
      message.warning(
        "คุณไม่มีสิทธิ์เพิ่มพนักงาน"
      );
      return;
    }

    if (modalMode === "edit" && (!selectedRecord || !canEdit)) {
      message.warning(
        "คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานรายนี้"
      );
      return;
    }

    const isEdit = modalMode === "edit";

    if (isEdit && !selectedRecord?.id) {
      message.error("ไม่พบรหัสพนักงานที่ต้องการแก้ไข");
      return;
    }

    try {
      await form.validateFields();

      const values = form.getFieldsValue(true);
      const payload =
        buildEmployeePayload(
          values,
          {
            mode:
              modalMode,

            selectedRecord,
          }
        );

      if (!payload.company_id) {
        message.warning(
          "กรุณาเลือกบริษัท"
        );

        setCurrentStep(2);

        return;
      }

      if (
        !payload.branch_id
      ) {
        message.warning(
          "กรุณาเลือกสังกัด"
        );

        setCurrentStep(2);

        return;
      }

      if (
        !payload.department_id
      ) {
        message.warning(
          "กรุณาเลือกแผนก"
        );

        setCurrentStep(2);

        return;
      }

      if (
        !payload.position_id
      ) {
        message.warning(
          "กรุณาเลือกตำแหน่ง"
        );

        setCurrentStep(2);

        return;
      }


      if (
        !payload
          .employment_type_id
      ) {
        message.warning(
          "กรุณาเลือกประเภทการจ้าง"
        );

        setCurrentStep(3);

        return;
      }

      if (
        !payload
          .employee_status_id
      ) {
        message.warning(
          "กรุณาเลือกสถานะพนักงาน"
        );

        setCurrentStep(3);

        return;
      }

      if (
        !payload.start_work_date
      ) {
        message.warning(
          "กรุณาเลือกวันที่เริ่มงาน"
        );

        setCurrentStep(3);

        return;
      }

      if (
        payload.status ===
          "resigned" &&
        !payload.resignation_date
      ) {
        message.warning(
          "พนักงานลาออกต้องระบุวันที่ลาออก"
        );

        setCurrentStep(3);

        return;
      }

      if (!isEdit) {
        if (
          !payload
            .employee_code_setting_id
        ) {
          message.warning(
            "กรุณาเลือกรูปแบบรหัสพนักงาน"
          );

          setCurrentStep(6);

          return;
        }

        if (
          !payload.employee_type
        ) {
          message.warning(
            "กรุณาเลือกประเภทสำหรับสร้างรหัสพนักงาน"
          );

          setCurrentStep(6);

          return;
        }

        if (
          !payload.running_date
        ) {
          message.warning(
            "กรุณาเลือกวันที่ Running"
          );

          setCurrentStep(6);

          return;
        }
      }

      const accountEnabled =
        isEdit
          ? Boolean(
              payload
                .update_user_account
            )
          : Boolean(
              payload
                .create_user_account
            );

      if (
        accountEnabled &&
        !payload.role_id
      ) {
        message.warning(
          "กรุณาเลือก Role"
        );

        setCurrentStep(6);

        return;
      }

      if (
        accountEnabled &&
        !payload.auth_email
      ) {
        message.warning(
          "กรุณากรอกอีเมลสำหรับเข้าสู่ระบบ"
        );

        setCurrentStep(6);

        return;
      }

      setSaving(true);

      const url =
        isEdit
          ? `/api/admin/employees/${selectedRecord.id}`
          : "/api/admin/employees";

      const response =
        await fetch(
          url,
          {
            method:
              isEdit
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      let result = null;

      try {
        result =
          await response.json();
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

      const initialLogin =
        result?.data
          ?.initial_login ||
        null;

      setModalOpen(false);

      setSelectedRecord(
        null
      );

      setModalMode(
        "create"
      );

      setCurrentStep(0);

      form.resetFields();

      if (
        !isEdit &&
        initialLogin
      ) {
        Modal.success({
          title:
            "สร้างพนักงานและบัญชีผู้ใช้งานสำเร็จ",

          centered: true,

          width: 520,

          content: (
            <div className="space-y-3">
              <p>
                {result?.message ||
                  "เพิ่มพนักงานเรียบร้อยแล้ว"}
              </p>

              <div className="rounded-lg bg-slate-50 p-4">
                <div>
                  Username:{" "}
                  <strong>
                    {
                      initialLogin
                        .username
                    }
                  </strong>
                </div>

                <div className="mt-2">
                  รหัสผ่านชั่วคราว:{" "}
                  <strong>
                    {
                      initialLogin
                        .temporary_password
                    }
                  </strong>
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
            (
              isEdit
                ? "แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว"
                : "เพิ่มพนักงานเรียบร้อยแล้ว"
            )
        );
      }

      if (
        !isEdit &&
        page !== 1
      ) {
        setPage(1);

        return;
      }

      await fetchEmployees();
    } catch (error) {
      if (
        error?.errorFields
      ) {
        const firstField =
          error
            .errorFields?.[0]
            ?.name?.[0];

        const stepEntry =
          Object.entries(
            EMPLOYEE_STEP_FIELDS
          ).find(
            ([, fields]) =>
              fields.includes(
                firstField
              )
          );

        if (stepEntry) {
          setCurrentStep(
            Number(
              stepEntry[0]
            )
          );
        }

        return;
      }

      console.error(
        "handleSubmit unexpected error:",
        error
      );

      message.error(
        error?.message ||
          "เกิดข้อผิดพลาดในการบันทึกข้อมูลพนักงาน"
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
  ]);

  const executeDelete =
    useCallback(
      async (record) => {
        setDeletingId(record.id);

        try {
          const response = await fetch(
            `/api/admin/employees/${record.id}`,
            {
              method: "DELETE",
            }
          );

          let result = null;

          try {
            result =
              await response.json();
          } catch {
            result = null;
          }

          if (!response.ok) {
            message.error(
              getApiMessage(
                result,
                "ไม่สามารถลบข้อมูลพนักงานได้"
              )
            );

            return;
          }

          message.success(
            result?.message ||
              "ลบข้อมูลพนักงานเรียบร้อยแล้ว"
          );

          if (
            employees.length === 1 &&
            page > 1
          ) {
            setPage(
              (current) =>
                Math.max(
                  current - 1,
                  1
                )
            );

            return;
          }

          await fetchEmployees();
        } catch (error) {
          console.error(
            "executeDelete error:",
            error
          );

          message.error(
            error?.message ||
              "เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน"
          );
        } finally {
          setDeletingId(null);
        }
      },
      [
        employees.length,
        page,
        fetchEmployees,
      ]
    );

  const handleDelete = useCallback((record) => {
      if (!canDelete) {
        message.warning(
          "คุณไม่มีสิทธิ์ลบข้อมูลพนักงาน"
        );
        return;
      }
      const account = getUserAccount(record);
      if (account?.roles ?.is_system === true) {
        message.warning(
          "ไม่สามารถลบพนักงานที่เชื่อมกับบัญชีระบบได้"
        );
        return;
      }

      Modal.confirm({
        title:"ยืนยันการลบพนักงาน",
        centered: true,
        width: 520,
        content: (
          <div>
            <p>
              ต้องการลบพนักงาน{" "}
              <strong>
                {record.employee_code}
              </strong>{" "}
              ใช่หรือไม่
            </p>

            <p className="mt-2 text-orange-600">
              หากพนักงานมีข้อมูลเงินเดือน สวัสดิการ
              ทักษะ หรือสายบังคับบัญชา
              ระบบจะไม่อนุญาตให้ลบ
            </p>
          </div>
        ),
        okText: "ลบ",
        cancelText: "ยกเลิก",
        okButtonProps: {
          danger: true,
        },
        onOk: async () => {
          await executeDelete(
            record
          );
        },
      });
    },
    [canDelete,executeDelete,]
  );

  const handleSearchChange = useCallback((value) => {
      setSearch(value);
  }, []);

  const handleCompanyChange = useCallback((value) => {
    setCompanyId(value || "");

    setBranchId("");
    setDepartmentId("");

    setPage(1);
  }, []);

  const handleBranchGroupChange = useCallback((value) => {
    setBranchGroupId(
      value || ""
    );

    setPage(1);
  }, []);

  const handleBranchChange  = useCallback((value) => {
    setBranchId(value || "");
    setDepartmentId("");

    setPage(1);
  }, []);

  const handleDepartmentChange = useCallback((value) => {
    setDepartmentId(
      value || ""
    );

    setPage(1);
  }, []);

  const handleEmployeeStatusChange = useCallback((value) => {
    setEmployeeStatusId(
      value || ""
    );

    setPage(1);
  }, []);

  const handleEmploymentTypeChange = useCallback((value) => {
    setEmploymentTypeId(
      value || ""
    );

    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setStatus(value || "");
    setPage(1);
  }, []);

  const handleHasUserAccountChange = useCallback((value) => {
    setHasUserAccount(
      value || ""
    );

    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");

    setCompanyId("");
    setBranchGroupId("");
    setBranchId("");
    setDepartmentId("");

    setEmployeeStatusId("");
    setEmploymentTypeId("");

    setStatus("");
    setHasUserAccount("");

    setPage(1);
  }, []);

  const handleTableChange = useCallback((
      pagination,
      filters,
      sorter
    ) => {
      const nextPage =
        pagination?.current || 1;

      const nextPageSize =
        pagination?.pageSize ||
        DEFAULT_PAGE_SIZE;

      if (
        nextPageSize !== pageSize
      ) {
        setPageSize(
          nextPageSize
        );

        setPage(1);

        return;
      }

      setPage(nextPage);
    },
    [pageSize]
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      fetchMasterData(),
      fetchEmployees(),
    ]);
  }, [
    fetchMasterData,
    fetchEmployees,
  ]);

  const canEditSelectedRecord = useMemo(() => {
    return Boolean(selectedRecord && canEdit);
  }, [selectedRecord,canEdit,]);

  if (authLoading) return <LoadingOrb />;
  if (!user || !canView) {
    return <LoadingOrb />;
  }

  return (
    <MasterLayout
      header={
        <>
          <MasterPageHeader
            icon={
              <TeamOutlined className="text-blue-600" />
            }
            title="พนักงาน"
            subtitle="จัดการข้อมูลพนักงาน โครงสร้างองค์กร การจ้างงาน Payroll บัญชีผู้ใช้งาน Role และ Permission"
            loading={loading}
            canRefresh
            canCreate={canCreate}
            createText="เพิ่มพนักงาน"
            onRefresh={handleRefresh}
            onCreate={handleCreate}
          />
          <PageInfoAlert
            title="Employee Wizard"
            description="ระบบจะสร้างรหัสพนักงานจาก Employee Code Setting และ Running Number แบบ Atomic จากนั้นใช้รหัสพนักงานเป็น Username และรหัสผ่านชั่วคราว พร้อมผูก Role ซึ่งสามารถมีหลาย Permission ผ่าน role_permissions"
          />
        </>
      }

      search={
        <EmployeeSearch
          search={search}
          companyId={companyId}
          branchGroupId={
            branchGroupId
          }
          branchId={branchId}
          departmentId={
            departmentId
          }
          employeeStatusId={
            employeeStatusId
          }
          employmentTypeId={
            employmentTypeId
          }
          status={status}
          hasUserAccount={
            hasUserAccount
          }
          companies={
            scopedMasterData.companies
          }
          branchGroups={
            scopedMasterData.branchGroups
          }
          branches={
            scopedMasterData.branches
          }
          departments={
            scopedMasterData.departments
          }
          employeeStatuses={
            masterData.employeeStatuses
          }
          employmentTypes={
            masterData.employmentTypes
          }
          loading={loading}
          masterLoading={
            masterLoading
          }
          onSearchChange={
            handleSearchChange
          }
          onCompanyChange={
            handleCompanyChange
          }
          onBranchGroupChange={
            handleBranchGroupChange
          }
          onBranchChange={
            handleBranchChange
          }
          onDepartmentChange={
            handleDepartmentChange
          }
          onEmployeeStatusChange={
            handleEmployeeStatusChange
          }
          onEmploymentTypeChange={
            handleEmploymentTypeChange
          }
          onStatusChange={
            handleStatusChange
          }
          onHasUserAccountChange={
            handleHasUserAccountChange
          }
          onClear={
            handleClearFilters
          }
          onRefresh={
            handleRefresh
          }
        />
      }

      summary={
        <EmployeeSummaryCards
          summary={summary}
          loading={loading}
        />
      }

      table={
        <>
          <div className="mt-6">
            <EmployeeTable
              dataSource={employees}
              loading={loading}
              deletingId={deletingId}

              page={page}
              pageSize={pageSize}
              total={total}

              canView={canView}
              canEdit={canEdit}
              canDelete={canDelete}

              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}

              onChange={handleTableChange}
            />
          </div>
        </>
      }

      modal={
        <EmployeeWizardModal
          open={modalOpen}
          title={modalTitle}
          mode={modalMode}
          form={form}
          currentStep={
            currentStep
          }
          saving={saving}
          disabled={
            modalDisabled
          }
          canEdit={
            canEditSelectedRecord
          }
          selectedRecord={
            selectedRecord
          }
          masterData={
            scopedMasterData
          }
          masterLoading={
            masterLoading
          }
          uploadLoading={
            uploadLoading
          }
          onCancel={
            handleCloseModal
          }
          onSubmit={
            handleSubmit
          }
          onEdit={
            handleEditFromView
          }
          onPrevious={
            handlePreviousStep
          }
          onNext={
            handleNextStep
          }
          onStepChange={
            handleStepChange
          }
          onPhotoChange={
            handlePhotoChange
          }
        />
      }
    />
  );
}