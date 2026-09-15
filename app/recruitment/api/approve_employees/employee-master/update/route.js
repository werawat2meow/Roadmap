// NOTE: keep the same imports as the original file
// (getUserIdFromRequest, supabaseAdmin, NextResponse, AppError,
//  createEmployee, createUserAccount, rollbackEmployeeCreation,
//  writeActivityLog, updateRecruitJobInterviewStatus,
//  calculateProbationEndDate, getBangkokDate, cleanText,
//  EMPLOYEE_CODE_RPC)

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { getUserIdFromRequest } from "@/app/recruitment/lib/getUserId";
import { cleanText } from "@/lib/employee/employeePayload";
import { writeActivityLog } from "@/lib/activityLogger";

const EMPLOYEE_CODE_RPC = "reserve_employee_code";

function getBangkokDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

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

// ============================================================
// Constants & small helpers
// ============================================================

const STATUS = {
  NO_SHOW: 13,
  RESCHEDULE: 14,
  STAGE_ONE: 12,
  PENDING_CONFIRM: 17,
  CONFIRMED: 15,
};

const badRequest = (message) => NextResponse.json({ message }, { status: 400 });

// Returns the message for the first "falsy" field, or null if all present.
const firstMissingFieldMessage = (fields) => {
  for (const [value, message] of fields) {
    if (!value) return message;
  }
  return null;
};

// ============================================================
// Reschedule / No-show
// Shared by: status 13/14 (direct update) and 17 -> 13/14 transition
// Returns a NextResponse on error, or null on success.
// ============================================================

async function rescheduleApplication({ applicationId, targetStatus, startDate, reason, requireReason }) {
  if (requireReason && !String(reason || "").trim()) {
    return badRequest("กรุณาระบุเหตุผล");
  }
  if (!startDate) {
    return badRequest("กรุณาระบุวันที่เริ่มงาน");
  }

  await updateRecruitJobInterviewStatus({ applicationId, status: targetStatus });

  const updatePayload = { start_date: startDate };
  if (requireReason) updatePayload.status = targetStatus;
  if (requireReason || String(reason || "").trim()) {
    updatePayload.status_reason = reason;
  }

  const { error } = await supabaseAdmin
    .from("recruit_job_applications")
    .update(updatePayload)
    .eq("id", applicationId);

  if (error) {
    console.error("UPDATE APPLICATION (RESCHEDULE) ERROR:", error);
    return NextResponse.json(
      { success: false, message: "ไม่สามารถอัปเดตข้อมูลใบสมัครได้" },
      { status: 500 }
    );
  }
  return null;
}

// ============================================================
// Additional cost / compensation rows
// ============================================================

function buildAdditionalCostRows(applicationId, additionalCompensation = [], additionalCost = []) {
  const rows = [];

  for (const item of additionalCompensation) {
    for (const [topic, amount] of Object.entries(item)) {
      rows.push({ application_id: applicationId, cost_type: "compensation", topic, amount: Number(amount || 0) });
    }
  }

  for (const item of additionalCost) {
    const topic = item.name?.trim();
    if (!topic) continue;
    rows.push({ application_id: applicationId, cost_type: "additional", topic, amount: Number(item.amount || 0) });
  }

  return rows;
}

async function syncAdditionalCosts(applicationId, rows) {
  await supabaseAdmin
    .from("recruit_additional_cost")
    .delete()
    .eq("application_id", applicationId)
    .in("cost_type", ["additional", "compensation"]);

  if (rows.length > 0) {
    await supabaseAdmin.from("recruit_additional_cost").insert(rows);
  }
}

// ============================================================
// Stage 1: status 12 -> 17
// Save application details, wait for the final confirmation call.
// Returns a NextResponse on error, or null on success.
// ============================================================

