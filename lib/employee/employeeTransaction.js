import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  getEmployeeFullNameTh,
} from "./employeePayload";

import {
  validateEmployeeOrganization,
} from "./employeeOrganization";

import {
  validateEmployeePayroll,
} from "./employeePayroll";

import {
  reserveEmployeeCode,
} from "./employeeCodeGenerator";

/* =========================================================
   EMPLOYEE DETAIL SELECT
========================================================= */

export const EMPLOYEE_DETAIL_SELECT = `
  id,
  employee_code,

  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,

  position_family_id,
  position_level_id,
  position_id,
  job_id,

  business_unit_id,
  cost_center_id,
  profit_center_id,

  supervisor_employee_id,
  management_assignment_id,
  current_assignment_id,

  title_id,

  first_name_th,
  middle_name_th,
  last_name_th,

  first_name_en,
  middle_name_en,
  last_name_en,

  nick_name,
  nickname_th,
  nickname_en,

  gender,
  gender_id,

  marital_status_id,
  religion_id,

  nationality,
  nationality_id,
  country_id,

  birth_date,
  birth_place,
  birth_province_code,
  birth_district_code,
  birth_subdistrict_code,
  birth_postcode,
  blood_group,

  citizen_id,
  passport_no,
  passport_expire_date,

  tax_id,
  social_security_no,

  phone,
  mobile_phone,
  home_phone,
  work_phone,

  email,
  personal_email,
  work_email,
  line_id,

  employment_type,
  employment_type_id,
  employee_status_id,

  hire_date,
  start_work_date,

  probation_days,
  probation_end_date,
  probation_status,

  confirmation_date,
  termination_date,
  resignation_date,
  retirement_date,

  payroll_company_id,
  payroll_type_id,
  payroll_group_id,
  position_level_band_id,

  employee_type_digit,
  employee_year_2d,
  employee_running_no,

  employment_no,
  external_employee_id,
  attendance_no,
  biometric_no,
  employee_card_no,

  employee_photo_path,
  employee_photo_url,

  signature_path,
  signature_url,

  status,
  remark,

  created_by,
  updated_by,
  created_at,
  updated_at,

  companies:companies!employees_company_id_fkey (
    id,
    company_code,
    company_name_th,
    company_name_en
  ),

  branch_groups:branch_groups!employees_branch_group_id_fkey (
    id,
    group_code,
    group_name,
    group_color,
    status
  ),

  branches:branches!employees_branch_id_fkey (
    id,
    company_id,
    branch_code,
    branch_name,
    status
  ),

  departments:departments!employees_department_id_fkey (
    id,
    department_code,
    department_name,
    status
  ),

  divisions:divisions!employees_division_id_fkey (
    id,
    department_id,
    division_code,
    division_name,
    status
  ),

  units:units!employees_unit_id_fkey (
    id,
    division_id,
    unit_code,
    unit_name,
    status
  ),

  position_families:position_families!employees_position_family_id_fkey (
    id,
    family_code,
    family_name,
    description,
    status,
    sort_order
  ),

  position_levels:position_levels!employees_position_level_id_fkey (
    id,
    level_code,
    level_name,
    description,
    status,
    sort_order
  ),

  positions:positions!employees_position_id_fkey (
    id,
    position_code,
    position_name,
    short_name,
    description,
    position_group,
    position_family_id,
    job_id,
    is_manager,
    is_executive,
    allow_multiple_assignment,
    status,
    sort_order
  ),

  jobs:jobs!employees_job_id_fkey (
    id
  ),

  business_units:business_units!employees_business_unit_id_fkey (
    id
  ),

  cost_centers:cost_centers!employees_cost_center_id_fkey (
    id
  ),

  profit_centers:profit_centers!employees_profit_center_id_fkey (
    id
  ),



  titles:titles!employees_title_id_fkey (
    id
  ),

  genders:genders!employees_gender_id_fkey (
    id
  ),

  marital_statuses:marital_statuses!employees_marital_status_id_fkey (
    id
  ),

  religions:religions!employees_religion_id_fkey (
    id
  ),

  nationalities:nationalities!employees_nationality_id_fkey (
    id
  ),

  countries:countries!employees_country_id_fkey (
    id
  ),

  employment_types:employment_types!employees_employment_type_id_fkey (
    id
  ),

  employee_statuses:employee_statuses!employees_employee_status_id_fkey (
    id,
    status_code,
    status_name,
    color,
    status
  ),

  payroll_companies:payroll_companies!employees_payroll_company_id_fkey (
    id
  ),

  payroll_types:payroll_types!employees_payroll_type_id_fkey (
    id,
    payroll_type_code,
    payroll_type_name,
    payment_frequency,
    status
  ),

  payroll_groups:payroll_groups!employees_payroll_group_id_fkey (
    id
  ),

  position_level_bands:position_level_bands!employees_position_level_band_id_fkey (
    id,
    position_level_id,
    band_code,
    band_name,
    step_no,
    currency,
    salary_min,
    salary_mid,
    salary_max,
    annual_min,
    annual_mid,
    annual_max,
    target_bonus_percent,
    merit_increase_percent,
    overtime_rate,
    allowance_amount,
    effective_date,
    expire_date,
    remark,
    sort_order,
    status
  ),

  user_accounts:user_accounts!user_accounts_employee_id_fkey (
    id,
    auth_user_id,
    employee_id,
    username,
    role_id,
    is_active,
    last_login_at,
    created_at,
    updated_at,

    roles:roles!user_accounts_role_id_fkey (
      id,
      role_code,
      role_name,
      is_active,
      is_system
    )
  )
`;

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function success(
  data,
  message
) {
  return {
    success: true,
    status: 201,
    message,
    data,
  };
}

