import "server-only";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { generateContractNumber, ContractDataError } from "@/app/recruitment/lib/contracts";
import { writeActivityLog } from "@/lib/activityLogger";

export const MAX_APPROVAL_BATCH = 20;

export function isApprovalId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isApprovalDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export class ApprovalError extends Error {
  constructor(message, status = 400, code = "INVALID_DATA") {
    super(message);
    this.status = status;
    this.code = code;
    this.isSafeMessage = true;
  }
}

export async function approvalAccess() {
  return requireScopedAccess("recruitment.approve.emp", "edit", { scopeType: "employee" });
}

export function approvalFailure(error) {
  if (error instanceof ContractDataError) {
    return {
      success: false,
      code: `CONTRACT_${error.code}`,
      message: error.message,
      http_status: error.code === "DATABASE_ERROR" ? 503 : error.code === "INCOMPLETE_DATA" ? 422 : 409,
    };
  }
  return {
    success: false,
    code: error instanceof ApprovalError ? error.code : "APPROVAL_FAILED",
    message: error instanceof ApprovalError ? error.message : "อนุมัติไม่สำเร็จ สามารถลองรายการนี้อีกครั้งได้",
    http_status: error instanceof ApprovalError ? error.status : 500,
  };
}

export async function approvalRpc(name, args) {
  const { data, error } = await supabaseAdmin.rpc(name, args);
  if (!error) return data;
  if (["PGRST202", "42P01", "42883"].includes(error.code)) {
    throw new ApprovalError("ยังไม่ได้ติดตั้ง SQL สำหรับอนุมัติพนักงาน กรุณาติดต่อผู้ดูแลระบบ", 503, "MIGRATION_REQUIRED");
  }
  const knownErrors = [
    ["APPROVAL_UNAUTHORIZED", "บัญชีผู้อนุมัติถูกปิดใช้งานหรือ session หมดอายุ", 403, "FORBIDDEN"],
    ["APPROVAL_INVALID_ROLE", "Role เปลี่ยนแล้วหรือไม่อนุญาตให้เลือก กรุณาโหลด Role ใหม่", 409, "INVALID_ROLE"],
    ["APPROVAL_INCOMPLETE", "ข้อมูลใบสมัครไม่ครบ กรุณาตรวจสอบก่อนอนุมัติ", 400, "INVALID_DATA"],
    ["APPROVAL_AUTH_MISSING", "ยังตรวจสอบบัญชี Auth ไม่สำเร็จ สามารถลองรายการเดิมอีกครั้งได้", 503, "AUTH_UNAVAILABLE"],
    ["APPROVAL_CODE_FAILED", "ไม่สามารถออกรหัสพนักงานได้ กรุณาตรวจสอบการตั้งค่ารหัส", 409, "CODE_CONFIGURATION"],
  ];
  const known = knownErrors.find(([marker]) => error.message?.includes(marker));
  if (known) throw new ApprovalError(known[1], known[2], known[3]);
  if (error.message?.includes("APPROVAL_STALE")) {
    throw new ApprovalError("ข้อมูลหรือสถานะใบสมัครเปลี่ยนแล้ว กรุณาโหลดข้อมูลใหม่", 409, "STALE_APPLICATION");
  }
  if (error.message?.includes("APPROVAL_ROLE_CHANGED")) {
    throw new ApprovalError("รายการนี้เริ่มอนุมัติด้วย Role อื่นแล้ว กรุณาใช้ Role เดิมหรือติดต่อผู้ดูแล", 409, "ROLE_CONFLICT");
  }
  if (error.message?.includes("APPROVAL_RECOVERY_REQUIRED")) {
    throw new ApprovalError("พบข้อมูลเดิมที่ต้องตรวจสอบ กรุณาติดต่อผู้ดูแลก่อนอนุมัติซ้ำ", 409, "RECOVERY_REQUIRED");
  }
  console.error("RECRUITMENT_APPROVAL_RPC_FAILED", { name, code: error.code });
  throw new ApprovalError("ไม่สามารถบันทึกการอนุมัติได้ กรุณาลองอีกครั้ง", 500, "DATABASE_ERROR");
}