async function processStageOneApproval({ application, body }) {
  const { data: company, error: companyError } = await supabaseAdmin
    .from("branches")
    .select("*")
    .eq("id", body.branch_id)
    .single();
  if (companyError) {
    console.error("GET COMPANY ERROR:", companyError);
    throw new AppError("ไม่สามารถดึงข้อมูล Branch ได้");
  }

  const { data: payrollCompany, error: payrollCompanyError } = await supabaseAdmin
    .from("payroll_companies")
    .select("*")
    .eq("company_id", company.company_id)
    .single();
  if (payrollCompanyError) {
    console.error("GET PAYROLL COMPANY ERROR:", payrollCompanyError);
    throw new AppError("ไม่สามารถดึงข้อมูล payrol ได้");
  }

  const probationDays = 119;
  const probationEndDate = calculateProbationEndDate(body.start_date, probationDays);

  const applicationUpdate = {
    branch_id: body.branch_id,
    department_id: body.department_id,
    division_id: body.division_id,
    unit_id: body.unit_id,
    position_id: body.position_id,
    position_level_id: body.position_level_id,
    start_date: body.start_date,
    base_salary: body.base_salary,
    position_allowance: body.position_allowance,
    living_allowance: body.living_allowance,
    special_allowance: body.special_allowance,
    fuel_allowance: body.fuel_allowance,
    incentive_type: body.incentive_type,
    incentive_amount: body.incentive_amount,
    oc: body.oc,
    deposit: body.deposit,
    deduct_processing: body.deduct_processing,
    deduct_resign_within_one_year: body.deduct_resign_within_one_year,
    phone_allowance: body.phone_allowance,
    employment_type: body.employment_type,
    employment_type_id: body.employment_type_id,
    employee_status_id: "21e6539f-159c-4ea8-a63a-817c97563785",
    probation_days: probationDays,
    probation_end_date: probationEndDate,
    probation_status: "probation",
    company_id: company.company_id,
    branch_group_id: company.group_id,
    payroll_company_id: payrollCompany.id,
    payroll_type_id: body.payroll_types,
    position_family_id: body.position_family_id,
    last_job_id: body.job_id,
    status: STATUS.PENDING_CONFIRM,
  };

  await updateRecruitJobInterviewStatus({ applicationId: application.id, status: STATUS.PENDING_CONFIRM });

  const { error } = await supabaseAdmin
    .from("recruit_job_applications")
    .update(applicationUpdate)
    .eq("id", application.id);
  if (error) {
    console.error("UPDATE APPLICATION ERROR:", error);
    return NextResponse.json({ message: "ไม่สามารถอัปเดตข้อมูลใบสมัครได้" }, { status: 500 });
  }

  const costRows = buildAdditionalCostRows(application.id, body.additional_compensation, body.additional_cost);
  await syncAdditionalCosts(application.id, costRows);

  return null;
}

// ============================================================
// Stage 2: status 17 -> 15
// Confirm & create Employee + User Account (with rollback on failure).
// Returns a NextResponse on error, or null on success.
// ============================================================