function failure(
  message,
  status = 500,
  error = null
) {
  return {
    success: false,
    status,
    message,
    error,
    data: null,
  };
}

/* =========================================================
   DATABASE ERROR
========================================================= */

export function mapEmployeeDatabaseError(
  error
) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

  if (error.code === "23505") {
    if (
      error.message?.includes(
        "employees_employee_code_key"
      )
    ) {
      return "รหัสพนักงานนี้มีอยู่แล้ว";
    }

    if (
      error.message?.includes(
        "uq_employees_external"
      )
    ) {
      return "External Employee ID นี้มีอยู่แล้ว";
    }

    if (
      error.message?.includes(
        "user_accounts_username_key"
      )
    ) {
      return "Username นี้มีอยู่แล้ว";
    }

    if (
      error.message?.includes(
        "user_accounts_employee_id_key"
      )
    ) {
      return "พนักงานนี้มีบัญชีผู้ใช้งานแล้ว";
    }

    if (
      error.message?.includes(
        "user_accounts_auth_user_id_key"
      )
    ) {
      return "Supabase Auth User นี้ถูกเชื่อมกับบัญชีอื่นแล้ว";
    }

    return "พบข้อมูลซ้ำในระบบ";
  }

  if (error.code === "23503") {
    return "ไม่พบข้อมูล Master ที่อ้างอิง กรุณาตรวจสอบข้อมูลอีกครั้ง";
  }

  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  if (error.code === "23502") {
    return "ข้อมูลที่จำเป็นไม่ครบถ้วน";
  }

  if (error.code === "22P02") {
    return "รูปแบบ UUID หรือข้อมูลที่ส่งมาไม่ถูกต้อง";
  }

  if (error.code === "42703") {
    return `ไม่พบคอลัมน์ในฐานข้อมูล: ${
      error.message || "-"
    }`;
  }

  if (error.code === "PGRST200") {
    return `ไม่พบความสัมพันธ์ของตารางใน Schema Cache: ${
      error.message || "-"
    }`;
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

/* =========================================================
   ROLE VALIDATION
========================================================= */

async function validateRole(
  roleId
) {
  if (!roleId) {
    return failure(
      "กรุณาเลือกบทบาทผู้ใช้งาน",
      400
    );
  }

  const {
    data,
    error,
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
      roleId
    )
    .maybeSingle();

  if (error) {
    return failure(
      "ไม่สามารถตรวจสอบบทบาทผู้ใช้งานได้",
      500,
      error
    );
  }

  if (!data) {
    return failure(
      "ไม่พบบทบาทผู้ใช้งานที่เลือก",
      404
    );
  }

  if (!data.is_active) {
    return failure(
      "บทบาทผู้ใช้งานไม่ได้เปิดใช้งาน",
      400
    );
  }

  return {
    success: true,
    data,
  };
}

/* =========================================================
   INITIAL COMPENSATION VALIDATION
========================================================= */

function normalizeBaseSalary(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const normalized = Number(
    String(value).replaceAll(",", "")
  );

  if (!Number.isFinite(normalized)) {
    return null;
  }

  return normalized;
}

async function validateInitialCompensation({
  employee,
  compensation,
}) {
  const baseSalary =
    normalizeBaseSalary(
      compensation?.base_salary
    );

  if (
    baseSalary === null ||
    baseSalary < 0
  ) {
    return failure(
      "กรุณาระบุเงินเดือนฐานให้ถูกต้อง",
      400
    );
  }

  if (
    !employee.position_level_band_id
  ) {
    return failure(
      "กรุณาเลือก Salary Band",
      400
    );
  }

  const {
    data: salaryBand,
    error: salaryBandError,
  } = await supabaseAdmin
    .from("position_level_bands")
    .select(
      `
        id,
        position_level_id,
        band_code,
        band_name,
        currency,
        salary_min,
        salary_mid,
        salary_max,
        effective_date,
        expire_date,
        status
      `
    )
    .eq(
      "id",
      employee.position_level_band_id
    )
    .maybeSingle();

  if (salaryBandError) {
    return failure(
      "ไม่สามารถตรวจสอบ Salary Band ได้",
      500,
      salaryBandError
    );
  }

  if (!salaryBand) {
    return failure(
      "ไม่พบ Salary Band ที่เลือก",
      404
    );
  }

  if (
    salaryBand.status !== "active"
  ) {
    return failure(
      "Salary Band ที่เลือกไม่ได้เปิดใช้งาน",
      400
    );
  }

  if (
    employee.position_level_id &&
    salaryBand.position_level_id !==
      employee.position_level_id
  ) {
    return failure(
      "Salary Band ไม่ตรงกับระดับตำแหน่งที่เลือก",
      400
    );
  }

  return {
    success: true,
    data: {
      base_salary: baseSalary,
      salary_band: salaryBand,
    },
  };
}

async function insertInitialCompensation({
  employeeId,
  employee,
  baseSalary,
  salaryBand,
}) {
  const now =
    new Date().toISOString();

  const effectiveFrom =
    employee.start_work_date ||
    employee.hire_date ||
    now.slice(0, 10);

  const payload = {
    employee_id:
      employeeId,

    salary_structure_id:
      employee.salary_structure_id ||
      null,

    position_id:
      employee.position_id ||
      null,

    position_level_id:
      employee.position_level_id ||
      null,

    position_level_band_id:
      salaryBand.id,

    payroll_company_id:
      employee.payroll_company_id ||
      null,

    payroll_type_id:
      employee.payroll_type_id ||
      null,

    payroll_group_id:
      employee.payroll_group_id ||
      null,

    currency_code:
      salaryBand.currency ||
      "THB",

    base_salary:
      baseSalary,

    band_min_snapshot:
      salaryBand.salary_min ??
      null,

    band_mid_snapshot:
      salaryBand.salary_mid ??
      null,

    band_max_snapshot:
      salaryBand.salary_max ??
      null,

    effective_from:
      effectiveFrom,

    effective_to: null,

    source_type:
      "initial",

    source_adjustment_id:
      null,

    status:
      "active",

    reason:
      "Initial employee compensation",

    remark: null,

    created_at:
      now,

    updated_at:
      now,
  };

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("employee_compensations")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return failure(
      "ไม่สามารถบันทึกเงินเดือนฐานเริ่มต้นได้",
      error.code === "23505"
        ? 409
        : error.code === "23503" ||
            error.code === "23514" ||
            error.code === "23502" ||
            error.code === "22P02"
          ? 400
          : 500,
      error
    );
  }

  return {
    success: true,
    data,
  };
}