function validateApplication(application) {
  const required = {
    first_name: "ชื่อ", last_name: "นามสกุล", start_date: "วันเริ่มงาน",
    branch_id: "สาขา", department_id: "ฝ่าย", division_id: "แผนก", unit_id: "หน่วยงาน",
    position_id: "ตำแหน่ง", position_level_id: "ระดับตำแหน่ง", company_id: "บริษัท",
    payroll_company_id: "บริษัทจ่ายเงินเดือน", payroll_type_id: "ประเภทเงินเดือน",
    employment_type: "ประเภทสำหรับสร้างรหัส", employment_type_id: "ประเภทการจ้างงาน",
    employee_status_id: "สถานะพนักงาน", gender: "เพศ", nationality: "สัญชาติ", identity_no: "เลขเอกสารประจำตัว",
  };
  const missing = Object.entries(required).filter(([key]) => !String(application[key] ?? "").trim()).map(([, label]) => label);
  if (missing.length) throw new ApprovalError(`ข้อมูลใบสมัครไม่ครบ: ${missing.join(", ")}`);
  if (!isApprovalDate(application.start_date)) {
    throw new ApprovalError("วันเริ่มงานในใบสมัครไม่ถูกต้อง");
  }
  if (application.base_salary == null || !Number.isFinite(Number(application.base_salary)) || Number(application.base_salary) < 0) {
    throw new ApprovalError("เงินเดือนในใบสมัครไม่ถูกต้อง");
  }
  if (application.emp_id) throw new ApprovalError("ใบสมัครเชื่อมพนักงานแล้ว กรุณาตรวจสอบข้อมูล", 409, "RECOVERY_REQUIRED");
}

async function ensureAuth(operation) {
  const authId = operation.auth_user_id;
  const verify = (user) => {
    if (user?.id !== authId || user?.email !== operation.auth_email ||
      user?.app_metadata?.recruitment_application_id !== operation.application_id) {
      throw new ApprovalError("บัญชี Auth ไม่ตรงกับงานอนุมัติ กรุณาติดต่อผู้ดูแล", 409, "RECOVERY_REQUIRED");
    }
    return user;
  };
  const existing = await supabaseAdmin.auth.admin.getUserById(authId);
  if (existing.data?.user) return verify(existing.data.user);
  if (existing.error && existing.error.status !== 404 && existing.error.code !== "user_not_found") {
    throw new ApprovalError("ไม่สามารถตรวจสอบบัญชี Auth ได้ กรุณาลองอีกครั้ง", 503, "AUTH_UNAVAILABLE");
  }
  const created = await supabaseAdmin.auth.admin.createUser({
    id: authId, email: operation.auth_email, password: operation.employee_code, email_confirm: true,
    app_metadata: { recruitment_application_id: operation.application_id },
    user_metadata: { username: operation.employee_code, employee_id: operation.employee_id },
  });
  if (created.data?.user) return verify(created.data.user);
  // Another request may have created exactly this ID, or the response was lost.
  // Never issue a new ID/email and never delete an account owned by another retry.
  const retried = await supabaseAdmin.auth.admin.getUserById(authId);
  if (retried.data?.user) return verify(retried.data.user);
  throw new ApprovalError("สร้างบัญชี Auth ไม่สำเร็จ สามารถลองอีกครั้งโดยใช้รายการเดิม", 503, "AUTH_UNAVAILABLE");
}