async function processFinalConfirmation({ application, body, userId }) {
  let createdEmployee = null;
  let createdUserAccount = null;

  try {
    const probationDays = 119;
    const probationEndDate = calculateProbationEndDate(body.start_date, probationDays);

    const { data: codeSetting, error: codeSettingError } = await supabaseAdmin
      .from("employee_code_settings")
      .select("*")
      .eq("company_id", application.company_id)
      .single();
    if (codeSettingError) {
      console.error("GET CODE SETTING ERROR:", codeSettingError);
      throw new AppError("ไม่สามารถดึงการตั้งค่ารหัสพนักงานได้");
    }

    const { data: rawCode, error: codeError } = await supabaseAdmin.rpc(EMPLOYEE_CODE_RPC, {
      p_company_id: application.company_id,
      p_employee_code_setting_id: codeSetting.id,
      p_employee_type: application.employment_type,
      p_running_date: application.start_date,
    });
    if (codeError) {
      console.error("RESERVE EMPLOYEE CODE ERROR:", codeError);
      throw new AppError("ไม่สามารถออกรหัสพนักงานได้");
    }
    const employeeCode = cleanText((Array.isArray(rawCode) ? rawCode[0] : rawCode)?.employee_code);
    if (!employeeCode) throw new AppError("ไม่สามารถสร้าง Employee Code ได้");

    const { data: gender, error: genderError } = await supabaseAdmin
      .from("genders")
      .select("gender_name_th")
      .eq("id", application.gender)
      .single();
    if (genderError) {
      console.error("GET GENDER NAME ERROR:", genderError);
      throw new AppError("ไม่สามารถดึงข้อมูลเพศของผู้สมัครได้");
    }

    const { data: nationality, error: nationalityError } = await supabaseAdmin
      .from("nationalities")
      .select("id, nationality_code")
      .eq("id", application.nationality)
      .single();
    if (nationalityError) {
      console.error("GET NATIONALITY ERROR:", nationalityError);
      throw new AppError("ไม่สามารถดึงข้อมูลสัญชาติของผู้สมัครได้");
    }

    const identityData =
      nationality?.nationality_code === "TH"
        ? {
            citizen_id: application.identity_no,
            tax_id: application.identity_no,
            social_security_no: application.identity_no,
            passport_no: null,
          }
        : {
            citizen_id: null,
            tax_id: null,
            social_security_no: null,
            passport_no: application.identity_no,
          };

    const employeeData = {
      employee_code: employeeCode,
      first_name_th: application.first_name,
      last_name_th: application.last_name,
      nick_name: application.nickname_th,
      gender: gender.gender_name_th,
      phone: application.phone_number,
      personal_email: application.email,
      employment_type: application.employment_type,
      branch_group_id: application.branch_group_id,
      company_id: application.company_id,
      branch_id: application.branch_id,
      department_id: application.department_id,
      division_id: application.division_id,
      unit_id: application.unit_id,
      position_id: application.position_id,
      position_level_id: application.position_level_id,
      job_id: application.last_job_id,
      payroll_company_id: application.payroll_company_id,
      payroll_type_id: application.payroll_type_id,
      employee_status_id: application.employee_status_id,
      employment_type_id: application.employment_type_id,
      ...identityData,
      birth_date: application.date_of_birth,
      line_id: application.line_id,
      probation_days: application.probation_days,
      probation_end_date: probationEndDate,
      probation_status: application.probation_status,
      nickname_th: application.nickname_th,
      nickname_en: application.nickname_en,
      gender_id: application.gender,
      marital_status_id: application.marital_status,
      religion_id: application.religion,
      nationality_id: application.nationality,
      hire_date: body.start_date,
      start_work_date: body.start_date,
      confirmation_date: body.start_date,
      employee_type_digit: codeSetting.running_digits,
      employee_year_2d: codeSetting.year_digits,
      employee_running_no: codeSetting.executive_digit,
      employee_photo_url: application.profile_image_url,
      position_family_id: application.position_family_id,
      employee_photo_path: application.profile_image_url,
      status: "active",
      created_by: userId,
      updated_by: userId,
    };

    createdEmployee = await createEmployee({ employeeData, userId });

    const { error: compensationError } = await supabaseAdmin.from("employee_compensations").insert({
      employee_id: createdEmployee.id,
      position_id: application.position_id,
      position_level_id: application.position_level_id,
      payroll_company_id: application.payroll_company_id,
      payroll_type_id: application.payroll_type_id,
      currency_code: "THB",
      base_salary: application.base_salary,
      source_type: "initial",
      effective_from: getBangkokDate(),
      effective_to: null,
      status: "active",
      created_by: userId,
      updated_by: userId,
    });
    if (compensationError) {
      console.error("INSERT EMPLOYEE COMPENSATION ERROR:", compensationError);
      throw new AppError("ไม่สามารถบันทึกข้อมูลได้");
    }

    createdUserAccount = await createUserAccount({ employee: createdEmployee, roleId: body.role_id, isActive: true });

    await updateRecruitJobInterviewStatus({ applicationId: application.id, status: STATUS.CONFIRMED });

    const { error: updateAppError } = await supabaseAdmin
      .from("recruit_job_applications")
      .update({
        branch_id: body.branch_id,
        department_id: body.department_id,
        division_id: body.division_id,
        unit_id: body.unit_id,
        position_id: body.position_id,
        position_level_id: body.position_level_id,
        base_salary: body.base_salary,
        position_allowance: body.position_allowance,
        living_allowance: body.living_allowance,
        special_allowance: body.special_allowance,
        fuel_allowance: body.fuel_allowance,
        incentive_type: body.incentive_type,
        incentive_amount: body.incentive_amount,
        oc: body.oc,
        deposit: body.deposit,
        deduct_processing: body.deduct_processing,
        deduct_resign_within_one_year: body.deduct_resign_within_one_year,
        phone_allowance: body.phone_allowance,
        employment_type: body.employment_type,
        employment_type_id: body.employment_type_id,
        company_id: application.company_id,
        branch_group_id: application.branch_group_id,
        payroll_company_id: application.payroll_company_id,
        payroll_type_id: body.payroll_types,
        position_family_id: body.position_family_id,
        emp_id: createdEmployee.id,
        emp_code: createdEmployee.employee_code,
        hire_date: body.start_date,
        start_date: body.start_date,
        probation_end_date: probationEndDate,
        user_approve: userId,
        status: STATUS.CONFIRMED,
      })
      .eq("id", application.id);
    if (updateAppError) {
      console.error("UPDATE APPLICATION AFTER CREATE ERROR:", updateAppError);
      throw new AppError("ไม่สามารถอัปเดตสถานะใบสมัครได้");
    }

    await writeActivityLog({
      module_name: "approve_employees",
      action_type: "create/update",
      reference_table: "recruit_job_applications",
      reference_id: createdUserAccount.id,
      description: `เพิ่มผู้ใช้งานระบบ ${createdUserAccount.username}`,
      new_data: {
        auth_user_id: createdUserAccount.auth_user_id,
        employee_id: createdUserAccount.employee_id,
        role_id: createdUserAccount.role_id,
        username: createdUserAccount.username,
        is_active: createdUserAccount.is_active,
        employee_code: createdUserAccount.employees?.employee_code || "",
        employee_name: `${createdUserAccount.employees?.first_name_th || ""} ${
          createdUserAccount.employees?.last_name_th || ""
        }`.trim(),
        role_code: createdUserAccount.roles?.role_code || "",
        role_name: createdUserAccount.roles?.role_name || "",
      },
    });

    return {
      employeeCode,
      employee: createdEmployee,
      userAccount: createdUserAccount,
    };
  } catch (innerError) {
    await rollbackEmployeeCreation({ employee: createdEmployee, userAccount: createdUserAccount });
    throw innerError;
  }
}