/* =========================================================
   ROLLBACK HELPERS
========================================================= */

async function rollbackAuthUser(
  authUserId
) {
  if (!authUserId) {
    return;
  }

  const { error } =
    await supabaseAdmin.auth.admin.deleteUser(
      authUserId
    );

  if (error) {
    console.error(
      "rollbackAuthUser error:",
      error
    );
  }
}

async function rollbackEmployeeCompensation(
  compensationId
) {
  if (!compensationId) {
    return;
  }

  const { error } =
    await supabaseAdmin
      .from("employee_compensations")
      .delete()
      .eq(
        "id",
        compensationId
      );

  if (error) {
    console.error(
      "rollbackEmployeeCompensation error:",
      error
    );
  }
}

async function rollbackEmployee(
  employeeId
) {
  if (!employeeId) {
    return;
  }

  const { error } =
    await supabaseAdmin
      .from("employees")
      .delete()
      .eq(
        "id",
        employeeId
      );

  if (error) {
    console.error(
      "rollbackEmployee error:",
      error
    );
  }
}

/* =========================================================
   BUILD EMPLOYEE INSERT PAYLOAD
========================================================= */

function buildEmployeeInsertPayload({
  employee,
  codeData,
}) {
  return {
    ...employee,

    employee_code:
      codeData.employee_code,

    employee_type_digit:
      codeData.employee_type_digit,

    employee_year_2d:
      codeData.employee_year_2d,

    employee_running_no:
      codeData.employee_running_no,

    /*
      Legacy compatibility
    */

    nick_name:
      employee.nickname_th ||
      employee.nick_name ||
      null,

    gender:
      employee.gender || null,

    phone:
      employee.mobile_phone ||
      employee.phone ||
      null,

    email:
      employee.work_email ||
      employee.personal_email ||
      employee.email ||
      null,

    hire_date:
      employee.start_work_date ||
      employee.hire_date ||
      null,

    employment_type:
      employee.employment_type ||
      null,

    nationality:
      employee.nationality ||
      null,

    updated_at:
      new Date().toISOString(),
  };
}

