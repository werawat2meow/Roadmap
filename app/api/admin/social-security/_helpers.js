import { supabaseAdmin } from "@/lib/supabaseServer";

export const SCHEME_TYPES = [
  "section_33",
  "section_39",
  "section_40",
  "custom",
];

export const METHODS = [
  "percentage",
  "fixed",
];

export const STATUSES = [
  "active",
  "inactive",
];

export function cleanText(value) {
  return String(value || "").trim();
}

export function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

export function cleanCode(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function cleanNumber(value, fallback = 0) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

export function cleanNullableNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

export function cleanBoolean(value, fallback = false) {
  if (value === true || value === false) {
    return value;
  }

  if (value === "true") return true;
  if (value === "false") return false;

  return fallback;
}

export function cleanDate(value) {
  return cleanText(value) || null;
}

export function sanitizeSearch(value) {
  return cleanText(value)
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("%", "")
    .replaceAll("*", "")
    .trim();
}

export function jsonError(
  message,
  status = 500,
  extra = {}
) {
  return Response.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    {
      status,
    }
  );
}

export function getActorId(guard) {
  return (
    guard?.access?.user_account_id ||
    guard?.access?.user?.id ||
    guard?.user?.id ||
    null
  );
}

export function getErrorStatus(error) {
  if (!error) return 500;
  if (error.code === "23505") return 409;

  if (
    [
      "23503",
      "23514",
      "23502",
      "22P02",
    ].includes(error.code)
  ) {
    return 400;
  }

  return 500;
}