// ============================================================
// Route handler
// ============================================================

export async function POST(request) {
  const userId = await getUserIdFromRequest();

  try {
    const body = await request.json();
    const { application_id, status: submittedStatus, next_status, reason, start_date } = body;

    if (submittedStatus !== 17) {
      const msg = firstMissingFieldMessage([
        [body.branch_id, "กรุณาเลือก Branch"],
        [body.department_id, "กรุณาเลือก Department"],
        [body.division_id, "กรุณาเลือก Division"],
        [body.unit_id, "กรุณาเลือก Unit"],
        [body.position_id, "กรุณาเลือก Position"],
        [body.position_level_id, "กรุณาเลือก Position Level"],
        [body.employment_type, "ประเภทสำหรับสร้างรหัส"],
        [body.employment_type_id, "กรุณาเลือกประเภทการจ้างงาน"],
      ]);
      if (msg) return badRequest(msg);
    }

    const commonMsg = firstMissingFieldMessage([
      [application_id, "ไม่พบ Application ID"],
      [start_date, "กรุณาระบุวันที่เริ่มงาน"],
    ]);
    if (commonMsg) return badRequest(commonMsg);

    // --- Load application ---
    const { data: application, error: getAppError } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("*")
      .eq("id", application_id)
      .single();
    if (getAppError) {
      console.error("GET RECRUIT APPLICATION ERROR:", getAppError);
      throw new AppError("ไม่สามารถดึงข้อมูลผู้สมัครได้");
    }
    if (!application) {
      return NextResponse.json({ success: false, message: "ไม่พบข้อมูลผู้สมัคร" }, { status: 404 });
    }

    // --- Staleness check: the status the frontend saw must match the DB now ---
    if (
      submittedStatus !== undefined &&
      submittedStatus !== null &&
      Number(submittedStatus) !== Number(application.status)
    ) {
      return NextResponse.json(
        { success: false, message: "สถานะของใบสมัครมีการเปลี่ยนแปลงไปแล้ว กรุณาโหลดข้อมูลใหม่อีกครั้ง" },
        { status: 409 }
      );
    }

    const currentStatus = Number(application.status);

    // --- status 13/14: reschedule / no-show only, no employee creation ---
    if (currentStatus === STATUS.NO_SHOW || currentStatus === STATUS.RESCHEDULE) {
      const errRes = await rescheduleApplication({
        applicationId: application_id,
        targetStatus: currentStatus,
        startDate: start_date,
        reason,
        requireReason: false,
      });
      if (errRes) return errRes;

      return NextResponse.json({ success: true, message: "อัปเดตวันที่เริ่มงานเรียบร้อยแล้ว" }, { status: 200 });
    }

    // --- status 12: save details, move to pending confirmation (17) ---
    if (currentStatus === STATUS.STAGE_ONE) {
      const errRes = await processStageOneApproval({
        application,
        body,
      });

      if (errRes) return errRes;

      return NextResponse.json(
        {
          success: true,
          message: "บันทึกข้อมูลเรียบร้อยแล้ว",
        },
        { status: 200 }
      );
    }

    // --- status 17: either reschedule/no-show, or final confirmation (15) ---
    if (currentStatus === STATUS.PENDING_CONFIRM) {
      const resolvedNextStatus = next_status ? Number(next_status) : STATUS.CONFIRMED;

      if (resolvedNextStatus === STATUS.NO_SHOW || resolvedNextStatus === STATUS.RESCHEDULE) {
        const errRes = await rescheduleApplication({
          applicationId: application_id,
          targetStatus: resolvedNextStatus,
          startDate: start_date,
          reason,
          requireReason: true,
        });
        if (errRes) return errRes;

        return NextResponse.json({ success: true, message: "บันทึกข้อมูลเรียบร้อยแล้ว" }, { status: 200 });
      }

      if (resolvedNextStatus !== STATUS.CONFIRMED) {
        return badRequest("การดำเนินการไม่ถูกต้อง");
      }
      if (!body.role_id) {
        return badRequest("กรุณาเลือก Role");
      }

      const result = await processFinalConfirmation({ application, body, userId });
      // if (errRes) return errRes;

      return NextResponse.json(
        {
          success: true,
          message: "สร้าง Employee และ User Account เรียบร้อยแล้ว",
          employee_code: result.employeeCode,
        },
        { status: 201 }
      );

    }

    // return NextResponse.json(
    //   { success: true, message: "สร้าง Employee และ User Account เรียบร้อยแล้ว", employee_code: employeeCode },
    //   { status: 201 }
    // );

    return badRequest("สถานะใบสมัครไม่รองรับการดำเนินการนี้");
  } catch (error) {
    console.error("SAVE EMPLOYEE ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.isSafeMessage ? error.message : "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
      },
      { status: 500 }
    );
  }
}