/* =========================================================
   CREATE EMPLOYEE TRANSACTION
========================================================= */

export async function createEmployeeTransaction({
  employee,
  account,
  codeRequest,
  compensation,
}) {
  let authUserId = null;
  let employeeId = null;
  let compensationId = null;

  try {
    /* -----------------------------------------------------
       Validate organization
    ----------------------------------------------------- */

    const organizationResult =
      await validateEmployeeOrganization(
        employee
      );

    if (
      !organizationResult.success
    ) {
      return failure(
        organizationResult.message,
        organizationResult.status ||
          400,
        organizationResult.error
      );
    }

    /*
      Organization validator อาจ Resolve
      job_id หรือค่าความสัมพันธ์บางส่วนกลับมา
    */

    if (
      organizationResult.data
        ?.resolvedJobId &&
      !employee.job_id
    ) {
      employee.job_id =
        organizationResult.data
          .resolvedJobId;
    }

    /* -----------------------------------------------------
       Validate payroll
    ----------------------------------------------------- */

    const payrollResult =
      await validateEmployeePayroll(
        employee
      );

    if (!payrollResult.success) {
      return failure(
        payrollResult.message,
        payrollResult.status ||
          400,
        payrollResult.error
      );
    }

    /* -----------------------------------------------------
       Validate initial compensation

       Salary Band ต้องสัมพันธ์กับ Position Level
       และ Base Salary ต้องเป็นตัวเลข >= 0
    ----------------------------------------------------- */

    const compensationResult =
      await validateInitialCompensation({
        employee,
        compensation,
      });

    if (!compensationResult.success) {
      return compensationResult;
    }

    const baseSalary =
      compensationResult.data
        .base_salary;

    const salaryBand =
      compensationResult.data
        .salary_band;

    /* -----------------------------------------------------
       Validate role

       user_accounts เก็บ role_id เดียว
       Role เชื่อมหลาย Permission ผ่าน role_permissions
    ----------------------------------------------------- */

    let role = null;

    if (
      account.create_user_account
    ) {
      const roleResult =
        await validateRole(
          account.role_id
        );

      if (!roleResult.success) {
        return roleResult;
      }

      role = roleResult.data;
    }

    /* -----------------------------------------------------
       Reserve employee code
    ----------------------------------------------------- */

    const codeResult =
      await reserveEmployeeCode({
        companyId:
          employee.company_id,

        settingId:
          codeRequest
            .employee_code_setting_id,

        employeeType:
          codeRequest.employee_type,

        runningDate:
          codeRequest.running_date,
      });

    if (!codeResult.success) {
      return failure(
        codeResult.message,
        codeResult.status || 500,
        codeResult.error
      );
    }

    const codeData =
      codeResult.data;

    /* -----------------------------------------------------
       Create password hash and Supabase Auth User

       Username = employee_code
       Temporary password = employee_code
    ----------------------------------------------------- */

    let passwordHash = null;

    if (
      account.create_user_account
    ) {
      passwordHash =
        await bcrypt.hash(
          codeData.employee_code,
          12
        );

      const {
        data: authData,
        error: authError,
      } =
        await supabaseAdmin.auth.admin.createUser(
          {
            email:
              account.auth_email,

            password:
              codeData.employee_code,

            email_confirm: true,

            user_metadata: {
              employee_code:
                codeData.employee_code,

              full_name_th:
                getEmployeeFullNameTh(
                  employee
                ),

              role_id:
                account.role_id,

              role_code:
                role?.role_code ||
                null,

              must_change_password:
                true,
            },
          }
        );

      if (authError) {
        console.error(
          "Create Supabase auth user error:",
          authError
        );

        return failure(
          authError.message
            ?.toLowerCase()
            ?.includes("already")
            ? "อีเมลนี้มีบัญชีผู้ใช้งานอยู่แล้ว"
            : "ไม่สามารถสร้างบัญชี Supabase Auth ได้",
          authError.message
            ?.toLowerCase()
            ?.includes("already")
            ? 409
            : 500,
          authError
        );
      }

      authUserId =
        authData?.user?.id ||
        null;

      if (!authUserId) {
        return failure(
          "ไม่พบ Auth User ID หลังสร้างบัญชี",
          500
        );
      }
    }

    /* -----------------------------------------------------
       Insert employee
    ----------------------------------------------------- */

    const employeeInsertPayload =
      buildEmployeeInsertPayload({
        employee,
        codeData,
      });

    const {
      data: insertedEmployee,
      error: employeeError,
    } = await supabaseAdmin
      .from("employees")
      .insert(
        employeeInsertPayload
      )
      .select(
        EMPLOYEE_DETAIL_SELECT
      )
      .single();

    if (employeeError) {
      console.error(
        "Insert employee error:",
        employeeError
      );

      await rollbackAuthUser(
        authUserId
      );

      return failure(
        mapEmployeeDatabaseError(
          employeeError
        ),
        employeeError.code ===
          "23505"
          ? 409
          : employeeError.code ===
                "23503" ||
              employeeError.code ===
                "23514" ||
              employeeError.code ===
                "23502" ||
              employeeError.code ===
                "22P02"
            ? 400
            : 500,
        employeeError
      );
    }

    employeeId =
      insertedEmployee.id;

    /* -----------------------------------------------------
       Insert initial employee compensation

       employee_compensations เป็นประวัติค่าตอบแทน
       จึงบันทึกเงินเดือนฐานเริ่มต้นหลัง Employee มี ID แล้ว
    ----------------------------------------------------- */

    const initialCompensationResult =
      await insertInitialCompensation({
        employeeId,
        employee,
        baseSalary,
        salaryBand,
      });

    if (!initialCompensationResult.success) {
      await rollbackEmployee(
        employeeId
      );

      await rollbackAuthUser(
        authUserId
      );

      return initialCompensationResult;
    }

    const insertedCompensation =
      initialCompensationResult.data;

    compensationId =
      insertedCompensation.id;

    /* -----------------------------------------------------
       Insert user account
    ----------------------------------------------------- */

    let insertedAccount = null;

    if (
      account.create_user_account
    ) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("user_accounts")
        .insert({
          auth_user_id:
            authUserId,

          employee_id:
            employeeId,

          username:
            codeData.employee_code,

          password_hash:
            passwordHash,

          role_id:
            account.role_id,

          is_active:
            account.is_active,

          updated_at:
            new Date().toISOString(),
        })
        .select(
          `
            id,
            auth_user_id,
            employee_id,
            username,
            role_id,
            is_active,
            last_login_at,
            created_at,
            updated_at,

            roles:roles!user_accounts_role_id_fkey (
              id,
              role_code,
              role_name,
              is_active,
              is_system
            )
          `
        )
        .single();

      if (error) {
        console.error(
          "Insert user account error:",
          error
        );

        await rollbackEmployeeCompensation(
          compensationId
        );

        await rollbackEmployee(
          employeeId
        );

        await rollbackAuthUser(
          authUserId
        );

        return failure(
          mapEmployeeDatabaseError(
            error
          ),
          error.code === "23505"
            ? 409
            : error.code ===
                  "23503" ||
                error.code ===
                  "23514" ||
                error.code ===
                  "23502" ||
                error.code ===
                  "22P02"
              ? 400
              : 500,
          error
        );
      }

      insertedAccount = data;
    }

    /* -----------------------------------------------------
       Activity log
    ----------------------------------------------------- */

    try {
      await writeActivityLog({
        moduleName:
          "employees",

        actionType:
          "CREATE",

        referenceTable:
          "employees",

        referenceId:
          employeeId,

        description:
          `เพิ่มพนักงาน ${codeData.employee_code} ${getEmployeeFullNameTh(
            employee
          )}`,

        oldData: null,

        newData: {
          employee:
            insertedEmployee,

          user_account:
            insertedAccount,

          initial_compensation:
            insertedCompensation,

          account_created:
            Boolean(
              account.create_user_account
            ),

          role_id:
            account.role_id ||
            null,

          employee_running_id:
            codeData
              .employee_running_id ||
            null,

          position_architecture: {
            position_family_id:
              employee
                .position_family_id ||
              null,

            position_level_id:
              employee
                .position_level_id ||
              null,

            position_id:
              employee.position_id ||
              null,

            job_id:
              employee.job_id ||
              null,

            position_level_band_id:
              employee
                .position_level_band_id ||
              null,
          },

          /*
            ห้ามบันทึก Temporary Password
            และ password_hash ลง Activity Log
          */
        },
      });
    } catch (logError) {
      console.error(
        "Write employee activity log error:",
        logError
      );
    }

    return success(
      {
        employee:
          insertedEmployee,

        user_account:
          insertedAccount,

        initial_compensation:
          insertedCompensation,

        role,

        payroll:
          payrollResult.data ||
          null,

        initial_login:
          account.create_user_account
            ? {
                username:
                  codeData.employee_code,

                temporary_password:
                  codeData.employee_code,

                must_change_password:
                  true,
              }
            : null,
      },
      account.create_user_account
        ? "เพิ่มพนักงานและสร้างบัญชีผู้ใช้งานเรียบร้อยแล้ว"
        : "เพิ่มพนักงานเรียบร้อยแล้ว"
    );
  } catch (error) {
    console.error(
      "createEmployeeTransaction exception:",
      error
    );

    if (compensationId) {
      await rollbackEmployeeCompensation(
        compensationId
      );
    }

    if (employeeId) {
      await rollbackEmployee(
        employeeId
      );
    }

    if (authUserId) {
      await rollbackAuthUser(
        authUserId
      );
    }

    return failure(
      "เกิดข้อผิดพลาดในการเพิ่มพนักงาน",
      500,
      error
    );
  }
}