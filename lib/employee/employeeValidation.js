import {
  ALLOWED_CODE_EMPLOYEE_TYPES,
  ALLOWED_EMPLOYEE_STATUSES,
} from "./employeePayload";

/* =========================================================
   HELPERS
========================================================= */

function isValidEmail(value) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

function isDateBefore(
  firstDate,
  secondDate
) {
  if (
    !firstDate ||
    !secondDate
  ) {
    return false;
  }

  return (
    new Date(firstDate).getTime() <
    new Date(secondDate).getTime()
  );
}

/* =========================================================
   VALIDATE EMPLOYEE
========================================================= */

export function validateEmployeePayload(
  employee = {}
) {
  if (!employee.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (!employee.first_name_th) {
    return "กรุณากรอกชื่อพนักงานภาษาไทย";
  }

  if (!employee.last_name_th) {
    return "กรุณากรอกนามสกุลพนักงานภาษาไทย";
  }

  if (!employee.branch_id) {
    return "กรุณาเลือกสังกัด";
  }

  if (!employee.department_id) {
    return "กรุณาเลือกแผนก";
  }

  if (!employee.position_id) {
    return "กรุณาเลือกตำแหน่ง";
  }

  if (!employee.employment_type_id) {
    return "กรุณาเลือกประเภทการจ้าง";
  }

  if (!employee.employee_status_id) {
    return "กรุณาเลือกสถานะพนักงาน";
  }

  if (!employee.start_work_date) {
    return "กรุณาเลือกวันที่เริ่มงาน";
  }

  if (
    !ALLOWED_EMPLOYEE_STATUSES.includes(
      employee.status
    )
  ) {
    return "สถานะพนักงานไม่ถูกต้อง";
  }

  if (
    employee.probation_days !== null &&
    (
      !Number.isInteger(
        employee.probation_days
      ) ||
      employee.probation_days < 0
    )
  ) {
    return "จำนวนวันทดลองงานต้องเป็นจำนวนเต็มและไม่น้อยกว่า 0";
  }

  if (
    employee.status === "resigned" &&
    !employee.resignation_date
  ) {
    return "พนักงานที่ลาออกต้องระบุวันที่ลาออก";
  }

  if (
    employee.birth_date &&
    employee.start_work_date &&
    !isDateBefore(
      employee.birth_date,
      employee.start_work_date
    )
  ) {
    return "วันเกิดต้องอยู่ก่อนวันที่เริ่มงาน";
  }

  if (
    employee.probation_end_date &&
    employee.start_work_date &&
    isDateBefore(
      employee.probation_end_date,
      employee.start_work_date
    )
  ) {
    return "วันสิ้นสุดทดลองงานต้องไม่น้อยกว่าวันที่เริ่มงาน";
  }

  if (
    employee.confirmation_date &&
    employee.start_work_date &&
    isDateBefore(
      employee.confirmation_date,
      employee.start_work_date
    )
  ) {
    return "วันที่บรรจุต้องไม่น้อยกว่าวันที่เริ่มงาน";
  }

  if (
    employee.resignation_date &&
    employee.start_work_date &&
    isDateBefore(
      employee.resignation_date,
      employee.start_work_date
    )
  ) {
    return "วันที่ลาออกต้องไม่น้อยกว่าวันที่เริ่มงาน";
  }

  if (
    !isValidEmail(
      employee.personal_email
    )
  ) {
    return "อีเมลส่วนตัวไม่ถูกต้อง";
  }

  if (
    !isValidEmail(
      employee.work_email
    )
  ) {
    return "อีเมลบริษัทไม่ถูกต้อง";
  }

  return null;
}

/* =========================================================
   VALIDATE USER ACCOUNT
========================================================= */

export function validateAccountPayload(
  account = {}
) {
  if (
    !account.create_user_account
  ) {
    return null;
  }

  if (!account.role_id) {
    return "กรุณาเลือกบทบาทผู้ใช้งาน";
  }

  if (!account.auth_email) {
    return "กรุณาระบุอีเมลสำหรับสร้างบัญชีผู้ใช้งาน";
  }

  if (
    !isValidEmail(
      account.auth_email
    )
  ) {
    return "อีเมลสำหรับบัญชีผู้ใช้งานไม่ถูกต้อง";
  }

  return null;
}

/* =========================================================
   VALIDATE CODE REQUEST
========================================================= */

export function validateEmployeeCodeRequest(
  codeRequest = {}
) {
  if (
    !codeRequest.employee_code_setting_id
  ) {
    return "กรุณาเลือกรูปแบบรหัสพนักงาน";
  }

  if (
    !ALLOWED_CODE_EMPLOYEE_TYPES.includes(
      codeRequest.employee_type
    )
  ) {
    return "ประเภทสำหรับสร้างรหัสพนักงานไม่ถูกต้อง";
  }

  if (!codeRequest.running_date) {
    return "กรุณาระบุวันที่สำหรับสร้างรหัสพนักงาน";
  }

  return null;
}

/* =========================================================
   VALIDATE CREATE REQUEST
========================================================= */

export function validateEmployeeCreatePayload({
  employee,
  account,
  codeRequest,
}) {
  return (
    validateEmployeePayload(
      employee
    ) ||
    validateAccountPayload(
      account
    ) ||
    validateEmployeeCodeRequest(
      codeRequest
    )
  );
}