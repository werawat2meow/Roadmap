import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return "";
  }

  return String(value).trim();
}

function cleanNullableText(value) {
  const cleaned = cleanText(value);

  return cleaned || null;
}

function parseInteger(
  value,
  fallback = 0
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return parsed;
}

function normalizeMonth(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const month = Number(value);

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return month;
}

function normalizePayload(body = {}) {
  const status = cleanText(
    body.status
  );

  return {
    company_id:
      cleanNullableText(
        body.company_id
      ),

    employee_code_setting_id:
      cleanNullableText(
        body.employee_code_setting_id
      ),

    running_year:
      parseInteger(
        body.running_year,
        new Date().getFullYear()
      ),

    running_month:
      normalizeMonth(
        body.running_month
      ),

    current_running:
      parseInteger(
        body.current_running,
        0
      ),

    last_employee_code:
      cleanNullableText(
        body.last_employee_code
      ),

    last_employee_id:
      cleanNullableText(
        body.last_employee_id
      ),

    last_generated_at:
      body.last_generated_at || null,

    status:
      ALLOWED_STATUSES.includes(
        status
      )
        ? status
        : "active",

    remark:
      cleanNullableText(
        body.remark
      ),
  };
}

function validatePayload(payload) {
  if (!payload.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (
    !payload.employee_code_setting_id
  ) {
    return "กรุณาเลือกรูปแบบรหัสพนักงาน";
  }

  if (
    !Number.isInteger(
      payload.running_year
    ) ||
    payload.running_year < 1900 ||
    payload.running_year > 9999
  ) {
    return "ปี Running ไม่ถูกต้อง";
  }

  if (
    payload.running_month !== null &&
    (
      !Number.isInteger(
        payload.running_month
      ) ||
      payload.running_month < 1 ||
      payload.running_month > 12
    )
  ) {
    return "เดือน Running ต้องอยู่ระหว่าง 1 ถึง 12";
  }

  if (
    !Number.isInteger(
      payload.current_running
    ) ||
    payload.current_running < 0
  ) {
    return "เลข Running ปัจจุบันต้องไม่น้อยกว่า 0";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  return null;
}

function mapDatabaseError(error) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

  if (error.code === "23505") {
    return "มีข้อมูล Running สำหรับรูปแบบ ปี และเดือนนี้อยู่แล้ว";
  }

  if (error.code === "23503") {
    return "ไม่พบบริษัท รูปแบบรหัส หรือพนักงานที่อ้างอิง";
  }

  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

/* =========================================================
   GET
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const companyId =
      searchParams
        .get("company_id")
        ?.trim() || "";

    const settingId =
      searchParams
        .get(
          "employee_code_setting_id"
        )
        ?.trim() || "";

    const status =
      searchParams
        .get("status")
        ?.trim() || "";

    const runningYear =
      searchParams.get(
        "running_year"
      );

    const runningMonth =
      searchParams.get(
        "running_month"
      );

    const all =
      searchParams.get("all") ===
      "true";

    const page = Math.max(
      Number(
        searchParams.get("page")
      ) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(
          searchParams.get(
            "pageSize"
          )
        ) || 20,
        1
      ),
      100
    );

    let query = supabaseAdmin
      .from(
        "employee_running_numbers"
      )
      .select(
        `
          id,
          company_id,
          employee_code_setting_id,
          running_year,
          running_month,
          current_running,
          last_employee_code,
          last_employee_id,
          last_generated_at,
          status,
          remark,
          created_at,
          updated_at,

          companies:company_id (
            id,
            company_code,
            company_name_th,
            company_name_en
          ),

          employee_code_settings:employee_code_setting_id (
            id,
            code_name,
            code_pattern,
            running_digits,
            year_digits,
            reset_policy,
            is_default,
            status
          ),

          employees:last_employee_id (
            id,
            employee_code,
            first_name_th,
            last_name_th,
            first_name_en,
            last_name_en
          )
        `,
        {
          count: all
            ? undefined
            : "exact",
        }
      );

    if (search) {
      const safeSearch =
        search
          .replaceAll(",", " ")
          .trim();

      query = query.or(
        [
          `last_employee_code.ilike.%${safeSearch}%`,
          `remark.ilike.%${safeSearch}%`,
        ].join(",")
      );
    }

    if (companyId) {
      query = query.eq(
        "company_id",
        companyId
      );
    }

    if (settingId) {
      query = query.eq(
        "employee_code_setting_id",
        settingId
      );
    }

    if (
      status &&
      ALLOWED_STATUSES.includes(
        status
      )
    ) {
      query = query.eq(
        "status",
        status
      );
    }

    if (
      runningYear !== null &&
      runningYear !== ""
    ) {
      const parsedYear =
        Number(runningYear);

      if (
        Number.isInteger(
          parsedYear
        )
      ) {
        query = query.eq(
          "running_year",
          parsedYear
        );
      }
    }

    if (
      runningMonth === "null" ||
      runningMonth === "0"
    ) {
      query = query.is(
        "running_month",
        null
      );
    } else if (
      runningMonth !== null &&
      runningMonth !== ""
    ) {
      const parsedMonth =
        Number(runningMonth);

      if (
        Number.isInteger(
          parsedMonth
        ) &&
        parsedMonth >= 1 &&
        parsedMonth <= 12
      ) {
        query = query.eq(
          "running_month",
          parsedMonth
        );
      }
    }

    query = query
      .order("running_year", {
        ascending: false,
      })
      .order("running_month", {
        ascending: false,
        nullsFirst: true,
      })
      .order("created_at", {
        ascending: false,
      });

    if (all) {
      query = query.limit(1000);
    } else {
      const from =
        (page - 1) *
        pageSize;

      const to =
        from +
        pageSize -
        1;

      query = query.range(
        from,
        to
      );
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      console.error(
        "GET employee-running error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถโหลดข้อมูล Running Number ได้",
          error:
            mapDatabaseError(
              error
            ),
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
        total:
          data?.length || 0,
      });
    }

    const total = count || 0;

    return NextResponse.json({
      success: true,

      data: data || [],

      pagination: {
        page,
        pageSize,
        total,

        totalPages:
          Math.max(
            Math.ceil(
              total / pageSize
            ),
            1
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET employee-running exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการโหลดข้อมูล Running Number",
        error:
          error?.message ||
          "Unknown error",
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
    const body =
      await req.json();

    const payload =
      normalizePayload(body);

    const validationError =
      validatePayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          message:
            validationError,
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       ตรวจสอบ Setting
    ----------------------------------------------------- */

    const {
      data: setting,
      error: settingError,
    } = await supabaseAdmin
      .from(
        "employee_code_settings"
      )
      .select(
        `
          id,
          company_id,
          code_name,
          code_pattern,
          reset_policy,
          running_start,
          status
        `
      )
      .eq(
        "id",
        payload.employee_code_setting_id
      )
      .maybeSingle();

    if (settingError) {
      console.error(
        "Check setting error:",
        settingError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบรูปแบบรหัสพนักงานได้",
        },
        {
          status: 500,
        }
      );
    }

    if (!setting) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรูปแบบรหัสพนักงาน",
        },
        {
          status: 404,
        }
      );
    }

    if (
      setting.company_id !==
      payload.company_id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "รูปแบบรหัสพนักงานไม่ได้อยู่ในบริษัทที่เลือก",
        },
        {
          status: 400,
        }
      );
    }

    if (
      setting.status !==
      "active"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "รูปแบบรหัสพนักงานนี้ไม่ได้เปิดใช้งาน",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       ตรวจ Running Month ตาม Reset Policy
    ----------------------------------------------------- */

    if (
      setting.reset_policy ===
      "monthly" &&
      payload.running_month ===
        null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "รูปแบบรหัสนี้รีเซ็ตรายเดือน กรุณาระบุเดือน Running",
        },
        {
          status: 400,
        }
      );
    }

    if (
      setting.reset_policy !==
      "monthly"
    ) {
      payload.running_month =
        null;
    }

    if (
      setting.reset_policy ===
      "never"
    ) {
      payload.running_year = 0;
      payload.running_month =
        null;
    }

    /* -----------------------------------------------------
       ตรวจข้อมูลซ้ำ
    ----------------------------------------------------- */

    let duplicateQuery =
      supabaseAdmin
        .from(
          "employee_running_numbers"
        )
        .select("id")
        .eq(
          "employee_code_setting_id",
          payload.employee_code_setting_id
        )
        .eq(
          "running_year",
          payload.running_year
        );

    if (
      payload.running_month ===
      null
    ) {
      duplicateQuery =
        duplicateQuery.is(
          "running_month",
          null
        );
    } else {
      duplicateQuery =
        duplicateQuery.eq(
          "running_month",
          payload.running_month
        );
    }

    const {
      data: duplicate,
      error: duplicateError,
    } =
      await duplicateQuery.maybeSingle();

    if (duplicateError) {
      console.error(
        "Check duplicate running error:",
        duplicateError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบข้อมูล Running Number ซ้ำได้",
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
            "มีข้อมูล Running สำหรับรูปแบบ ปี และเดือนนี้อยู่แล้ว",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       Insert
    ----------------------------------------------------- */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "employee_running_numbers"
      )
      .insert(payload)
      .select(
        `
          id,
          company_id,
          employee_code_setting_id,
          running_year,
          running_month,
          current_running,
          last_employee_code,
          last_employee_id,
          last_generated_at,
          status,
          remark,
          created_at,
          updated_at,

          companies:company_id (
            id,
            company_code,
            company_name_th,
            company_name_en
          ),

          employee_code_settings:employee_code_setting_id (
            id,
            code_name,
            code_pattern,
            running_digits,
            year_digits,
            reset_policy,
            is_default,
            status
          )
        `
      )
      .single();

    if (error) {
      console.error(
        "POST employee-running error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            mapDatabaseError(
              error
            ),
          error:
            error.message,
        },
        {
          status:
            error.code ===
            "23505"
              ? 409
              : 500,
        }
      );
    }

    try {
      await writeActivityLog({
        moduleName:
          "employee_running_numbers",

        actionType:
          "CREATE",

        referenceTable:
          "employee_running_numbers",

        referenceId:
          data.id,

        description:
          `เพิ่ม Running Number: ${setting.code_name}`,

        oldData: null,

        newData: data,
      });
    } catch (logError) {
      console.error(
        "Write employee running create log error:",
        logError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "เพิ่ม Running Number เรียบร้อยแล้ว",
        data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST employee-running exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการเพิ่ม Running Number",
        error:
          error?.message ||
          "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}