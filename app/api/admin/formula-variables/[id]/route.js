import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

const TABLE_NAME =
  "formula_variables";

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

const ALLOWED_DATA_TYPES = [
  "number",
  "integer",
  "boolean",
  "text",
  "date",
];

const ALLOWED_SOURCE_TYPES = [
  "system",
  "employee",
  "attendance",
  "payroll",
  "custom",
];

function cleanText(value) {
  return String(
    value || ""
  ).trim();
}

function cleanNullableText(
  value
) {
  const text =
    cleanText(
      value
    );

  return text || null;
}

function cleanCode(value) {
  return cleanText(
    value
  )
    .toUpperCase()
    .replace(
      /[^A-Z0-9_]/g,
      "_"
    )
    .replace(
      /_+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );
}

function cleanBoolean(
  value,
  fallback = false
) {
  if (
    value === true ||
    value === false
  ) {
    return value;
  }

  if (
    value === "true"
  ) {
    return true;
  }

  if (
    value === "false"
  ) {
    return false;
  }

  return fallback;
}

function getActorId(
  guard
) {
  return (
    guard?.access
      ?.user_account_id ||
    guard?.access
      ?.user?.id ||
    guard?.user?.id ||
    null
  );
}

function jsonError(
  message,
  status = 500
) {
  return NextResponse.json(
    {
      success: false,
      error:
        message,
    },
    {
      status,
    }
  );
}

function getErrorStatus(
  error
) {
  if (!error) {
    return 500;
  }

  if (
    error.code ===
    "23505"
  ) {
    return 409;
  }

  if (
    [
      "23503",
      "23514",
      "23502",
      "22P02",
    ].includes(
      error.code
    )
  ) {
    return 400;
  }

  return 500;
}

