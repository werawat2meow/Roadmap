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

function normalizePayload(
  body = {},
  current = {}
) {
  return {
    company_id:
      body.company_id !== undefined
        ? cleanNullableText(
            body.company_id
          )
        : current.company_id,

    employee_code_setting_id:
      body.employee_code_setting_id !==
      undefined
        ? cleanNullableText(
            body.employee_code_setting_id
          )
        : current.employee_code_setting_id,

    running_year:
      body.running_year !== undefined
        ? parseInteger(
            body.running_year,
            current.running_year
          )
        : current.running_year,

    running_month:
      body.running_month !== undefined
        ? normalizeMonth(
            body.running_month
          )
        : current.running_month,

    current_running:
      body.current_running !== undefined
        ? parseInteger(
            body.current_running,
            current.current_running
          )
        : current.current_running,

    last_employee_code:
      body.last_employee_code !==
      undefined
        ? cleanNullableText(
            body.last_employee_code
          )
        : current.last_employee_code,

    last_employee_id:
      body.last_employee_id !==
      undefined
        ? cleanNullableText(
            body.last_employee_id
          )
        : current.last_employee_id,

    last_generated_at:
      body.last_generated_at !==
      undefined
        ? body.last_generated_at || null
        : current.last_generated_at,

    status:
      body.status !== undefined
        ? cleanText(body.status)
        : current.status,

    remark:
      body.remark !== undefined
        ? cleanNullableText(
            body.remark
          )
        : current.remark,
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
    payload.running_year < 0 ||
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
    return "ข้อมูลนี้มีความสัมพันธ์กับข้อมูลอื่น หรือไม่พบข้อมูลอ้างอิง";
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

export async function GET(
  req,
  { params }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัส Running Number",
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
            company_id,
            code_name,
            code_pattern,
            running_digits,
            year_digits,
            running_start,
            reset_policy,
            is_default,
            effective_date,
            expire_date,
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
        `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(
        "GET employee-running/[id] error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถโหลดรายละเอียด Running Number ได้",
          error:
            mapDatabaseError(error),
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
            "ไม่พบข้อมูล Running Number",
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
      "GET employee-running/[id] exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการโหลดรายละเอียด Running Number",
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
   PATCH
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัส Running Number",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Load current data
    ----------------------------------------------------- */

    const {
      data: current,
      error: currentError,
    } = await supabaseAdmin
      .from(
        "employee_running_numbers"
      )
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      console.error(
        "Load current employee running error:",
        currentError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถโหลดข้อมูลเดิมได้",
          error:
            mapDatabaseError(
              currentError
            ),
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
            "ไม่พบข้อมูล Running Number",
        },
        {
          status: 404,
        }
      );
    }

    const payload =
      normalizePayload(
        body,
        current
      );

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
       Validate employee code setting
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
          running_start,
          reset_policy,
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
        "Check employee code setting error:",
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

    /* -----------------------------------------------------
       Normalize year/month by reset policy
    ----------------------------------------------------- */

    if (
      setting.reset_policy ===
      "monthly"
    ) {
      if (
        payload.running_month === null
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
    } else {
      payload.running_month = null;
    }

    if (
      setting.reset_policy ===
      "never"
    ) {
      payload.running_year = 0;
      payload.running_month = null;
    }

    /* -----------------------------------------------------
       Validate last employee
    ----------------------------------------------------- */

    if (payload.last_employee_id) {
      const {
        data: employee,
        error: employeeError,
      } = await supabaseAdmin
        .from("employees")
        .select("id, company_id")
        .eq(
          "id",
          payload.last_employee_id
        )
        .maybeSingle();

      if (employeeError) {
        console.error(
          "Check last employee error:",
          employeeError
        );

        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่สามารถตรวจสอบพนักงานล่าสุดได้",
          },
          {
            status: 500,
          }
        );
      }

      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            message:
              "ไม่พบพนักงานล่าสุดที่เลือก",
          },
          {
            status: 404,
          }
        );
      }

      /*
        หากตาราง employees ไม่มี company_id
        ให้ลบเงื่อนไขนี้ออก
      */

      if (
        employee.company_id &&
        employee.company_id !==
          payload.company_id
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "พนักงานล่าสุดไม่ได้อยู่ในบริษัทที่เลือก",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* -----------------------------------------------------
       Check duplicate
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
        )
        .neq("id", id);

    if (
      payload.running_month === null
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
        "Check duplicate employee running error:",
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
       Update
    ----------------------------------------------------- */

    const updatePayload = {
      company_id:
        payload.company_id,

      employee_code_setting_id:
        payload.employee_code_setting_id,

      running_year:
        payload.running_year,

      running_month:
        payload.running_month,

      current_running:
        payload.current_running,

      last_employee_code:
        payload.last_employee_code,

      last_employee_id:
        payload.last_employee_id,

      last_generated_at:
        payload.last_generated_at,

      status:
        payload.status,

      remark:
        payload.remark,

      updated_at:
        new Date().toISOString(),
    };

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "employee_running_numbers"
      )
      .update(updatePayload)
      .eq("id", id)
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
            company_id,
            code_name,
            code_pattern,
            running_digits,
            year_digits,
            running_start,
            reset_policy,
            is_default,
            effective_date,
            expire_date,
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
        `
      )
      .single();

    if (error) {
      console.error(
        "PATCH employee-running error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          message:
            mapDatabaseError(error),
          error:
            error.message,
        },
        {
          status:
            error.code === "23505"
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
          "UPDATE",

        referenceTable:
          "employee_running_numbers",

        referenceId:
          id,

        description:
          `แก้ไข Running Number: ${setting.code_name}`,

        oldData: current,

        newData: data,
      });
    } catch (logError) {
      console.error(
        "Write employee running update log error:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "แก้ไข Running Number เรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "PATCH employee-running exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการแก้ไข Running Number",
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
   DELETE
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบรหัส Running Number",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Load current data
    ----------------------------------------------------- */

    const {
      data: current,
      error: currentError,
    } = await supabaseAdmin
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
          updated_at
        `
      )
      .eq("id", id)
      .maybeSingle();

    if (currentError) {
      console.error(
        "Load employee running before delete error:",
        currentError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถตรวจสอบ Running Number ก่อนลบได้",
          error:
            mapDatabaseError(
              currentError
            ),
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
            "ไม่พบข้อมูล Running Number",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       Prevent deleting used running number
    ----------------------------------------------------- */

    if (
      current.last_employee_id ||
      current.last_employee_code ||
      current.current_running > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถลบ Running Number ที่ถูกใช้งานแล้ว กรุณาเปลี่ยนสถานะเป็นไม่ใช้งานแทน",
        },
        {
          status: 409,
        }
      );
    }

    /* -----------------------------------------------------
       Delete
    ----------------------------------------------------- */

    const {
      error: deleteError,
    } = await supabaseAdmin
      .from(
        "employee_running_numbers"
      )
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(
        "DELETE employee-running error:",
        deleteError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            mapDatabaseError(
              deleteError
            ),
          error:
            deleteError.message,
        },
        {
          status:
            deleteError.code === "23503"
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
          "DELETE",

        referenceTable:
          "employee_running_numbers",

        referenceId:
          id,

        description:
          `ลบ Running Number ปี ${current.running_year}${
            current.running_month
              ? ` เดือน ${current.running_month}`
              : ""
          }`,

        oldData: current,

        newData: null,
      });
    } catch (logError) {
      console.error(
        "Write employee running delete log error:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "ลบ Running Number เรียบร้อยแล้ว",

      data: {
        id,

        running_year:
          current.running_year,

        running_month:
          current.running_month,
      },
    });
  } catch (error) {
    console.error(
      "DELETE employee-running exception:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "เกิดข้อผิดพลาดในการลบ Running Number",
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