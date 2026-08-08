import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
   Constants
========================================================= */

const ALLOWED_RESET_POLICIES = [
  "never",
  "yearly",
  "monthly",
];

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

/* =========================================================
   Helpers
========================================================= */

function cleanText(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
}

function cleanNullableText(value) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function parsePositiveInteger(value, fallback = 1) {
  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === 1 || value === "1") {
    return true;
  }

  if (value === "false" || value === 0 || value === "0") {
    return false;
  }

  return fallback;
}

function normalizeDate(value) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function normalizePayload(body = {}) {
  return {
    company_id:
      cleanNullableText(body.company_id),

    code_name:
      cleanText(body.code_name),

    code_pattern:
      cleanText(body.code_pattern) ||
      "{TYPE}{YY}{RUNNING}",

    running_digits:
      parsePositiveInteger(
        body.running_digits,
        4
      ),

    year_digits:
      Number(body.year_digits) === 4
        ? 4
        : 2,

    executive_digit:
      cleanText(body.executive_digit) || "9",

    thai_digit:
      cleanText(body.thai_digit) || "1",

    non_b_digit:
      cleanText(body.non_b_digit) || "2",

    myanmar_digit:
      cleanText(body.myanmar_digit) || "3",

    parttime_digit:
      cleanText(body.parttime_digit) || "4",

    running_start:
      parsePositiveInteger(
        body.running_start,
        1
      ),

    reset_policy:
      ALLOWED_RESET_POLICIES.includes(
        cleanText(body.reset_policy)
      )
        ? cleanText(body.reset_policy)
        : "yearly",

    is_default:
      parseBoolean(
        body.is_default,
        false
      ),

    effective_date:
      normalizeDate(body.effective_date) ||
      new Date().toISOString().slice(0, 10),

    expire_date:
      normalizeDate(body.expire_date),

    status:
      ALLOWED_STATUSES.includes(
        cleanText(body.status)
      )
        ? cleanText(body.status)
        : "active",

    remark:
      cleanNullableText(body.remark),

    created_by:
      cleanNullableText(body.created_by),

    updated_by:
      cleanNullableText(body.updated_by),
  };
}