export function mapDatabaseError(error) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

  if (error.code === "23505") {
    return "รหัสตั้งค่าซ้ำ หรือมี Default ของบริษัท/ประเภทนี้อยู่แล้ว";
  }

  if (error.code === "23503") {
    return "ข้อมูลประกันสังคมถูกอ้างอิง หรือไม่พบข้อมูลที่เกี่ยวข้อง";
  }

  if (error.code === "23514") {
    return "ข้อมูลประกันสังคมไม่ผ่านเงื่อนไข";
  }

  if (error.code === "23502") {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  if (error.code === "22P02") {
    return "รูปแบบ UUID หรือข้อมูลไม่ถูกต้อง";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

export function normalizePayload(
  body = {},
  current = null
) {
  return {
    company_id:
      cleanText(
        body.company_id ??
        current?.company_id
      ),

    setting_code:
      cleanCode(
        body.setting_code ??
        current?.setting_code
      ),

    setting_name:
      cleanText(
        body.setting_name ??
        current?.setting_name
      ),

    scheme_type:
      cleanText(
        body.scheme_type ??
        current?.scheme_type
      ) || "section_33",

    contribution_method:
      cleanText(
        body.contribution_method ??
        current?.contribution_method
      ) || "percentage",

    wage_base_min:
      cleanNumber(
        body.wage_base_min ??
        current?.wage_base_min,
        0
      ),

    wage_base_max:
      cleanNullableNumber(
        body.wage_base_max ??
        current?.wage_base_max
      ),

    employee_rate_percent:
      cleanNumber(
        body.employee_rate_percent ??
        current?.employee_rate_percent,
        0
      ),

    employer_rate_percent:
      cleanNumber(
        body.employer_rate_percent ??
        current?.employer_rate_percent,
        0
      ),

    employee_contribution_min:
      cleanNullableNumber(
        body.employee_contribution_min ??
        current?.employee_contribution_min
      ),

    employee_contribution_max:
      cleanNullableNumber(
        body.employee_contribution_max ??
        current?.employee_contribution_max
      ),

    employer_contribution_min:
      cleanNullableNumber(
        body.employer_contribution_min ??
        current?.employer_contribution_min
      ),

    employer_contribution_max:
      cleanNullableNumber(
        body.employer_contribution_max ??
        current?.employer_contribution_max
      ),

    fixed_employee_amount:
      cleanNullableNumber(
        body.fixed_employee_amount ??
        current?.fixed_employee_amount
      ),

    fixed_employer_amount:
      cleanNullableNumber(
        body.fixed_employer_amount ??
        current?.fixed_employer_amount
      ),

    effective_date:
      cleanDate(
        body.effective_date ??
        current?.effective_date
      ),

    expire_date:
      cleanDate(
        body.expire_date ??
        current?.expire_date
      ),

    status:
      cleanText(
        body.status ??
        current?.status
      ) || "active",

    is_default:
      cleanBoolean(
        body.is_default ??
        current?.is_default,
        false
      ),

    remark:
      cleanNullableText(
        body.remark ??
        current?.remark
      ),
  };
}

export function validatePayload(payload) {
  if (!payload.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (!payload.setting_code) {
    return "กรุณากรอกรหัสการตั้งค่า";
  }

  if (!payload.setting_name) {
    return "กรุณากรอกชื่อการตั้งค่า";
  }

  if (
    !SCHEME_TYPES.includes(
      payload.scheme_type
    )
  ) {
    return "ประเภทผู้ประกันตนไม่ถูกต้อง";
  }

  if (
    !METHODS.includes(
      payload.contribution_method
    )
  ) {
    return "วิธีคำนวณเงินสมทบไม่ถูกต้อง";
  }

  if (
    payload.wage_base_min < 0 ||
    (
      payload.wage_base_max !== null &&
      payload.wage_base_max <
        payload.wage_base_min
    )
  ) {
    return "ช่วงฐานค่าจ้างไม่ถูกต้อง";
  }

  for (
    const rate of [
      payload.employee_rate_percent,
      payload.employer_rate_percent,
    ]
  ) {
    if (
      rate < 0 ||
      rate > 100
    ) {
      return "อัตราเงินสมทบต้องอยู่ระหว่าง 0 - 100%";
    }
  }

  const pairs = [
    [
      payload.employee_contribution_min,
      payload.employee_contribution_max,
      "เงินสมทบพนักงาน",
    ],
    [
      payload.employer_contribution_min,
      payload.employer_contribution_max,
      "เงินสมทบนายจ้าง",
    ],
  ];

  for (const [min, max, label] of pairs) {
    if (
      (min !== null && min < 0) ||
      (max !== null && max < 0)
    ) {
      return `${label}ต้องไม่น้อยกว่า 0`;
    }

    if (
      min !== null &&
      max !== null &&
      max < min
    ) {
      return `${label}: ค่าสูงสุดต้องไม่น้อยกว่าค่าต่ำสุด`;
    }
  }

  if (
    payload.fixed_employee_amount !== null &&
    payload.fixed_employee_amount < 0
  ) {
    return "เงินสมทบพนักงานแบบคงที่ต้องไม่น้อยกว่า 0";
  }

  if (
    payload.fixed_employer_amount !== null &&
    payload.fixed_employer_amount < 0
  ) {
    return "เงินสมทบนายจ้างแบบคงที่ต้องไม่น้อยกว่า 0";
  }

  if (!payload.effective_date) {
    return "กรุณาระบุวันที่มีผล";
  }

  if (
    payload.expire_date &&
    payload.expire_date <
      payload.effective_date
  ) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่มีผล";
  }

  if (
    !STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  if (
    payload.is_default &&
    payload.status !== "active"
  ) {
    return "Default ต้องอยู่ในสถานะ Active";
  }

  return null;
}

export async function unsetOtherDefaults({
  companyId,
  schemeType,
  excludeId = null,
}) {
  let query =
    supabaseAdmin
      .from(
        "social_security_settings"
      )
      .update({
        is_default: false,
        updated_at:
          new Date().toISOString(),
      })
      .eq("company_id", companyId)
      .eq("scheme_type", schemeType)
      .eq("is_default", true);

  if (excludeId) {
    query =
      query.neq(
        "id",
        excludeId
      );
  }

  const {
    error,
  } =
    await query;

  if (error) {
    throw error;
  }
}

export async function loadSetting(id) {
  return supabaseAdmin
    .from(
      "social_security_settings"
    )
    .select(
      `
        *,
        companies:company_id (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `
    )
    .eq("id", id)
    .maybeSingle();
}
