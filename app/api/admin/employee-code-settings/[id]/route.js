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

function normalizePayload(body = {}, current = {}) {
  return {
    company_id:
      body.company_id !== undefined
        ? cleanNullableText(body.company_id)
        : current.company_id,

    code_name:
      body.code_name !== undefined
        ? cleanText(body.code_name)
        : current.code_name,

    code_pattern:
      body.code_pattern !== undefined
        ? cleanText(body.code_pattern)
        : current.code_pattern,

    running_digits:
      body.running_digits !== undefined
        ? parsePositiveInteger(
            body.running_digits,
            current.running_digits || 4
          )
        : current.running_digits,

    year_digits:
      body.year_digits !== undefined
        ? Number(body.year_digits) === 4
          ? 4
          : 2
        : current.year_digits,

    executive_digit:
      body.executive_digit !== undefined
        ? cleanText(body.executive_digit)
        : current.executive_digit,

    thai_digit:
      body.thai_digit !== undefined
        ? cleanText(body.thai_digit)
        : current.thai_digit,

    non_b_digit:
      body.non_b_digit !== undefined
        ? cleanText(body.non_b_digit)
        : current.non_b_digit,

    myanmar_digit:
      body.myanmar_digit !== undefined
        ? cleanText(body.myanmar_digit)
        : current.myanmar_digit,

    parttime_digit:
      body.parttime_digit !== undefined
        ? cleanText(body.parttime_digit)
        : current.parttime_digit,

    running_start:
      body.running_start !== undefined
        ? parsePositiveInteger(
            body.running_start,
            current.running_start || 1
          )
        : current.running_start,

    reset_policy:
      body.reset_policy !== undefined
        ? cleanText(body.reset_policy)
        : current.reset_policy,

    is_default:
      body.is_default !== undefined
        ? parseBoolean(
            body.is_default,
            current.is_default
          )
        : current.is_default,

    effective_date:
      body.effective_date !== undefined
        ? normalizeDate(body.effective_date)
        : current.effective_date,

    expire_date:
      body.expire_date !== undefined
        ? normalizeDate(body.expire_date)
        : current.expire_date,

    status:
      body.status !== undefined
        ? cleanText(body.status)
        : current.status,

    remark:
      body.remark !== undefined
        ? cleanNullableText(body.remark)
        : current.remark,

    updated_by:
      body.updated_by !== undefined
        ? cleanNullableText(body.updated_by)
        : current.updated_by,
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
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
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
    return "ข้อมูลนี้ถูกใช้งานหรือมีข้อมูลอื่นอ้างอิงอยู่";
  }

  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  return error.message || "เกิดข้อผิดพลาดในฐานข้อมูล";
}