function validatePayload(payload) {
  if (!payload.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (!payload.code_name) {
    return "กรุณากรอกชื่อรูปแบบรหัส";
  }

  if (!payload.code_pattern) {
    return "กรุณากรอกรูปแบบรหัสพนักงาน";
  }

  if (
    payload.running_digits < 1 ||
    payload.running_digits > 12
  ) {
    return "จำนวนหลัก Running ต้องอยู่ระหว่าง 1 ถึง 12";
  }

  if (![2, 4].includes(payload.year_digits)) {
    return "จำนวนหลักปีต้องเป็น 2 หรือ 4 เท่านั้น";
  }

  if (payload.running_start < 1) {
    return "เลขเริ่มต้น Running ต้องไม่น้อยกว่า 1";
  }

  if (
    !ALLOWED_RESET_POLICIES.includes(
      payload.reset_policy
    )
  ) {
    return "นโยบายรีเซ็ตเลข Running ไม่ถูกต้อง";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  if (
    payload.expire_date &&
    payload.expire_date < payload.effective_date
  ) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้งาน";
  }

  const typeDigits = [
    payload.executive_digit,
    payload.thai_digit,
    payload.non_b_digit,
    payload.myanmar_digit,
    payload.parttime_digit,
  ];

  if (typeDigits.some((item) => !item)) {
    return "รหัสประเภทพนักงานต้องไม่เป็นค่าว่าง";
  }

  if (
    new Set(typeDigits).size !==
    typeDigits.length
  ) {
    return "รหัสประเภทพนักงานแต่ละประเภทต้องไม่ซ้ำกัน";
  }

  return null;
}

function mapDatabaseError(error) {
  if (!error) {
    return "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
  }

  if (error.code === "23505") {
    if (
      error.message?.includes(
        "employee_code_settings_company_code_name_key"
      )
    ) {
      return "ชื่อรูปแบบรหัสนี้มีอยู่แล้วในบริษัท";
    }

    if (
      error.message?.includes(
        "uq_employee_code_settings_company_default"
      )
    ) {
      return "บริษัทนี้มีรูปแบบรหัสหลักอยู่แล้ว";
    }

    return "พบข้อมูลซ้ำในระบบ";
  }

  if (error.code === "23503") {
    return "ไม่พบบริษัทหรือผู้ใช้งานที่อ้างอิง";
  }

  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  return error.message || "เกิดข้อผิดพลาดในฐานข้อมูล";
}

/* =========================================================
   GET
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const companyId =
      searchParams.get("company_id")?.trim() || "";

    const status =
      searchParams.get("status")?.trim() || "";

    const resetPolicy =
      searchParams.get("reset_policy")?.trim() || "";

    const isDefaultParam =
      searchParams.get("is_default");

    const all =
      searchParams.get("all") === "true";

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(searchParams.get("pageSize")) || 20,
        1
      ),
      100
    );

    let query = supabaseAdmin
      .from("employee_code_settings")
      .select(
        `
          id,
          company_id,
          code_name,
          code_pattern,
          running_digits,
          year_digits,
          executive_digit,
          thai_digit,
          non_b_digit,
          myanmar_digit,
          parttime_digit,
          running_start,
          reset_policy,
          is_default,
          effective_date,
          expire_date,
          status,
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
        `,
        {
          count: all ? undefined : "exact",
        }
      );

    if (search) {
      const escapedSearch = search
        .replaceAll(",", " ")
        .trim();

      query = query.or(
        [
          `code_name.ilike.%${escapedSearch}%`,
          `code_pattern.ilike.%${escapedSearch}%`,
          `remark.ilike.%${escapedSearch}%`,
        ].join(",")
      );
    }

    if (companyId) {
      query = query.eq(
        "company_id",
        companyId
      );
    }

    if (
      status &&
      ALLOWED_STATUSES.includes(status)
    ) {
      query = query.eq("status", status);
    }

    if (
      resetPolicy &&
      ALLOWED_RESET_POLICIES.includes(
        resetPolicy
      )
    ) {
      query = query.eq(
        "reset_policy",
        resetPolicy
      );
    }

    if (isDefaultParam === "true") {
      query = query.eq(
        "is_default",
        true
      );
    }

    if (isDefaultParam === "false") {
      query = query.eq(
        "is_default",
        false
      );
    }

    query = query
      .order("is_default", {
        ascending: false,
      })
      .order("effective_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (all) {
      query = query.limit(1000);
    } else {
      const from =
        (page - 1) * pageSize;

      const to =
        from + pageSize - 1;

      query = query.range(from, to);
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      console.error(
        "GET employee-code-settings error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถโหลดการตั้งค่ารหัสพนักงานได้",
          error: mapDatabaseError(error),
        },
        {
          status: 500,
        }
      );
    }

    if (all) {
      return NextResponse.json({
        success: true,
        data: data || [],
        total: data?.length || 0,
      });
    }

    const total = count || 0;
    const totalPages = Math.max(
      Math.ceil(total / pageSize),
      1
    );

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET employee-code-settings exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการโหลดการตั้งค่ารหัสพนักงาน",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();
    const payload = normalizePayload(body);

    const validationError =
      validatePayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message: validationError,
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       ตรวจสอบบริษัท
    ----------------------------------------------------- */

    const {
      data: company,
      error: companyError,
    } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("id", payload.company_id)
      .maybeSingle();

    if (companyError) {
      console.error(
        "Check company error:",
        companyError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบข้อมูลบริษัทได้",
        },
        {
          status: 500,
        }
      );
    }

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบบริษัทที่เลือก",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       ตรวจชื่อซ้ำภายในบริษัท
    ----------------------------------------------------- */

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .select("id")
      .eq("company_id", payload.company_id)
      .ilike("code_name", payload.code_name)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        "Check duplicate code name error:",
        duplicateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบชื่อรูปแบบรหัสได้",
        },
        {
          status: 500,
        }
      );
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ชื่อรูปแบบรหัสนี้มีอยู่แล้วในบริษัท",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       ถ้ายังไม่มี Setting ในบริษัท
       ให้รายการแรกเป็น Default อัตโนมัติ
    ----------------------------------------------------- */

    const {
      count: companySettingCount,
      error: countError,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("company_id", payload.company_id);

    if (countError) {
      console.error(
        "Count company settings error:",
        countError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบการตั้งค่าของบริษัทได้",
        },
        {
          status: 500,
        }
      );
    }

    if ((companySettingCount || 0) === 0) {
      payload.is_default = true;
    }

    /* -----------------------------------------------------
       หากรายการใหม่เป็น Default
       ปลด Default รายการเดิมก่อน
    ----------------------------------------------------- */

    if (payload.is_default) {
      const {
        error: clearDefaultError,
      } = await supabaseAdmin
        .from("employee_code_settings")
        .update({
          is_default: false,
          updated_by: payload.updated_by,
          updated_at:
            new Date().toISOString(),
        })
        .eq("company_id", payload.company_id)
        .eq("is_default", true);

      if (clearDefaultError) {
        console.error(
          "Clear current default error:",
          clearDefaultError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถเปลี่ยนรูปแบบรหัสหลักของบริษัทได้",
            error:
              mapDatabaseError(
                clearDefaultError
              ),
          },
          {
            status: 500,
          }
        );
      }
    }

    /* -----------------------------------------------------
       Insert
    ----------------------------------------------------- */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .insert(payload)
      .select(
        `
          id,
          company_id,
          code_name,
          code_pattern,
          running_digits,
          year_digits,
          executive_digit,
          thai_digit,
          non_b_digit,
          myanmar_digit,
          parttime_digit,
          running_start,
          reset_policy,
          is_default,
          effective_date,
          expire_date,
          status,
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
      .single();

    if (error) {
      console.error(
        "POST employee-code-settings error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message: mapDatabaseError(error),
          error: error.message,
        },
        {
          status:
            error.code === "23505"
              ? 409
              : 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "เพิ่มการตั้งค่ารหัสพนักงานเรียบร้อยแล้ว",
        data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST employee-code-settings exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการเพิ่มการตั้งค่ารหัสพนักงาน",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}