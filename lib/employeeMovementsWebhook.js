
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
   Employee Movement → Assets Webhook
========================================================= */

const WEBHOOK_URL =
  process.env.ASSETS_WEBHOOK_URL;

const WEBHOOK_API_KEY =
  process.env.ASSETS_WEBHOOK_HEADER_VALUE;

const WEBHOOK_TIMEOUT = Number(
  process.env.ASSETS_WEBHOOK_TIMEOUT_MS || 10000
);

/* =========================================================
   Helpers
========================================================= */

async function getMasterRecord(table, id, columns) {
  if (!id) return null;

  const { data, error } = await supabaseAdmin
    .from(table)
    .select(columns)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data || null;
}

function getFullName(employee) {
  return [
    employee.first_name_th,
    employee.middle_name_th,
    employee.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function makeReference(record, nameField) {
  return {
    id: record?.id || null,
    name: record?.[nameField] || null,
  };
}

/* =========================================================
   Build Payload
========================================================= */

export async function buildEmployeeStatusWebhookPayload(
  employeeId
) {
  if (!employeeId) {
    throw new Error("Employee ID is required");
  }

  const { data: employee, error } =
    await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        middle_name_th,
        last_name_th,
        nickname_th,
        nick_name,
        company_id,
        branch_id,
        department_id,
        position_id,
        position_level_id,
        employee_status_id
      `)
      .eq("id", employeeId)
      .maybeSingle();

  if (error) throw error;

  if (!employee) {
    throw new Error("Employee not found");
  }

  const [
    status,
    company,
    branch,
    department,
    position,
    positionLevel,
  ] = await Promise.all([
    getMasterRecord(
      "employee_statuses",
      employee.employee_status_id,
      "id,status_code,status_name"
    ),

    getMasterRecord(
      "companies",
      employee.company_id,
      "id,company_code,company_name_th"
    ),

    getMasterRecord(
      "branches",
      employee.branch_id,
      "id,branch_code,branch_name"
    ),

    getMasterRecord(
      "departments",
      employee.department_id,
      "id,department_code,department_name"
    ),

    getMasterRecord(
      "positions",
      employee.position_id,
      "id,position_code,position_name"
    ),

    getMasterRecord(
      "position_levels",
      employee.position_level_id,
      "id,level_code,level_name"
    ),
  ]);

  if (!status) {
    throw new Error("Employee status not found");
  }

  /*
   * ตรวจสอบ Mapping กับทีม Assets ก่อนใช้งานจริง:
   *
   * status_id:
   *   HRMS ใช้ UUID ส่วนตัวอย่าง Assets ใช้ตัวเลข
   *
   * brand:
   *   ตอนนี้ใช้ Branch เป็นตัวแทนชั่วคราว
   *   หาก Assets ใช้ Brand ID แยก ต้องใช้ Mapping จริง
   *
   * level:
   *   ใช้ level_code จาก Position Level Master
   */

  const payload = {
    id: employee.id,

    emp_id: employee.employee_code,

    full_name: getFullName(employee),

    nickname:
      employee.nickname_th ||
      employee.nick_name ||
      "",

    level:
      positionLevel?.level_code || null,

    status_id: status.id,

    status_name: status.status_name,

    brand: makeReference(
      branch,
      "branch_name"
    ),

    department: makeReference(
      department,
      "department_name"
    ),

    position: makeReference(
      position,
      "position_name"
    ),
  };

  return payload;
}

/* =========================================================
   Send Webhook
========================================================= */

export async function sendEmployeeStatusWebhook(
  employeeId
) {
  if (!WEBHOOK_URL) {
    throw new Error(
      "ASSETS_WEBHOOK_URL is not configured"
    );
  }

  if (!WEBHOOK_API_KEY) {
    throw new Error(
      "ASSETS_WEBHOOK_HEADER_VALUE is not configured"
    );
  }

  const payload =
    await buildEmployeeStatusWebhookPayload(
      employeeId
    );

  const timeout =
    Number.isFinite(WEBHOOK_TIMEOUT) &&
    WEBHOOK_TIMEOUT > 0
      ? WEBHOOK_TIMEOUT
      : 10000;

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-api-key": WEBHOOK_API_KEY,
    },

    body: JSON.stringify(payload),

    cache: "no-store",

    signal: AbortSignal.timeout(timeout),
  });

  const responseText = await response.text();

  let result = null;

  try {
    result = responseText
      ? JSON.parse(responseText)
      : null;
  } catch {
    throw new Error(
      `Assets Webhook returned invalid JSON (HTTP ${response.status})`
    );
  }

  if (
    !response.ok ||
    result?.success !== true
  ) {
    throw new Error(
      `Assets Webhook failed (HTTP ${response.status}): ${
        result?.message ||
        result?.error ||
        "Unknown error"
      }`
    );
  }

  return {
    success: true,
    payload,
    response: result,
  };
}