/* =========================================================
   GET BY ID
========================================================= */

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัสการตั้งค่ารหัสพนักงาน",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
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
        `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(
        "GET employee-code-settings/[id] error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถโหลดรายละเอียดการตั้งค่ารหัสพนักงานได้",
          error: mapDatabaseError(error),
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบข้อมูลการตั้งค่ารหัสพนักงาน",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET employee-code-settings/[id] exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการโหลดรายละเอียด",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัสการตั้งค่ารหัสพนักงาน",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       อ่านข้อมูลเดิม
    ----------------------------------------------------- */

    const {
      data: current,
      error: currentError,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      console.error(
        "Load current setting error:",
        currentError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถโหลดข้อมูลเดิมได้",
          error:
            mapDatabaseError(currentError),
        },
        {
          status: 500,
        }
      );
    }

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบข้อมูลการตั้งค่ารหัสพนักงาน",
        },
        {
          status: 404,
        }
      );
    }

    const payload = normalizePayload(
      body,
      current
    );

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
       ถ้ามี Counter แล้ว ไม่อนุญาตย้ายบริษัท
    ----------------------------------------------------- */

    if (
      payload.company_id !==
      current.company_id
    ) {
      const {
        count: counterCount,
        error: counterError,
      } = await supabaseAdmin
        .from("employee_code_counters")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("setting_id", id);

      if (counterError) {
        console.error(
          "Check counters error:",
          counterError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถตรวจสอบเลข Running ที่ใช้งานแล้วได้",
          },
          {
            status: 500,
          }
        );
      }

      if ((counterCount || 0) > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถเปลี่ยนบริษัทได้ เนื่องจากรูปแบบรหัสนี้มีเลข Running ถูกใช้งานแล้ว",
          },
          {
            status: 409,
          }
        );
      }
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
       ตรวจชื่อซ้ำโดยไม่นับรายการปัจจุบัน
    ----------------------------------------------------- */

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .select("id")
      .eq("company_id", payload.company_id)
      .ilike("code_name", payload.code_name)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      console.error(
        "Check duplicate update error:",
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
       ไม่ให้ปิด Default หากไม่มี Default ตัวอื่น
    ----------------------------------------------------- */

    if (
      current.is_default &&
      !payload.is_default
    ) {
      const {
        data: anotherDefault,
        error: anotherDefaultError,
      } = await supabaseAdmin
        .from("employee_code_settings")
        .select("id")
        .eq("company_id", current.company_id)
        .eq("is_default", true)
        .neq("id", id)
        .maybeSingle();

      if (anotherDefaultError) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถตรวจสอบรูปแบบรหัสหลักได้",
          },
          {
            status: 500,
          }
        );
      }

      if (!anotherDefault) {
        return NextResponse.json(
          {
            success: false,
            message:
              "บริษัทต้องมีรูปแบบรหัสหลักอย่างน้อยหนึ่งรายการ กรุณาตั้งรายการอื่นเป็นค่าเริ่มต้นก่อน",
          },
          {
            status: 409,
          }
        );
      }
    }

    /* -----------------------------------------------------
       หากตั้งเป็น Default
       ปลด Default รายการอื่นในบริษัท
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
        .eq("is_default", true)
        .neq("id", id);

      if (clearDefaultError) {
        console.error(
          "Clear other default error:",
          clearDefaultError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถเปลี่ยนรูปแบบรหัสหลักได้",
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
       Update
    ----------------------------------------------------- */

    const updatePayload = {
      company_id: payload.company_id,
      code_name: payload.code_name,
      code_pattern: payload.code_pattern,
      running_digits:
        payload.running_digits,
      year_digits: payload.year_digits,
      executive_digit:
        payload.executive_digit,
      thai_digit: payload.thai_digit,
      non_b_digit: payload.non_b_digit,
      myanmar_digit:
        payload.myanmar_digit,
      parttime_digit:
        payload.parttime_digit,
      running_start:
        payload.running_start,
      reset_policy:
        payload.reset_policy,
      is_default: payload.is_default,
      effective_date:
        payload.effective_date,
      expire_date: payload.expire_date,
      status: payload.status,
      remark: payload.remark,
      updated_by: payload.updated_by,
      updated_at:
        new Date().toISOString(),
    };

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .update(updatePayload)
      .eq("id", id)
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
        "PATCH employee-code-settings error:",
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

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขการตั้งค่ารหัสพนักงานเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "PATCH employee-code-settings exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการแก้ไขการตั้งค่ารหัสพนักงาน",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัสการตั้งค่ารหัสพนักงาน",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       อ่านรายการก่อนลบ
    ----------------------------------------------------- */

    const {
      data: current,
      error: currentError,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .select(
        `
          id,
          company_id,
          code_name,
          is_default
        `
      )
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบข้อมูลก่อนลบได้",
          error:
            mapDatabaseError(currentError),
        },
        {
          status: 500,
        }
      );
    }

    if (!current) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบข้อมูลการตั้งค่ารหัสพนักงาน",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       หากลบ Default
       หา Setting อื่นไว้ตั้งเป็น Default
    ----------------------------------------------------- */

    let nextDefaultId = null;

    if (current.is_default) {
      const {
        data: nextDefault,
        error: nextDefaultError,
      } = await supabaseAdmin
        .from("employee_code_settings")
        .select("id")
        .eq("company_id", current.company_id)
        .neq("id", id)
        .order("status", {
          ascending: true,
        })
        .order("effective_date", {
          ascending: false,
        })
        .order("created_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (nextDefaultError) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถตรวจสอบรูปแบบรหัสทดแทนได้",
          },
          {
            status: 500,
          }
        );
      }

      nextDefaultId =
        nextDefault?.id || null;
    }

    /* -----------------------------------------------------
       Delete

       employee_code_counters จะถูกลบตาม
       on delete cascade
    ----------------------------------------------------- */

    const {
      error: deleteError,
    } = await supabaseAdmin
      .from("employee_code_settings")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "DELETE employee-code-settings error:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            mapDatabaseError(deleteError),
          error: deleteError.message,
        },
        {
          status:
            deleteError.code === "23503"
              ? 409
              : 500,
        }
      );
    }

    /* -----------------------------------------------------
       ตั้งรายการอื่นเป็น Default หลังลบสำเร็จ
    ----------------------------------------------------- */

    if (nextDefaultId) {
      const {
        error: setDefaultError,
      } = await supabaseAdmin
        .from("employee_code_settings")
        .update({
          is_default: true,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", nextDefaultId);

      if (setDefaultError) {
        console.error(
          "Set replacement default error:",
          setDefaultError
        );

        return NextResponse.json(
          {
            success: true,
            message:
              "ลบการตั้งค่ารหัสพนักงานแล้ว แต่ไม่สามารถตั้งรายการหลักรายการใหม่ได้",
            warning:
              mapDatabaseError(
                setDefaultError
              ),
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "ลบการตั้งค่ารหัสพนักงานเรียบร้อยแล้ว",
      data: {
        id,
        code_name: current.code_name,
      },
    });
  } catch (error) {
    console.error(
      "DELETE employee-code-settings exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการลบการตั้งค่ารหัสพนักงาน",
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}