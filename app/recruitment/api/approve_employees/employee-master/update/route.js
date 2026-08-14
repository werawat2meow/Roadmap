import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserIdFromRequest } from "@/app/recruitment/lib/getUserId";
import { cleanText } from "@/lib/employee/employeePayload";
import { writeActivityLog } from "@/lib/activityLogger";

const EMPLOYEE_CODE_RPC = "reserve_employee_code";

// ------------------------------------------------------------
// AppError: error ที่ตั้งใจให้ message แสดงต่อผู้ใช้ได้โดยตรง
// (แยกจาก error ดิบของ Supabase/Postgres ที่ไม่ควรหลุดออกไป)
// ------------------------------------------------------------
class AppError extends Error {
  constructor(message) {
    super(message);
    this.isSafeMessage = true;
  }
}

/**
 * ============================================================
 * Function: updateRecruitJobInterviewStatus
 * อัปเดตสถานะ recruit_job_interviews ก่อน update
 * recruit_job_applications ทุกครั้ง
 * ============================================================
 */
async function updateRecruitJobInterviewStatus({
  applicationId,
  status,
}) {
  const { error } = await supabaseAdmin
    .from("recruit_job_interviews")
    .update({
      status,
    })
    .eq("application_id", applicationId);

  if (error) {
    console.error("UPDATE RECRUIT JOB INTERVIEW ERROR:", error);
    throw new AppError("ไม่สามารถอัปเดตสถานะการสัมภาษณ์ได้");
  }
}

function calculateProbationEndDate(startDate, probationDays = 119) {
  const date = new Date(startDate);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("วันที่เริ่มงานไม่ถูกต้อง");
  }

  date.setDate(date.getDate() + probationDays);

  return date.toISOString().split("T")[0];
}

/**
 * ============================================================
 * Function: createEmployee
 * ============================================================
 */
async function createEmployee({ employeeData, userId }) {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .insert(employeeData)
    .select()
    .single();

  if (error) {
    console.error("INSERT EMPLOYEE ERROR:", error);
    throw error;
  }

  return data;
}

/**
 * ============================================================
 * Function: createUserAccount
 * ============================================================
 */
async function createUserAccount({ employee, roleId, isActive = true }) {
  const employeeId = employee.id;
  const username = employee.employee_code;

  if (!username) {
    throw new AppError("ไม่พบ Employee Code สำหรับสร้าง Username");
  }

  // ----------------------------------------------------------
  // Check username ซ้ำ
  // ----------------------------------------------------------
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from("user_accounts")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingUserError) {
    console.error("CHECK EXISTING USERNAME ERROR:", existingUserError);
    throw new AppError("ไม่สามารถตรวจสอบ Username ได้");
  }

  if (existingUser) {
    throw new AppError("Username นี้มีอยู่แล้ว");
  }

  // ----------------------------------------------------------
  // Check employee_id ซ้ำ
  // ----------------------------------------------------------
  const { data: existingEmployee, error: existingEmployeeError } =
    await supabaseAdmin
      .from("user_accounts")
      .select("id")
      .eq("employee_id", employeeId)
      .maybeSingle();

  if (existingEmployeeError) {
    console.error("CHECK EXISTING EMPLOYEE ERROR:", existingEmployeeError);
    throw new AppError("ไม่สามารถตรวจสอบบัญชีผู้ใช้งานของพนักงานได้");
  }

  if (existingEmployee) {
    throw new AppError("พนักงานคนนี้มีบัญชีผู้ใช้งานแล้ว");
  }

  // ----------------------------------------------------------
  // Password
  // หมายเหตุ: ตั้งใจใช้ employee_code เป็นรหัสผ่านเริ่มต้น
  // เนื่องจากบังคับให้พนักงานเปลี่ยนรหัสผ่านตอนเข้าระบบครั้งแรก
  // ----------------------------------------------------------
  const hashedPassword = await bcrypt.hash(username, 10);

  const fakeEmail = `${username.toLowerCase()}_${Date.now()}@local.user`;

  // ----------------------------------------------------------
  // Create Supabase Auth User
  // ----------------------------------------------------------
  const { data: createdAuthUser, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password: username,
      email_confirm: true,
      user_metadata: {
        username,
        employee_id: employeeId,
      },
    });

  if (authError) {
    const message = authError.message || "";

    if (message.toLowerCase().includes("already been registered")) {
      throw new AppError(
        "บัญชี auth ของ Username นี้มีอยู่แล้วในระบบ กรุณาใช้ Username อื่น"
      );
    }

    console.error("CREATE AUTH USER ERROR:", authError);
    throw new AppError("ไม่สามารถสร้างบัญชีผู้ใช้งานได้");
  }

  const authUserId = createdAuthUser.user?.id;

  if (!authUserId) {
    throw new AppError("ไม่สามารถสร้าง auth user ได้");
  }

  // ----------------------------------------------------------
  // Insert user_accounts
  // ----------------------------------------------------------
  const { data, error } = await supabaseAdmin
    .from("user_accounts")
    .insert([
      {
        auth_user_id: authUserId,
        employee_id: employeeId,
        role_id: roleId,
        username,
        is_active: isActive,
        password_hash: hashedPassword,
      },
    ])
    .select(
      `
      id,
      auth_user_id,
      employee_id,
      role_id,
      username,
      is_active,
      last_login_at,
      created_at,
      employees (
        employee_code,
        first_name_th,
        last_name_th
      ),
      roles (
        role_code,
        role_name
      )
    `
    )
    .single();

  // ----------------------------------------------------------
  // ถ้า insert user_accounts ไม่สำเร็จ ให้ลบ Auth User ที่เพิ่งสร้าง
  // ----------------------------------------------------------
  if (error) {
    console.error("INSERT USER_ACCOUNTS ERROR:", error);
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    throw error;
  }

  return data;
}