function mapDatabaseError(
  error
) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

  if (
    error.code ===
    "23505"
  ) {
    return "รหัสตัวแปรนี้มีอยู่แล้วในบริษัท";
  }

  if (
    error.code ===
    "23503"
  ) {
    return "ไม่พบบริษัทหรือผู้ใช้งานที่อ้างอิง";
  }

  if (
    error.code ===
    "23514"
  ) {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  if (
    error.code ===
    "23502"
  ) {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  if (
    error.code ===
    "22P02"
  ) {
    return "รูปแบบข้อมูลหรือ UUID ไม่ถูกต้อง";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

function validateDefaultValue(
  dataType,
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    dataType ===
      "number" &&
    !Number.isFinite(
      Number(
        value
      )
    )
  ) {
    return "ค่าเริ่มต้นต้องเป็นตัวเลข";
  }

  if (
    dataType ===
      "integer" &&
    !Number.isInteger(
      Number(
        value
      )
    )
  ) {
    return "ค่าเริ่มต้นต้องเป็นจำนวนเต็ม";
  }

  if (
    dataType ===
      "boolean" &&
    ![
      "true",
      "false",
      "1",
      "0",
    ].includes(
      String(
        value
      ).toLowerCase()
    )
  ) {
    return "ค่าเริ่มต้น Boolean ต้องเป็น true / false / 1 / 0";
  }

  if (
    dataType ===
    "date"
  ) {
    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "ค่าเริ่มต้นวันที่ไม่ถูกต้อง";
    }
  }

  return null;
}

function normalizePayload(
  body,
  current
) {
  return {
    company_id:
      body.company_id !==
      undefined
        ? cleanNullableText(
            body.company_id
          )
        : current.company_id,

    variable_code:
      body.variable_code !==
      undefined
        ? cleanCode(
            body.variable_code
          )
        : current.variable_code,

    variable_name:
      body.variable_name !==
      undefined
        ? cleanText(
            body.variable_name
          )
        : current.variable_name,

    description:
      body.description !==
      undefined
        ? cleanNullableText(
            body.description
          )
        : current.description,

    data_type:
      body.data_type !==
      undefined
        ? cleanText(
            body.data_type
          )
        : current.data_type,

    source_type:
      body.source_type !==
      undefined
        ? cleanText(
            body.source_type
          )
        : current.source_type,

    source_key:
      body.source_key !==
      undefined
        ? cleanNullableText(
            body.source_key
          )
        : current.source_key,

    default_value:
      body.default_value !==
      undefined
        ? cleanNullableText(
            body.default_value
          )
        : current.default_value,

    /*
     * ป้องกันการเปลี่ยนสถานะ System Variable
     */
    is_system:
      current.is_system ===
      true,

    is_required:
      body.is_required !==
      undefined
        ? cleanBoolean(
            body.is_required,
            false
          )
        : current.is_required,

    status:
      body.status !==
      undefined
        ? cleanText(
            body.status
          )
        : current.status,

    sort_order:
      body.sort_order !==
      undefined
        ? Math.max(
            0,
            Number.parseInt(
              String(
                body.sort_order ??
                  0
              ),
              10
            ) || 0
          )
        : current.sort_order,

    remark:
      body.remark !==
      undefined
        ? cleanNullableText(
            body.remark
          )
        : current.remark,
  };
}

function validatePayload(
  payload
) {
  if (
    !payload.company_id
  ) {
    return "กรุณาเลือกบริษัท";
  }

  if (
    !payload.variable_code
  ) {
    return "กรุณากรอกรหัสตัวแปร";
  }

  if (
    !/^[A-Z][A-Z0-9_]*$/.test(
      payload.variable_code
    )
  ) {
    return "รหัสตัวแปรต้องขึ้นต้นด้วย A-Z และใช้ได้เฉพาะ A-Z, 0-9, _";
  }

  if (
    !payload.variable_name
  ) {
    return "กรุณากรอกชื่อตัวแปร";
  }

  if (
    !ALLOWED_DATA_TYPES.includes(
      payload.data_type
    )
  ) {
    return "ชนิดข้อมูลไม่ถูกต้อง";
  }

  if (
    !ALLOWED_SOURCE_TYPES.includes(
      payload.source_type
    )
  ) {
    return "แหล่งข้อมูลไม่ถูกต้อง";
  }

  if (
    payload.source_type !==
      "custom" &&
    !payload.source_key
  ) {
    return "กรุณาระบุ Source Key สำหรับแหล่งข้อมูลที่เลือก";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  return validateDefaultValue(
    payload.data_type,
    payload.default_value
  );
}

async function loadRecord(
  id
) {
  return supabaseAdmin
    .from(
      TABLE_NAME
    )
    .select(
      `
        id,
        company_id,
        variable_code,
        variable_name,
        description,
        data_type,
        source_type,
        source_key,
        default_value,
        is_system,
        is_required,
        status,
        sort_order,
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
    .eq(
      "id",
      id
    )
    .maybeSingle();
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.formula_variables",
        "view",
        {
          scopeType:
            "company",
        }
      );

    if (
      !guard.ok
    ) {
      return guard.response;
    }

    const {
      id,
    } =
      await params;

    const {
      data,
      error,
    } =
      await loadRecord(
        id
      );

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError(
        "ไม่พบตัวแปรสูตรคำนวณ",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์ดูตัวแปรสูตรของบริษัทนี้"
      );

    if (
      scopeError
    ) {
      return scopeError;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET_FORMULA_VARIABLE_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(
        error
      ),
      getErrorStatus(
        error
      )
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.formula_variables",
        "edit",
        {
          scopeType:
            "company",
        }
      );

    if (
      !guard.ok
    ) {
      return guard.response;
    }

    const {
      id,
    } =
      await params;

    const currentResult =
      await loadRecord(
        id
      );

    if (
      currentResult.error
    ) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบตัวแปรสูตรคำนวณ",
        404
      );
    }

    const currentScopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์แก้ไขตัวแปรสูตรของบริษัทนี้"
      );

    if (
      currentScopeError
    ) {
      return currentScopeError;
    }

    const body =
      await req
        .json()
        .catch(
          () => null
        );

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(
        body
      )
    ) {
      return jsonError(
        "Request Body ไม่ถูกต้อง",
        400
      );
    }

    const payload =
      normalizePayload(
        body,
        current
      );

    const validationError =
      validatePayload(
        payload
      );

    if (
      validationError
    ) {
      return jsonError(
        validationError,
        400
      );
    }

    const targetScopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์ย้ายตัวแปรสูตรไปยังบริษัทนี้"
      );

    if (
      targetScopeError
    ) {
      return targetScopeError;
    }

    const actorId =
      getActorId(
        guard
      );

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          TABLE_NAME
        )
        .update({
          ...payload,

          updated_by:
            actorId,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          id
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
        .single();

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "formula_variables",

        actionType:
          "UPDATE",

        referenceTable:
          TABLE_NAME,

        referenceId:
          id,

        description:
          `แก้ไขตัวแปรสูตร ${data.variable_code} - ${data.variable_name}`,

        oldData:
          current,

        newData:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "FORMULA_VARIABLE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "แก้ไขตัวแปรสูตรคำนวณเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH_FORMULA_VARIABLE_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(
        error
      ),
      getErrorStatus(
        error
      )
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.formula_variables",
        "delete",
        {
          scopeType:
            "company",
        }
      );

    if (
      !guard.ok
    ) {
      return guard.response;
    }

    const {
      id,
    } =
      await params;

    const currentResult =
      await loadRecord(
        id
      );

    if (
      currentResult.error
    ) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบตัวแปรสูตรคำนวณ",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์ลบตัวแปรสูตรของบริษัทนี้"
      );

    if (
      scopeError
    ) {
      return scopeError;
    }

    if (
      current.is_system ===
      true
    ) {
      return jsonError(
        "ตัวแปรระบบไม่สามารถลบได้",
        400
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          TABLE_NAME
        )
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "formula_variables",

        actionType:
          "DELETE",

        referenceTable:
          TABLE_NAME,

        referenceId:
          id,

        description:
          `ลบตัวแปรสูตร ${current.variable_code} - ${current.variable_name}`,

        oldData:
          current,

        newData:
          null,
      });
    } catch (
      logError
    ) {
      console.error(
        "FORMULA_VARIABLE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "ลบตัวแปรสูตรคำนวณเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_FORMULA_VARIABLE_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(
        error
      ),
      getErrorStatus(
        error
      )
    );
  }
}
