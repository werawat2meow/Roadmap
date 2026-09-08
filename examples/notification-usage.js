/* =========================================================
   ตัวอย่างการเรียก Notification จาก API Module อื่น

   ไฟล์นี้เป็น EXAMPLE เท่านั้น
   ไม่ต้องวางใน app ถ้ายังไม่ได้ใช้
========================================================= */

import {
  createNotification,
} from "@/lib/notifications/createNotification";

/* =========================================================
   1. พนักงานใหม่
========================================================= */

export async function notifyEmployeeCreated({
  recipientUserAccountId,
  employee,
  companyId,
  createdBy,
}) {
  return createNotification({
    user_account_id:
      recipientUserAccountId,

    company_id:
      companyId,

    notification_type:
      "employee_created",

    title:
      "มีพนักงานใหม่ในระบบ",

    message:
      `${employee.employee_code || "-"} ${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim(),

    module_code:
      "employees",

    entity_type:
      "employee",

    entity_id:
      employee.id,

    action_url:
      "/admin/employees",

    priority:
      "info",

    dedupe_key:
      `employee-created:${employee.id}`,

    created_by:
      createdBy,
  });
}

/* =========================================================
   2. ใกล้ครบทดลองงาน
========================================================= */

export async function notifyProbationExpiring({
  recipientUserAccountId,
  employee,
  probationEndDate,
  companyId,
}) {
  return createNotification({
    user_account_id:
      recipientUserAccountId,

    company_id:
      companyId,

    notification_type:
      "probation_expiring",

    title:
      "พนักงานใกล้ครบทดลองงาน",

    message:
      `${employee.employee_code || "-"} ${employee.first_name_th || ""} ${employee.last_name_th || ""} ครบทดลองงาน ${probationEndDate}`.trim(),

    module_code:
      "employees",

    entity_type:
      "employee",

    entity_id:
      employee.id,

    action_url:
      "/admin/employees",

    priority:
      "warning",

    dedupe_key:
      `probation:${employee.id}:${probationEndDate}`,
  });
}

/* =========================================================
   3. Password / Security
========================================================= */

export async function notifyPasswordChanged({
  userAccountId,
}) {
  return createNotification({
    user_account_id:
      userAccountId,

    notification_type:
      "password_changed",

    title:
      "รหัสผ่านของคุณถูกเปลี่ยน",

    message:
      "หากคุณไม่ได้เป็นผู้ดำเนินการ กรุณาติดต่อผู้ดูแลระบบทันที",

    module_code:
      "security",

    entity_type:
      "user_account",

    entity_id:
      userAccountId,

    action_url:
      "/admin/change-password",

    priority:
      "critical",
  });
}

/* =========================================================
   4. Scope เปลี่ยน
========================================================= */

export async function notifyScopeChanged({
  userAccountId,
  assignmentId,
  changedBy,
}) {
  return createNotification({
    user_account_id:
      userAccountId,

    notification_type:
      "scope_changed",

    title:
      "ขอบเขตการทำงานของคุณมีการเปลี่ยนแปลง",

    message:
      "สิทธิ์การเข้าถึงข้อมูลของคุณถูกอัปเดต กรุณาตรวจสอบข้อมูลที่สามารถเข้าถึงได้อีกครั้ง",

    module_code:
      "security",

    entity_type:
      "user_access_assignment",

    entity_id:
      assignmentId,

    priority:
      "warning",

    created_by:
      changedBy,
  });
}