export async function approveApplication({ application_id, role_id }) {
  if (!isApprovalId(application_id)) throw new ApprovalError("Application ID ไม่ถูกต้อง");
  if (!isApprovalId(role_id)) throw new ApprovalError("กรุณาเลือก Role ที่ถูกต้อง");
  // Reload the actor's permission/scope for EVERY item, including retries.
  const guard = await approvalAccess();
  if (!guard.ok) throw new ApprovalError("ไม่มีสิทธิ์อนุมัติหรือ session หมดอายุ", guard.response.status, "FORBIDDEN");
  const { data: application, error } = await supabaseAdmin.from("recruit_job_applications")
    .select("*").eq("id", application_id).maybeSingle();
  if (error) throw new ApprovalError("ไม่สามารถโหลดใบสมัครได้", 500, "DATABASE_ERROR");
  if (!application || !guard.canAccessEmployee(application)) {
    throw new ApprovalError("ไม่พบใบสมัครหรือไม่มีสิทธิ์ในหน่วยงานนี้", 403, "FORBIDDEN");
  }
  if (Number(application.status) !== 17 && Number(application.status) !== 15) {
    throw new ApprovalError("อนุมัติได้เฉพาะสถานะ 17 สถานะล่าสุดเปลี่ยนแล้ว", 409, "STALE_APPLICATION");
  }
  if (!role_id) throw new ApprovalError("กรุณาเลือก Role");
  const { data: role, error: roleError } = await supabaseAdmin.from("roles")
    .select("id").eq("id", role_id).eq("is_system", false).maybeSingle();
  if (roleError) throw new ApprovalError("ตรวจสอบ Role ไม่สำเร็จ", 500, "DATABASE_ERROR");
  if (!role) throw new ApprovalError("Role ไม่ถูกต้องหรือไม่อนุญาตให้เลือก");
  if (Number(application.status) === 17) validateApplication(application);
  const operation = await approvalRpc("recruit_approval_prepare", {
    p_application_id: String(application.id), p_actor: guard.user.id,
    p_role_id: String(role.id), p_expected: application,
  });
  if (operation.state === "completed") {
    return { success: true, application_id, employee_code: operation.employee_code, already_approved: true };
  }

  const [{ data: gender, error: genderError }, { data: nationality, error: nationalityError }] = await Promise.all([
    supabaseAdmin.from("genders").select("gender_name_th").eq("id", application.gender).single(),
    supabaseAdmin.from("nationalities").select("id, nationality_code").eq("id", application.nationality).single(),
  ]);
  if (genderError || nationalityError) throw new ApprovalError("ไม่พบข้อมูลเพศหรือสัญชาติของผู้สมัคร");
  await ensureAuth(operation);
  const employeeCode = operation.employee_code;
  const userId = guard.user.id;
  const codeSetting = operation.code_setting;
  const probationDate = new Date(`${application.start_date}T00:00:00Z`);
  probationDate.setUTCDate(probationDate.getUTCDate() + 119);
  const probationEndDate = probationDate.toISOString().slice(0, 10);
  const identityData = nationality.nationality_code === "TH"
    ? { citizen_id: application.identity_no, tax_id: application.identity_no, social_security_no: application.identity_no, passport_no: null }
    : { citizen_id: null, tax_id: null, social_security_no: null, passport_no: application.identity_no };
  // Preserve the existing single-person field mapping.
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
      probation_days: 119,
      probation_end_date: probationEndDate,
      probation_status: application.probation_status,
      nickname_th: application.nickname_th,
      nickname_en: application.nickname_en,
      gender_id: application.gender,
      marital_status_id: application.marital_status,
      religion_id: application.religion,
      nationality_id: application.nationality,
      hire_date: application.start_date,
      start_work_date: application.start_date,
      confirmation_date: application.start_date,
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
  const contractNumber = await generateContractNumber(application);
  const latestGuard = await approvalAccess();
  if (!latestGuard.ok || latestGuard.user.id !== userId || !latestGuard.canAccessEmployee(application)) {
    throw new ApprovalError("สิทธิ์อนุมัติเปลี่ยนแล้ว กรุณาตรวจสอบสิทธิ์ก่อนลองอีกครั้ง", 403, "FORBIDDEN");
  }
  const result = await approvalRpc("recruit_approval_commit", {
    p_application_id: String(application.id), p_actor: userId,
    p_employee: { ...employeeData, id: operation.employee_id },
    p_password_hash: await bcrypt.hash(employeeCode, 10),
    p_contract_number: contractNumber,
  });
  // A logging outage must never undo a committed Employee/User or report it as failed.
  if (!result.already_approved) {
    try {
      await writeActivityLog({ user_id: userId, module_name: "approve_employees", action_type: "create/update",
        reference_table: "recruit_job_applications", reference_id: application.id,
        description: `เพิ่มผู้ใช้งานระบบ ${employeeCode}`,
        new_data: { employee_id: operation.employee_id, employee_code: employeeCode, role_id: role.id },
      });
    } catch (logError) {
      console.error("RECRUITMENT_APPROVAL_LOG_FAILED", { code: logError?.code });
    }
  }
  return { ...result, success: true, application_id };
}