/**
 * ============================================================
 * Function: rollbackEmployeeCreation
 * ลบ employee / user_account / auth user ที่สร้างไปแล้ว
 * เมื่อขั้นตอนถัดไป (update application, activity log ฯลฯ) ล้มเหลว
 * ============================================================
 */
async function rollbackEmployeeCreation({ employee, userAccount }) {
  try {
    if (userAccount) {
      await supabaseAdmin
        .from("user_accounts")
        .delete()
        .eq("id", userAccount.id);

      if (userAccount.auth_user_id) {
        await supabaseAdmin.auth.admin.deleteUser(userAccount.auth_user_id);
      }
    }

    if (employee) {
      await supabaseAdmin.from("employees").delete().eq("id", employee.id);
    }
  } catch (rollbackError) {
    // rollback fail ไม่ควรบดบัง error ตั้งต้น แต่ต้อง log ไว้เพื่อตรวจสอบ manual
    console.error("ROLLBACK EMPLOYEE CREATION FAILED:", rollbackError);
  }
}

/**
 * ============================================================
 * POST
 * ============================================================
 */
export async function POST(request) {
  const userId = await getUserIdFromRequest();

  try {
    const body = await request.json();

    const {
      application_id,
      status: submittedStatus,
      next_status,
      reason,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      position_level_id,
      start_date,
      base_salary,
      position_allowance,
      living_allowance,
      special_allowance,
      fuel_allowance,
      incentive_type,
      incentive_amount,
      oc,
      phone_allowance,
      additional_cost,
      employment_type,
      employment_type_id,
      role_id,
      payroll_types,
      position_family_id,
      job_id,
    } = body;

    // ========================================================
    // Validation
    // ========================================================
    if( submittedStatus !== 17 ){
      
      if (!branch_id) {
        return NextResponse.json(
          { message: "กรุณาเลือก Branch" },
          { status: 400 }
        );
      }

      if (!department_id) {
        return NextResponse.json(
          { message: "กรุณาเลือก Department" },
          { status: 400 }
        );
      }

      if (!division_id) {
        return NextResponse.json(
          { message: "กรุณาเลือก Division" },
          { status: 400 }
        );
      }

      if (!unit_id) {
        return NextResponse.json(
          { message: "กรุณาเลือก Unit" },
          { status: 400 }
        );
      }

      if (!position_id) {
        return NextResponse.json(
          { message: "กรุณาเลือก Position" },
          { status: 400 }
        );
      }

      if (!position_level_id) {
        return NextResponse.json(
          { message: "กรุณาเลือก Position Level" },
          { status: 400 }
        );
      }

      if (!employment_type) {
        return NextResponse.json(
          { message: "ประเภทสำหรับสร้างรหัส" },
          { status: 400 }
        );
      }

      if (!employment_type_id) {
        return NextResponse.json(
          { message: "กรุณาเลือกประเภทการจ้างงาน" },
          { status: 400 }
        );
      }
    }
    
    if (!application_id) {
      return NextResponse.json(
        { message: "ไม่พบ Application ID" },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { message: "กรุณาระบุวันที่เริ่มงาน" },
        { status: 400 }
      );
    }

    // ========================================================
    // Get Recruitment Application
    // ========================================================

    const {
      data: get_data_emp_recrut,
      error: get_data_emp_recrut_error,
    } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("*")
      .eq("id", application_id)
      .single();

    if (get_data_emp_recrut_error) {
      console.error(
        "GET RECRUIT APPLICATION ERROR:",
        get_data_emp_recrut_error
      );
      throw new AppError("ไม่สามารถดึงข้อมูลผู้สมัครได้");
    }

    if (!get_data_emp_recrut) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลผู้สมัคร" },
        { status: 404 }
      );
    }

    // ========================================================
    // Staleness check: status ที่ frontend ส่งมา (จากตอนโหลดหน้า)
    // ต้องตรงกับ status ล่าสุดใน DB ณ ตอนที่เรียก API นี้
    // ป้องกันกรณีเปิดหน้าค้างไว้แล้วสถานะถูกเปลี่ยนไปแล้วโดยที่ไม่รู้ตัว
    // หมายเหตุ: ใช้เพื่อ validate เท่านั้น ตัวตัดสินใจ branch logic ด้านล่าง
    // ยังคงอิงจาก get_data_emp_recrut.status (ค่าจริงจาก DB) เสมอ
    // ========================================================

    if (
      submittedStatus !== undefined &&
      submittedStatus !== null &&
      Number(submittedStatus) !== Number(get_data_emp_recrut.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "สถานะของใบสมัครมีการเปลี่ยนแปลงไปแล้ว กรุณาโหลดข้อมูลใหม่อีกครั้ง",
        },
        { status: 409 }
      );
    }

    // ========================================================
    // status = 13/14: ไม่มาทำงาน / เลื่อนวันที่เริ่มงาน
    // อัปเดตเฉพาะ recruit_job_applications (ไม่สร้าง employee/user account)
    // ========================================================

    if (
      Number(get_data_emp_recrut.status) === 13 ||
      Number(get_data_emp_recrut.status) === 14
    ) {
      if (!start_date) {
        return NextResponse.json(
          { message: "กรุณาระบุวันที่เริ่มงาน" },
          { status: 400 }
        );
      }

      const rescheduleUpdatePayload = { start_date };

      if (reason !== undefined && reason !== null && String(reason).trim() !== "") {
        rescheduleUpdatePayload.status_reason = reason;
      }

      await updateRecruitJobInterviewStatus({
        applicationId: application_id,
        status: Number(get_data_emp_recrut.status),
      });

      const { error: updateRescheduleError } = await supabaseAdmin
        .from("recruit_job_applications")
        .update(rescheduleUpdatePayload)
        .eq("id", application_id);

      if (updateRescheduleError) {
        console.error(
          "UPDATE APPLICATION (STATUS 13/14) ERROR:",
          updateRescheduleError
        );
        return NextResponse.json(
          { success: false, message: "ไม่สามารถอัปเดตข้อมูลใบสมัครได้" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "อัปเดตวันที่เริ่มงานเรียบร้อยแล้ว",
        },
        { status: 200 }
      );
    }

    // ========================================================
    // รอบแรก: status = 12
    // อัปเดตข้อมูลใบสมัคร แล้วเปลี่ยน status เป็น 17
    // เพื่อรอให้ระบบเรียก API นี้อีกครั้งเพื่อยืนยันสร้างพนักงานจริง
    // ========================================================

    if (Number(get_data_emp_recrut.status) === 12) {

      // ========================================================
      // Get Company
      // ========================================================
      const { data: get_data_company, error: get_data_company_error } = await supabaseAdmin.from("branches").select("*").eq("id", branch_id).single();

      if (get_data_company_error) {
        console.error("GET COMPANY ERROR:", get_data_company_error);
        throw new AppError("ไม่สามารถดึงข้อมูล Branch ได้");
      }

      const { data: get_data_payroll_companies, error: get_data_payroll_companies_error } = await supabaseAdmin.from("payroll_companies").select("*").eq("company_id", get_data_company.company_id).single();

      if (get_data_payroll_companies_error) {
        console.error("GET COMPANY ERROR:", get_data_payroll_companies_error);
        throw new AppError("ไม่สามารถดึงข้อมูล payrol ได้");
      }

      const probationDays = 119;
      const probationEndDate = calculateProbationEndDate(
        start_date,
        probationDays
      );

      const application_data = {
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        position_level_id,
        start_date,
        base_salary,
        position_allowance,
        living_allowance,
        special_allowance,
        fuel_allowance,
        incentive_type,
        incentive_amount,
        oc,
        phone_allowance,
        employment_type,
        employment_type_id,
        employee_status_id: "21e6539f-159c-4ea8-a63a-817c97563785",
        probation_days: 119,
        probation_end_date: probationEndDate,
        probation_status: "probation",
        company_id: get_data_company.company_id,
        branch_group_id: get_data_company.group_id,
        payroll_company_id: get_data_payroll_companies.id,
        payroll_type_id: payroll_types,
        position_family_id,
        last_job_id: job_id,
        status: 17,
      };

      await updateRecruitJobInterviewStatus({
        applicationId: application_id,
        status: 17,
      });

      const { error } = await supabaseAdmin
        .from("recruit_job_applications")
        .update(application_data)
        .eq("id", application_id);

      if (error) {
        console.error("UPDATE APPLICATION ERROR:", error);
        return NextResponse.json(
          { message: "ไม่สามารถอัปเดตข้อมูลใบสมัครได้" },
          { status: 500 }
        );
      }

      // กัน additional_cost undefined / ไม่ใช่ array
      if (Array.isArray(additional_cost) && additional_cost.length > 0) {
        const additionalCostRows = additional_cost.map((element) => ({
          application_id,
          topic: element.name,
          amount: element.amount,
        }));

        const { error: additionalCostError } = await supabaseAdmin
          .from("recruit_additional_cost")
          .insert(additionalCostRows);

        if (additionalCostError) {
          console.error(
            "INSERT ADDITIONAL COST ERROR:",
            additionalCostError
          );
          throw new AppError("ไม่สามารถบันทึกค่าใช้จ่ายเพิ่มเติมได้");
        }
      }
    }

    // ========================================================
    // รอบสอง: status = 17
    // ให้เลือกว่าจะ:
    //   - next_status 13/14: เลื่อนวันเริ่มงาน / ไม่มาทำงาน (พร้อมเหตุผล)
    //     -> อัปเดตแค่ recruit_job_applications
    //   - next_status 15 (หรือไม่ส่งมา = ค่า default เพื่อ backward compat):
    //     -> ยืนยันเข้าฐานข้อมูลกลาง สร้าง Employee + User Account จริง
    // ========================================================

    if (Number(get_data_emp_recrut.status) === 17) {
      const resolvedNextStatus = next_status ? Number(next_status) : 15;

      // --------------------------------------------------------
      // เลือกเลื่อนวันเริ่มงาน (13) หรือ ไม่มาทำงาน (14)
      // --------------------------------------------------------
      if (resolvedNextStatus === 13 || resolvedNextStatus === 14) {
        if (!reason || !String(reason).trim()) {
          return NextResponse.json(
            { message: "กรุณาระบุเหตุผล" },
            { status: 400 }
          );
        }

        if (!start_date) {
          return NextResponse.json(
            { message: "กรุณาระบุวันที่เริ่มงาน" },
            { status: 400 }
          );
        }

        await updateRecruitJobInterviewStatus({
          applicationId: application_id,
          status: Number(resolvedNextStatus),
        });

        const { error: updateToRescheduleError } = await supabaseAdmin
          .from("recruit_job_applications")
          .update({
            status: resolvedNextStatus,
            start_date,
            status_reason: reason,
          })
          .eq("id", application_id);

        if (updateToRescheduleError) {
          console.error(
            "UPDATE APPLICATION (17 -> 13/14) ERROR:",
            updateToRescheduleError
          );
          return NextResponse.json(
            { success: false, message: "ไม่สามารถอัปเดตข้อมูลใบสมัครได้" },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            message: "บันทึกข้อมูลเรียบร้อยแล้ว",
          },
          { status: 200 }
        );
      }

      if (resolvedNextStatus !== 15) {
        return NextResponse.json(
          { message: "การดำเนินการไม่ถูกต้อง" },
          { status: 400 }
        );
      }

      if (!role_id) {
        return NextResponse.json(
          { message: "กรุณาเลือก Role" },
          { status: 400 }
        );
      }

      // --------------------------------------------------------
      // เลือกอัพเดตเข้าฐานข้อมูลกลาง (15)
      // สร้าง Employee + User Account จริง
      // --------------------------------------------------------

      // เก็บ reference ไว้สำหรับ rollback ถ้าขั้นตอนหลังจากนี้ล้มเหลว
      let createdEmployee = null;
      let createdUserAccount = null;

      try {
        // ------------------------------------------------------
        // Get Employee Code Setting
        // ------------------------------------------------------
        const {
          data: get_data_code_setting,
          error: get_data_code_setting_error,
        } = await supabaseAdmin
          .from("employee_code_settings")
          .select("*")
          .eq("company_id", get_data_emp_recrut.company_id)
          .single();

        if (get_data_code_setting_error) {
          console.error(
            "GET CODE SETTING ERROR:",
            get_data_code_setting_error
          );
          throw new AppError("ไม่สามารถดึงการตั้งค่ารหัสพนักงานได้");
        }

        // ------------------------------------------------------
        // Reserve Employee Code
        // ------------------------------------------------------
        const { data: rawData, error: employeeCodeError } =
          await supabaseAdmin.rpc(EMPLOYEE_CODE_RPC, {
            p_company_id: get_data_emp_recrut.company_id,
            p_employee_code_setting_id: get_data_code_setting.id,
            p_employee_type: get_data_emp_recrut.employment_type,
            p_running_date: get_data_emp_recrut.start_date,
          });

        if (employeeCodeError) {
          console.error("RESERVE EMPLOYEE CODE ERROR:", employeeCodeError);
          throw new AppError("ไม่สามารถออกรหัสพนักงานได้");
        }

        const result = Array.isArray(rawData) ? rawData[0] : rawData;
        const employeeCode = cleanText(result?.employee_code);

        if (!employeeCode) {
          throw new AppError("ไม่สามารถสร้าง Employee Code ได้");
        }

        // ------------------------------------------------------
        // get gender name
        // ------------------------------------------------------
        const { data: get_gender_name, error: get_gender_name_error } =
          await supabaseAdmin
            .from("genders")
            .select("gender_name_th")
            .eq("id", get_data_emp_recrut.gender)
            .single();

        if (get_gender_name_error) {
          console.error("GET GENDER NAME ERROR:", get_gender_name_error);
          throw new AppError("ไม่สามารถดึงข้อมูลเพศของผู้สมัครได้");
        }

        // ------------------------------------------------------
        // Prepare Employee Data
        // ------------------------------------------------------
        const insertData = {
          employee_code: employeeCode,
          first_name_th: get_data_emp_recrut.first_name,
          last_name_th: get_data_emp_recrut.last_name,
          nick_name: get_data_emp_recrut.nickname_th,
          gender: get_gender_name.gender_name_th,
          phone: get_data_emp_recrut.phone_number,
          personal_email: get_data_emp_recrut.email,
          employment_type: get_data_emp_recrut.employment_type,
          branch_group_id: get_data_emp_recrut.group_id,
          company_id: get_data_emp_recrut.company_id,
          branch_id: get_data_emp_recrut.branch_id,
          department_id: get_data_emp_recrut.department_id,
          division_id: get_data_emp_recrut.division_id,
          unit_id: get_data_emp_recrut.unit_id,
          position_id: get_data_emp_recrut.position_id,
          position_level_id: get_data_emp_recrut.position_level_id,
          job_id: get_data_emp_recrut.last_job_id,
          payroll_company_id: get_data_emp_recrut.payroll_company_id,
          payroll_type_id: get_data_emp_recrut.payroll_type_id,
          employee_status_id: get_data_emp_recrut.employee_status_id,
          employment_type_id: get_data_emp_recrut.employment_type_id,
          citizen_id: get_data_emp_recrut.identity_no,
          passport_no: get_data_emp_recrut.identity_no,
          birth_date: get_data_emp_recrut.date_of_birth,
          line_id: get_data_emp_recrut.line_id,
          probation_days: get_data_emp_recrut.probation_days,
          probation_end_date: get_data_emp_recrut.probation_end_date,
          probation_status: get_data_emp_recrut.probation_status,
          nickname_th: get_data_emp_recrut.nickname_th,
          nickname_en: get_data_emp_recrut.nickname_en,
          gender_id: get_data_emp_recrut.gender,
          marital_status_id: get_data_emp_recrut.marital_status,
          religion_id: get_data_emp_recrut.religion,
          nationality_id: get_data_emp_recrut.nationality,
          hire_date: get_data_emp_recrut.start_date,
          start_work_date: get_data_emp_recrut.start_date,
          confirmation_date: get_data_emp_recrut.start_date,
          employee_type_digit: get_data_code_setting.running_digits,
          employee_year_2d: get_data_code_setting.year_digits,
          employee_running_no: get_data_code_setting.executive_digit,
          status: "active",
          created_by: userId,
          updated_by: userId,
        };

        // ------------------------------------------------------
        // 1. Create Employee
        // ------------------------------------------------------
        createdEmployee = await createEmployee({
          employeeData: insertData,
          userId,
        });

        // ------------------------------------------------------
        // 2. Create User Account
        // ------------------------------------------------------
        createdUserAccount = await createUserAccount({
          employee: createdEmployee,
          roleId: role_id,
          isActive: true,
        });

        await updateRecruitJobInterviewStatus({
          applicationId: application_id,
          status: Number(resolvedNextStatus),
        });


        // ------------------------------------------------------
        // update recruit_job_applications
        // ------------------------------------------------------
        const { error: updateAppError } = await supabaseAdmin
          .from("recruit_job_applications")
          .update({
            emp_id: createdEmployee.id,
            status: 15,
          })
          .eq("id", application_id);

        if (updateAppError) {
          console.error(
            "UPDATE APPLICATION AFTER CREATE ERROR:",
            updateAppError
          );
          throw new AppError("ไม่สามารถอัปเดตสถานะใบสมัครได้");
        }

        // ------------------------------------------------------
        // Activity Log
        // ------------------------------------------------------
        await writeActivityLog({
          module_name: "approve_employees",
          action_type: "create",
          reference_table: "approve_employees",
          reference_id: createdUserAccount.id,
          description: `เพิ่มผู้ใช้งานระบบ ${createdUserAccount.username}`,
          new_data: {
            auth_user_id: createdUserAccount.auth_user_id,
            employee_id: createdUserAccount.employee_id,
            role_id: createdUserAccount.role_id,
            username: createdUserAccount.username,
            is_active: createdUserAccount.is_active,
            employee_code: createdUserAccount.employees?.employee_code || "",
            employee_name: `${
              createdUserAccount.employees?.first_name_th || ""
            } ${createdUserAccount.employees?.last_name_th || ""}`.trim(),
            role_code: createdUserAccount.roles?.role_code || "",
            role_name: createdUserAccount.roles?.role_name || "",
          },
        });
      } catch (innerError) {
        // ----------------------------------------------------
        // ขั้นตอนใดขั้นตอนหนึ่งใน block นี้ล้มเหลว
        // rollback สิ่งที่สร้างไปแล้วทั้งหมด (compensating transaction)
        // ----------------------------------------------------
        await rollbackEmployeeCreation({
          employee: createdEmployee,
          userAccount: createdUserAccount,
        });
        throw innerError;
      }
    }

    // ========================================================
    // Success
    // ========================================================

    return NextResponse.json(
      {
        success: true,
        message: "สร้าง Employee และ User Account เรียบร้อยแล้ว",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("SAVE EMPLOYEE ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.isSafeMessage
          ? error.message
          : "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}