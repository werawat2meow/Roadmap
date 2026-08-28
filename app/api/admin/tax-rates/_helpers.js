import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

export const CALCULATION_METHODS = [
  "progressive",
  "flat",
];

export const TAX_RATE_STATUSES = [
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

export function cleanInteger(value, fallback = 0) {
  const parsed = Number.parseInt(
    String(value ?? ""),
    10
  );

  return Number.isInteger(parsed)
    ? parsed
    : fallback;
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

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

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

  if (error.code === "23505") {
    return 409;
  }

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
    return "รหัสชุดอัตราภาษีซ้ำ หรือมีชุด Default ของบริษัท/ปีนี้อยู่แล้ว";
  }

  if (error.code === "23503") {
    return "ข้อมูลอัตราภาษีถูกอ้างอิง หรือไม่พบข้อมูลที่เกี่ยวข้อง";
  }

  if (error.code === "23514") {
    return "ข้อมูลอัตราภาษีไม่ผ่านเงื่อนไข";
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

export function normalizeHeader(
  body = {},
  current = null
) {
  return {
    company_id:
      cleanText(
        body.company_id ??
        current?.company_id
      ),

    tax_rate_code:
      cleanCode(
        body.tax_rate_code ??
        current?.tax_rate_code
      ),

    tax_rate_name:
      cleanText(
        body.tax_rate_name ??
        current?.tax_rate_name
      ),

    tax_year:
      cleanInteger(
        body.tax_year ??
        current?.tax_year,
        new Date().getFullYear()
      ),

    calculation_method:
      cleanText(
        body.calculation_method ??
        current?.calculation_method
      ) || "progressive",

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

export function normalizeBrackets(
  rows
) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map(
    (row, index) => ({
      bracket_no:
        index + 1,

      income_min:
        cleanNumber(
          row?.income_min,
          0
        ),

      income_max:
        cleanNullableNumber(
          row?.income_max
        ),

      tax_rate_percent:
        cleanNumber(
          row?.tax_rate_percent,
          0
        ),

      sort_order:
        index + 1,
    })
  );
}

export function validateHeader(
  payload
) {
  if (!payload.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (!payload.tax_rate_code) {
    return "กรุณากรอกรหัสชุดอัตราภาษี";
  }

  if (!payload.tax_rate_name) {
    return "กรุณากรอกชื่อชุดอัตราภาษี";
  }

  if (
    payload.tax_year < 2000 ||
    payload.tax_year > 2200
  ) {
    return "ปีภาษีต้องอยู่ระหว่าง 2000 - 2200";
  }

  if (
    !CALCULATION_METHODS.includes(
      payload.calculation_method
    )
  ) {
    return "วิธีคำนวณภาษีไม่ถูกต้อง";
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
    !TAX_RATE_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะชุดอัตราภาษีไม่ถูกต้อง";
  }

  if (
    payload.is_default &&
    payload.status !== "active"
  ) {
    return "ชุด Default ต้องอยู่ในสถานะ Active";
  }

  return null;
}

export function validateBrackets(
  brackets,
  calculationMethod
) {
  if (!Array.isArray(brackets) || brackets.length === 0) {
    return "กรุณาเพิ่มขั้นอัตราภาษีอย่างน้อย 1 ขั้น";
  }

  if (
    calculationMethod === "flat" &&
    brackets.length !== 1
  ) {
    return "วิธี Flat Rate ต้องมีอัตราภาษีเพียง 1 ขั้น";
  }

  for (
    let index = 0;
    index < brackets.length;
    index += 1
  ) {
    const row =
      brackets[index];

    if (
      row.income_min < 0
    ) {
      return `ขั้นที่ ${index + 1}: รายได้เริ่มต้นต้องไม่น้อยกว่า 0`;
    }

    if (
      row.income_max !== null &&
      row.income_max <
        row.income_min
    ) {
      return `ขั้นที่ ${index + 1}: รายได้สิ้นสุดต้องไม่น้อยกว่ารายได้เริ่มต้น`;
    }

    if (
      row.tax_rate_percent < 0 ||
      row.tax_rate_percent > 100
    ) {
      return `ขั้นที่ ${index + 1}: อัตราภาษีต้องอยู่ระหว่าง 0 - 100%`;
    }

    if (
      row.income_max === null &&
      index !== brackets.length - 1
    ) {
      return `ขั้นที่ ${index + 1}: ขั้นที่ไม่มีเพดานรายได้ต้องเป็นขั้นสุดท้าย`;
    }

    if (index > 0) {
      const previous =
        brackets[index - 1];

      if (
        previous.income_max === null
      ) {
        return `ขั้นที่ ${index}: ขั้นก่อนหน้าไม่มีเพดาน จึงไม่สามารถมีขั้นถัดไปได้`;
      }

      if (
        row.income_min <
        previous.income_max
      ) {
        return `ขั้นที่ ${index + 1}: ช่วงรายได้ซ้อนทับกับขั้นก่อนหน้า`;
      }
    }
  }

  return null;
}

export async function unsetOtherDefaults({
  companyId,
  taxYear,
  excludeId = null,
}) {
  let query =
    supabaseAdmin
      .from("tax_rate_sets")
      .update({
        is_default: false,
        updated_at:
          new Date().toISOString(),
      })
      .eq("company_id", companyId)
      .eq("tax_year", taxYear)
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

export async function loadTaxRateSet(
  id
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("tax_rate_sets")
      .select(
        `
          id,
          company_id,
          tax_rate_code,
          tax_rate_name,
          tax_year,
          calculation_method,
          effective_date,
          expire_date,
          status,
          is_default,
          remark,
          created_by,
          updated_by,
          created_at,
          updated_at,
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

  if (error || !data) {
    return {
      data,
      error,
    };
  }

  const {
    data: brackets,
    error: bracketError,
  } =
    await supabaseAdmin
      .from("tax_rate_brackets")
      .select(
        `
          id,
          tax_rate_set_id,
          bracket_no,
          income_min,
          income_max,
          tax_rate_percent,
          sort_order,
          created_at,
          updated_at
        `
      )
      .eq(
        "tax_rate_set_id",
        id
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      )
      .order(
        "bracket_no",
        {
          ascending: true,
        }
      );

  if (bracketError) {
    return {
      data: null,
      error:
        bracketError,
    };
  }

  return {
    data: {
      ...data,
      brackets:
        brackets || [],
    },
    error: null,
  };
}
