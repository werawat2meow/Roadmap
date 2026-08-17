import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  normalizeEmployeePayload,
  normalizeAccountPayload,
  getEmployeeFullNameTh,
  cleanText,
} from "@/lib/employee/employeePayload";

import {
  validateEmployeePayload,
  validateAccountPayload,
} from "@/lib/employee/employeeValidation";

import {
  validateEmployeeOrganization,
} from "@/lib/employee/employeeOrganization";

import {
  validateEmployeePayroll,
} from "@/lib/employee/employeePayroll";

import {
  EMPLOYEE_DETAIL_SELECT,
  mapEmployeeDatabaseError,
} from "@/lib/employee/employeeTransaction";

import {requireScopedAccess,} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_EMPLOYEE_STATUSES = [
  "active",
  "inactive",
  "resigned",
];

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function successResponse(
  data,
  {
    status = 200,
    message = null,
    meta = null,
  } = {}
) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
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
    response.error = error;
  }

  if (details) {
    response.details = details;
  }

  return NextResponse.json(
    response,
    {
      status,
    }
  );
}

function cleanBoolean(
  value,
  fallback = false
) {
  if (typeof value === "boolean") {
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

function getErrorStatus(error) {
  if (!error) {
    return 500;
  }

  if (error.code === "23505") {
    return 409;
  }

  if (
    error.code === "23503" ||
    error.code === "23514" ||
    error.code === "22P02"
  ) {
    return 400;
  }

  return 500;
}

/* =========================================================
   LOAD EMPLOYEE
========================================================= */

async function getEmployeeById(id) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("employees")
    .select(
      EMPLOYEE_DETAIL_SELECT
    )
    .eq("id", id)
    .maybeSingle();

  return {
    data,
    error,
  };
}

/* =========================================================
   LOAD USER ACCOUNT
========================================================= */

async function getUserAccountByEmployeeId(
  employeeId
) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("user_accounts")
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

        roles:role_id (
          id,
          role_code,
          role_name,
          is_active,
          is_system
        )
      `
    )
    .eq(
      "employee_id",
      employeeId
    )
    .maybeSingle();

  return {
    data,
    error,
  };
}

/* =========================================================
   VALIDATE ROLE
========================================================= */

async function validateRole(roleId) {
  if (!roleId) {
    return {
      success: false,
      status: 400,
      message:
        "กรุณาเลือกบทบาทผู้ใช้งาน",
    };
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
    .eq("id", roleId)
    .maybeSingle();

  if (error) {
    return {
      success: false,
      status: 500,
      message:
        "ไม่สามารถตรวจสอบบทบาทผู้ใช้งานได้",
      error,
    };
  }

  if (!data) {
    return {
      success: false,
      status: 404,
      message:
        "ไม่พบบทบาทผู้ใช้งานที่เลือก",
    };
  }

  if (!data.is_active) {
    return {
      success: false,
      status: 400,
      message:
        "บทบาทผู้ใช้งานนี้ไม่ได้เปิดใช้งาน",
    };
  }

  return {
    success: true,
    data,
  };
}

/* =========================================================
   DUPLICATE CHECK
========================================================= */

async function checkEmployeeDuplicates({
  employeeId,
  employee,
}) {
  const checks = [
    {
      field: "citizen_id",
      value: employee.citizen_id,
      message:
        "เลขบัตรประชาชนนี้มีอยู่ในระบบแล้ว",
    },
    {
      field: "passport_no",
      value: employee.passport_no,
      message:
        "เลขหนังสือเดินทางนี้มีอยู่ในระบบแล้ว",
    },
    {
      field: "work_email",
      value: employee.work_email,
      message:
        "อีเมลบริษัทนี้มีอยู่ในระบบแล้ว",
      caseInsensitive: true,
    },
  ];

  for (const check of checks) {
    if (!check.value) {
      continue;
    }

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
      .neq("id", employeeId);

    if (check.caseInsensitive) {
      query = query.ilike(
        check.field,
        check.value
      );
    } else {
      query = query.eq(
        check.field,
        check.value
      );
    }

    const {
      data,
      error,
    } = await query
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        status: 500,
        message:
          `ไม่สามารถตรวจสอบข้อมูลซ้ำของ ${check.field} ได้`,
        error,
      };
    }

    if (data) {
      return {
        success: false,
        status: 409,
        message:
          check.message,
        duplicate: {
          field:
            check.field,

          employee_id:
            data.id,

          employee_code:
            data.employee_code,
        },
      };
    }
  }

  return {
    success: true,
  };
}

/* =========================================================
   BUILD UPDATE PAYLOAD
========================================================= */

function buildEmployeeUpdatePayload(
  employee,
  current
) {
  return {
    company_id:
      employee.company_id,

    branch_group_id:
      employee.branch_group_id,

    branch_id:
      employee.branch_id,

    department_id:
      employee.department_id,

    division_id:
      employee.division_id,

    unit_id:
      employee.unit_id,

    position_id:
      employee.position_id,

    job_id:
      employee.job_id,

    business_unit_id:
      employee.business_unit_id,

    cost_center_id:
      employee.cost_center_id,

    profit_center_id:
      employee.profit_center_id,

    current_assignment_id:
      employee.current_assignment_id,

    title_id:
      employee.title_id,

    first_name_th:
      employee.first_name_th,

    middle_name_th:
      employee.middle_name_th,

    last_name_th:
      employee.last_name_th,

    first_name_en:
      employee.first_name_en,

    middle_name_en:
      employee.middle_name_en,

    last_name_en:
      employee.last_name_en,

    nickname_th:
      employee.nickname_th,

    nickname_en:
      employee.nickname_en,

    gender_id:
      employee.gender_id,

    birth_province_code:
      employee.birth_province_code,

    birth_district_code:
      employee.birth_district_code,

    birth_subdistrict_code:
      employee.birth_subdistrict_code,

    birth_postcode:
      employee.birth_postcode,

    marital_status_id:
      employee.marital_status_id,

    religion_id:
      employee.religion_id,

    nationality_id:
      employee.nationality_id,

    country_id:
      employee.country_id,

    birth_date:
      employee.birth_date,

    birth_place:
      employee.birth_place,

    blood_group:
      employee.blood_group,

    citizen_id:
      employee.citizen_id,

    passport_no:
      employee.passport_no,

    passport_expire_date:
      employee.passport_expire_date,

    tax_id:
      employee.tax_id,

    social_security_no:
      employee.social_security_no,

    mobile_phone:
      employee.mobile_phone,

    home_phone:
      employee.home_phone,

    work_phone:
      employee.work_phone,

    personal_email:
      employee.personal_email,

    work_email:
      employee.work_email,

    line_id:
      employee.line_id,

    employment_type_id:
      employee.employment_type_id,

    employee_status_id:
      employee.employee_status_id,

    start_work_date:
      employee.start_work_date,

    probation_days:
      employee.probation_days,

    probation_end_date:
      employee.probation_end_date,

    probation_status:
      employee.probation_status,

    confirmation_date:
      employee.confirmation_date,

    termination_date:
      employee.termination_date,

    resignation_date:
      employee.resignation_date,

    retirement_date:
      employee.retirement_date,

    payroll_company_id:
      employee.payroll_company_id,

    payroll_type_id:
      employee.payroll_type_id,

    payroll_group_id:
      employee.payroll_group_id,

    salary_structure_id:
      employee.salary_structure_id,

    employee_photo_path:
      employee.employee_photo_path,

    employee_photo_url:
      employee.employee_photo_url,

    signature_path:
      employee.signature_path,

    signature_url:
      employee.signature_url,

    status:
      employee.status,

    remark:
      employee.remark,

    updated_by:
      employee.updated_by,

    updated_at:
      new Date().toISOString(),

    /*
      Legacy compatibility columns
    */

    first_name_en:
      employee.first_name_en,

    last_name_en:
      employee.last_name_en,

    nick_name:
      employee.nickname_th,

    phone:
      employee.mobile_phone,

    email:
      employee.work_email ||
      employee.personal_email,

    hire_date:
      employee.start_work_date,

    /*
      ห้ามเปลี่ยนผ่าน PATCH

      employee_code
      employee_type_digit
      employee_year_2d
      employee_running_no
    */
  };
}

/* =========================================================
   GET /api/admin/employees/[id]
========================================================= */

export async function GET(req,{ params }) {
  try {
    const guard =
      await requireScopedAccess(
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

    const { id } = await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสพนักงาน",
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await getEmployeeById(id);

    if (error) {
      console.error(
        "GET employee/[id] error:",
        error
      );

      return errorResponse(
        "ไม่สามารถโหลดรายละเอียดพนักงานได้",
        {
          status: getErrorStatus(error),
          error: mapEmployeeDatabaseError(error),
        }
      );
    }

    if (!data) {
      return errorResponse(
        "ไม่พบข้อมูลพนักงาน",
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       SELF + SCOPE

       - Self: ดูรายละเอียดตัวเองได้เมื่อมี ems.employees.view
       - Other employee: ต้องผ่าน Employee Scope
       - ไม่ขยายสิทธิ์ PATCH / DELETE
    ===================================================== */

    const isSelf =
      Boolean(currentEmployeeId) &&
      String(data.id) ===
        String(currentEmployeeId);

    if (
      !isSelf &&
      !guard.canAccessEmployee(data)
    ) {
      return errorResponse(
        "คุณไม่มีสิทธิ์ดูข้อมูลพนักงานรายนี้",
        {
          status: 403,
        }
      );
    }

    return successResponse(data, {
      meta: {
        access: {
          isSelf,
          rule: isSelf
            ? "SELF"
            : "SCOPE",
        },
      },
    });
  } catch (error) {
    console.error(
      "GET employee/[id] exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการโหลดรายละเอียดพนักงาน",
      {
        status: 500,
        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}

/* =========================================================
   PATCH /api/admin/employees/[id]

   Permission:
   ems.employees.edit

   Scope:
   Employee Organization Scope

   ตรวจ 2 รอบ:
   1. พนักงานเดิม ต้องอยู่ใน Scope
   2. Organization ใหม่หลังแก้ ต้องอยู่ใน Scope
========================================================= */

export async function PATCH(req,{ params }) {
  try {
    /* =====================================================
       1. Permission + Employee Scope
    ===================================================== */

    const guard =
      await requireScopedAccess(
        "ems.employees",
        "edit"
      );

    if (!guard.ok) {
      return guard.response;
    }

    /* =====================================================
       2. Params
    ===================================================== */

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสพนักงาน",
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       3. Request Body
    ===================================================== */

    let body = null;

    try {
      body =
        await req.json();
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
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Request Body ต้องเป็น Object",
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       4. Load Current Employee
    ===================================================== */

    const {
      data: current,
      error: currentError,
    } =
      await getEmployeeById(
        id
      );

    if (currentError) {
      return errorResponse(
        "ไม่สามารถโหลดข้อมูลพนักงานเดิมได้",
        {
          status:
            getErrorStatus(
              currentError
            ),

          error:
            mapEmployeeDatabaseError(
              currentError
            ),
        }
      );
    }

    if (!current) {
      return errorResponse(
        "ไม่พบข้อมูลพนักงาน",
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       5. Check Current Employee Scope

       User ต้องมี:
       ems.employees.edit

       และพนักงานเดิมต้องอยู่ใน Scope เช่น
       - company
       - branch_group
       - branch
       - department
       - division
       - unit

       SUPER_ADMIN / has_all_scope
       จะผ่านอัตโนมัติ
    ===================================================== */

    if (
      !guard.canAccessEmployee(
        current
      )
    ) {
      return errorResponse(
        "คุณไม่มีสิทธิ์แก้ไขพนักงานรายนี้",
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       6. Merge Current + Request

       รองรับ PATCH บาง Field
    ===================================================== */

    const mergedBody = {
      ...current,
      ...body,

      /*
       * ห้ามแก้ Employee Code
       * และ Running Number ผ่าน PATCH
       */

      employee_code:
        current.employee_code,

      employee_type_digit:
        current.employee_type_digit,

      employee_year_2d:
        current.employee_year_2d,

      employee_running_no:
        current.employee_running_no,
    };

    /* =====================================================
       7. Normalize Employee
    ===================================================== */

    const employee =
      normalizeEmployeePayload(
        mergedBody
      );

    /* =====================================================
       8. Validate Employee
    ===================================================== */

    const validationError =
      validateEmployeePayload(
        employee
      );

    if (validationError) {
      return errorResponse(
        validationError,
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_EMPLOYEE_STATUSES.includes(
        employee.status
      )
    ) {
      return errorResponse(
        "สถานะพนักงานไม่ถูกต้อง",
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       9. Validate Organization

       ตรวจว่า:
       Branch
       Department
       Division
       Unit
       ฯลฯ

       เชื่อมโยงกันถูกต้องจริง
    ===================================================== */

    const organizationResult = await validateEmployeeOrganization(employee);
    if (!organizationResult.success) {
      return errorResponse(
        organizationResult.message,
        {
          status: 400,

          error:
            organizationResult
              .error
              ?.message ||
            null,
        }
      );
    }

    /* =====================================================
       10. Check NEW Organization Scope

       สำคัญมาก

       User อาจมีสิทธิ์แก้ Employee เดิม
       แต่ห้ามย้าย Employee ไป Organization
       ที่ตัวเองไม่มี Scope

       ตัวอย่าง:

       User Scope = Company A

       Employee เดิม = Company A ✅

       Request เปลี่ยนไป:
       Branch ของ Company B ❌
    ===================================================== */

    if (
      !guard.canAccessEmployee(
        employee
      )
    ) {
      return errorResponse(
        "คุณไม่มีสิทธิ์ย้ายหรือแก้ไขพนักงานไปยังขอบเขตองค์กรที่เลือก",
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       11. Duplicate Validation
    ===================================================== */

    const duplicateResult =
      await checkEmployeeDuplicates({
        employeeId: id,
        employee,
      });

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
            null,
        }
      );
    }

    /* =====================================================
       12. Validate Payroll
    ===================================================== */

    const payrollResult =
      await validateEmployeePayroll(
        employee
      );

    if (
      !payrollResult.success
    ) {
      return errorResponse(
        payrollResult.message,
        {
          status: 400,

          error:
            payrollResult.error
              ?.message ||
            null,
        }
      );
    }

    /* =====================================================
       13. Build Update Payload
    ===================================================== */

    const updatePayload =
      buildEmployeeUpdatePayload(
        employee,
        current
      );

    /* =====================================================
       14. Update Employee

       เพิ่ม Scope ซ้ำใน UPDATE ด้วยไม่ได้
       เพราะ Employee Scope เป็นหลาย Column

       Security ถูกตรวจด้วย
       canAccessEmployee(current)
       ด้านบนเรียบร้อยแล้ว
    ===================================================== */

    const {
      data:
        updatedEmployee,
      error:
        updateError,
    } =
      await supabaseAdmin
        .from("employees")
        .update(
          updatePayload
        )
        .eq(
          "id",
          id
        )
        .select(
          EMPLOYEE_DETAIL_SELECT
        )
        .single();

    if (updateError) {
      console.error(
        "PATCH employee update error:",
        updateError
      );

      return errorResponse(
        mapEmployeeDatabaseError(
          updateError
        ),
        {
          status:
            getErrorStatus(
              updateError
            ),

          error:
            updateError.message,
        }
      );
    }

    /* =====================================================
       15. User Account Update

       update_user_account:
       true
       = แก้ไขบัญชีผู้ใช้งาน

       false
       = ไม่แตะบัญชี
    ===================================================== */

    const updateUserAccount =
      cleanBoolean(
        body.update_user_account,
        false
      );

    let updatedAccount =
      null;

    if (
      updateUserAccount
    ) {
      const account =
        normalizeAccountPayload({
          ...mergedBody,
          ...body,

          create_user_account:
            true,
        });

      /* ===================================================
         Validate Account
      =================================================== */

      const accountValidationError =
        validateAccountPayload(
          account
        );

      if (
        accountValidationError
      ) {
        return errorResponse(
          accountValidationError,
          {
            status: 400,
          }
        );
      }

      /* ===================================================
         Validate Role
      =================================================== */

      const roleResult =
        await validateRole(
          account.role_id
        );

      if (
        !roleResult.success
      ) {
        return errorResponse(
          roleResult.message,
          {
            status:
              roleResult.status ||
              400,

            error:
              roleResult.error
                ?.message ||
              null,
          }
        );
      }

      /* ===================================================
         Load Current User Account
      =================================================== */

      const {
        data:
          currentAccount,
        error:
          accountLoadError,
      } =
        await getUserAccountByEmployeeId(
          id
        );

      if (
        accountLoadError
      ) {
        return errorResponse(
          "ไม่สามารถโหลดบัญชีผู้ใช้งานเดิมได้",
          {
            status: 500,

            error:
              accountLoadError.message,
          }
        );
      }

      /*
       * ถ้ายังไม่มี User Account
       * ไม่สร้างอัตโนมัติใน PATCH นี้
       */

      if (!currentAccount) {
        return errorResponse(
          "พนักงานนี้ยังไม่มีบัญชีผู้ใช้งาน กรุณาใช้ฟังก์ชันสร้างบัญชีผู้ใช้งาน",
          {
            status: 409,
          }
        );
      }

      /* ===================================================
         Update User Account
      =================================================== */

      const accountPayload = {
        role_id:
          account.role_id,

        is_active:
          account.is_active,

        updated_at:
          new Date()
            .toISOString(),
      };

      const {
        data,
        error,
      } =
        await supabaseAdmin
          .from(
            "user_accounts"
          )
          .update(
            accountPayload
          )
          .eq(
            "id",
            currentAccount.id
          )
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

              roles:role_id (
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
          "Update user account error:",
          error
        );

        return errorResponse(
          mapEmployeeDatabaseError(
            error
          ),
          {
            status:
              getErrorStatus(
                error
              ),

            error:
              error.message,
          }
        );
      }

      updatedAccount =
        data;

      /* ===================================================
         Sync Supabase Auth Metadata
      =================================================== */

      if (
        currentAccount
          .auth_user_id
      ) {
        const {
          error:
            authUpdateError,
        } =
          await supabaseAdmin
            .auth
            .admin
            .updateUserById(
              currentAccount
                .auth_user_id,
              {
                user_metadata: {
                  employee_code:
                    current
                      .employee_code,

                  full_name_th:
                    getEmployeeFullNameTh(
                      employee
                    ),

                  role_id:
                    roleResult
                      .data
                      .id,

                  role_code:
                    roleResult
                      .data
                      .role_code,

                  must_change_password:
                    true,
                },
              }
            );

        if (
          authUpdateError
        ) {
          console.error(
            "Update auth metadata error:",
            authUpdateError
          );
        }
      }
    }

    /* =====================================================
       16. Activity Log
    ===================================================== */

    try {
      await writeActivityLog({
        moduleName:
          "employees",

        actionType:
          "UPDATE",

        referenceTable:
          "employees",

        referenceId:
          id,

        description:
          `แก้ไขพนักงาน ${current.employee_code} ${getEmployeeFullNameTh(
            employee
          )}`,

        oldData: {
          employee:
            current,
        },

        newData: {
          employee:
            updatedEmployee,

          user_account:
            updatedAccount,

          account_updated:
            updateUserAccount,
        },
      });
    } catch (
      logError
    ) {
      console.error(
        "Write employee update log error:",
        logError
      );
    }

    /* =====================================================
       17. Response
    ===================================================== */

    return successResponse(
      {
        employee:updatedEmployee,
        user_account: updatedAccount,
      },
      {
        message:
          updateUserAccount
            ? "แก้ไขข้อมูลพนักงานและบัญชีผู้ใช้งานเรียบร้อยแล้ว"
            : "แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
      console.error("PATCH employee/[id] exception:",error
    );
    return errorResponse(
      "เกิดข้อผิดพลาดในการแก้ไขข้อมูลพนักงาน",
      {
        status: 500,
        error:error?.message || "Unknown error",
      }
    );
  }
}


/* =========================================================
   DELETE /api/admin/employees/[id]

   Permission:
   ems.employees.delete

   Scope:
   Employee Organization Scope

   company_id
   branch_group_id
   branch_id
   department_id
   division_id
   unit_id
========================================================= */

export async function DELETE(req,{ params }) {
  try {
    /* =====================================================
       1. Permission + Employee Scope
    ===================================================== */

    const guard = await requireScopedAccess("ems.employees","delete");
    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;
    if (!id) {
      return errorResponse(
        "ไม่พบรหัสพนักงาน",
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       3. Query Params
    ===================================================== */

    const {searchParams,} = new URL(req.url);
    const forceDelete = cleanBoolean(searchParams.get("force"),false);
    const deleteAuthUser = cleanBoolean(searchParams.get("delete_auth_user"),true);

    /* =====================================================
       4. Load Employee

       ต้องโหลด Employee ก่อน
       เพื่อ:
       - ตรวจว่ามีจริง
       - ตรวจ Scope
       - Activity Log
    ===================================================== */

    const {data: current,error: currentError,} = await getEmployeeById(id);

    if (currentError) {
      return errorResponse(
        "ไม่สามารถตรวจสอบข้อมูลพนักงานก่อนลบได้",
        {
          status:
            getErrorStatus(
              currentError
            ),

          error:
            mapEmployeeDatabaseError(
              currentError
            ),
        }
      );
    }

    if (!current) {
      return errorResponse(
        "ไม่พบข้อมูลพนักงาน",
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       5. Employee Scope Check

       Permission:
       ems.employees.delete

       และ Employee ต้องอยู่ในขอบเขตที่ User ดูแล

       เช่น:
       Company
       Branch Group
       Branch
       Department
       Division
       Unit

       SUPER_ADMIN / has_all_scope
       ผ่านอัตโนมัติ
    ===================================================== */

    if (!guard.canAccessEmployee(current)) {
      return errorResponse(
        "คุณไม่มีสิทธิ์ลบพนักงานรายนี้",
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       6. Protected Account

       ป้องกัน Employee
       ที่เชื่อมกับ System Account
    ===================================================== */

    const {data: account,error: accountError,} =
      await getUserAccountByEmployeeId(
        id
      );

    if (accountError) {
      return errorResponse(
        "ไม่สามารถตรวจสอบบัญชีผู้ใช้งานก่อนลบได้",
        {
          status: 500,

          error:
            accountError.message,
        }
      );
    }

    if (account?.roles?.is_system) {
      return errorResponse(
        "ไม่สามารถลบพนักงานที่เชื่อมกับบัญชีระบบได้",
        {
          status: 403,
        }
      );
    }

    /* =====================================================
       7. Dependency Checks

       ตรวจข้อมูลที่อ้างอิง Employee
       ก่อน Hard Delete
    ===================================================== */

    const dependencyChecks =
      [
        {
          table:
            "management_assignments",

          column:
            "employee_id",

          label:
            "สายบังคับบัญชา",
        },

        {
          table:
            "management_assignments",

          column:
            "supervisor_employee_id",

          label:
            "ผู้บังคับบัญชา",
        },

        {
          table:
            "employee_compensations",

          column:
            "employee_id",

          label:
            "โครงสร้างเงินเดือนพนักงาน",
        },

        {
          table:
            "employee_skills",

          column:
            "employee_id",

          label:
            "ทักษะรายบุคคล",
        },

        {
          table:
            "benefit_entitlements",

          column:
            "employee_id",

          label:
            "สิทธิสวัสดิการ",
        },

        {
          table:
            "benefit_requests",

          column:
            "employee_id",

          label:
            "คำขอสวัสดิการ",
        },
      ];

    const dependencies = [];

    /* =====================================================
       8. Check Each Dependency
    ===================================================== */

    for (const check of dependencyChecks) {
      const {count,error,} = await supabaseAdmin
          .from(
            check.table
          )
          .select(
            "id",
            {
              count:
                "exact",

              head: true,
            }
          )
          .eq(
            check.column,
            id
          );

      /*
       * บาง Project
       * อาจยังไม่มี Future Table
       *
       * 42P01
       * = relation does not exist
       */

      if (error) {
        if (
          error.code ===
            "42P01" ||
          error.message
            ?.toLowerCase()
            .includes(
              "does not exist"
            )
        ) {
          continue;
        }

        console.error(
          `Dependency check ${check.table} error:`,
          error
        );

        return errorResponse(
          `ไม่สามารถตรวจสอบข้อมูล ${check.label} ได้`,
          {
            status: 500,

            error:
              error.message,
          }
        );
      }

      if (
        Number(
          count || 0
        ) > 0
      ) {
        dependencies.push(
          {
            table:
              check.table,

            label:
              check.label,

            count:
              Number(
                count || 0
              ),
          }
        );
      }
    }

    /* =====================================================
       9. Prevent Delete If Dependencies Exist
    ===================================================== */

    if (dependencies.length > 0 && !forceDelete) {
      return errorResponse(
        "ไม่สามารถลบพนักงานที่มีข้อมูลอ้างอิงอยู่ กรุณาเปลี่ยนสถานะเป็นลาออกหรือไม่ใช้งานแทน",
        {
          status: 409,

          details: {
            dependencies,

            recommendation:
              "เปลี่ยน status เป็น resigned หรือ inactive",
          },
        }
      );
    }

    /* =====================================================
       10. Delete User Account

       ลบ User Account ก่อน
       เพื่อไม่ให้เหลือบัญชี orphan

       หมายเหตุ:
       account.roles.is_system
       ถูกป้องกันไว้ด้านบนแล้ว
    ===================================================== */

    let userAccountDeleted = false;

    if (account?.id) {
      const {
        error:
          deleteAccountError,
      } =
        await supabaseAdmin
          .from(
            "user_accounts"
          )
          .delete()
          .eq(
            "id",
            account.id
          );

      if (
        deleteAccountError
      ) {
        console.error(
          "Delete user account error:",
          deleteAccountError
        );

        return errorResponse(
          "ไม่สามารถลบบัญชีผู้ใช้งานของพนักงานได้",
          {
            status:
              getErrorStatus(
                deleteAccountError
              ),

            error:
              mapEmployeeDatabaseError(
                deleteAccountError
              ),
          }
        );
      }

      userAccountDeleted =
        true;
    }

    /* =====================================================
       11. Delete Employee
    ===================================================== */

    const {
      error:
        deleteEmployeeError,
    } =
      await supabaseAdmin
        .from("employees")
        .delete()
        .eq(
          "id",
          id
        );

    if (
      deleteEmployeeError
    ) {
      console.error(
        "Delete employee error:",
        deleteEmployeeError
      );

      /*
       * Foreign Key Constraint
       *
       * เผื่อยังมี Table อื่น
       * ที่ไม่ได้อยู่ใน dependencyChecks
       */
      if (
        deleteEmployeeError.code ===
        "23503"
      ) {
        return errorResponse(
          "ไม่สามารถลบพนักงานได้ เนื่องจากยังมีข้อมูลอื่นอ้างอิงพนักงานรายนี้อยู่",
          {
            status: 409,

            error:
              deleteEmployeeError.message,
          }
        );
      }

      return errorResponse(
        mapEmployeeDatabaseError(
          deleteEmployeeError
        ),
        {
          status:
            getErrorStatus(
              deleteEmployeeError
            ),

          error:
            deleteEmployeeError
              .message,
        }
      );
    }

    /* =====================================================
       12. Delete Supabase Auth User

       Employee + User Account
       ถูกลบเรียบร้อยแล้ว

       ถ้า Auth ลบไม่ได้
       จะ Log Error
       แต่ไม่ Rollback Employee
    ===================================================== */

    let authUserDeleted =
      false;

    if (
      deleteAuthUser &&
      account?.auth_user_id
    ) {
      const {
        error:
          authDeleteError,
      } =
        await supabaseAdmin
          .auth
          .admin
          .deleteUser(
            account.auth_user_id
          );

      if (
        authDeleteError
      ) {
        console.error(
          "Delete auth user error:",
          authDeleteError
        );
      } else {
        authUserDeleted =
          true;
      }
    }

    try {
      await writeActivityLog({
        moduleName:"employees",
        actionType:"DELETE",
        referenceTable:"employees",
        referenceId:id,
        description: `ลบพนักงาน ${current.employee_code} ${getEmployeeFullNameTh(current)}`,

        oldData: {
          employee:current,
          user_account:account,
          dependencies,
          force_delete:forceDelete,
          delete_auth_user:deleteAuthUser,
        },
        newData: null,
      });
    } catch (
      logError
    ) {
      console.error("Write employee delete log error:",logError);
    }

    return successResponse(
      {
        id,
        employee_code:current.employee_code,
        user_account_deleted:userAccountDeleted,
        auth_user_deleted:authUserDeleted,
      },
      {
        message:"ลบข้อมูลพนักงานเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error("DELETE employee/[id] exception:",error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน",
      {
        status: 500,
        error:error?.message || "Unknown error",
      }
    );
  }
}