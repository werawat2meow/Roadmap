import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

const ALLOWED_CATEGORIES = [
  "salary",
  "allowance",
  "overtime",
  "bonus",
  "commission",
  "incentive",
  "reimbursement",
  "other",
];

/* =========================================================
   SELECT
========================================================= */

const EARNING_TYPE_SELECT = `
  id,
  earning_type_code,
  earning_type_name_th,
  earning_type_name_en,
  description,
  earning_category,
  is_taxable,
  is_social_security_base,
  is_provident_fund_base,
  is_recurring,
  is_proratable,
  sort_order,
  status,
  created_at,
  updated_at
`;

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function successResponse(
  data,
  {
    status = 200,
    message = null,
    meta = null,
  } = {}
) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message =
      message;
  }

  if (meta) {
    response.meta =
      meta;
  }

  return NextResponse.json(
    response,
    {
      status,
    }
  );
}

function errorResponse(
  message,
  {
    status = 500,
    error = null,
    details = null,
  } = {}
) {
  const response = {
    success: false,
    message,
  };

  if (error) {
    response.error =
      error;
  }

  if (details) {
    response.details =
      details;
  }

  return NextResponse.json(
    response,
    {
      status,
    }
  );
}

/* =========================================================
   CLEAN HELPERS
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

function cleanNullableText(
  value
) {
  const cleaned =
    cleanText(value);

  return cleaned || null;
}

function cleanCode(value) {
  return cleanText(value)
    .toUpperCase();
}

function cleanBoolean(
  value,
  fallback = false
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    value === "true" ||
    value === "1" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === "false" ||
    value === "0" ||
    value === 0
  ) {
    return false;
  }

  return fallback;
}

function parseSortOrder(
  value,
  fallback = 0
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return fallback;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 0
  ) {
    return fallback;
  }

  return parsed;
}

/* =========================================================
   DATABASE ERROR
========================================================= */

function getErrorStatus(error) {
  if (!error) {
    return 500;
  }

  if (
    error.code === "23505"
  ) {
    return 409;
  }

  if (
    error.code === "23503" ||
    error.code === "23514" ||
    error.code === "23502" ||
    error.code === "22P02"
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

  /* -----------------------------------------------------
     Duplicate
  ----------------------------------------------------- */

  if (
    error.code === "23505"
  ) {
    if (
      error.message?.includes(
        "earning_types_code_key"
      )
    ) {
      return "รหัสประเภทเงินได้นี้มีอยู่แล้ว";
    }

    return "พบข้อมูลประเภทเงินได้ซ้ำในระบบ";
  }

  /* -----------------------------------------------------
     Foreign Key
  ----------------------------------------------------- */

  if (
    error.code === "23503"
  ) {
    return "ข้อมูลประเภทเงินได้นี้มีข้อมูลอื่นอ้างอิงอยู่";
  }

  /* -----------------------------------------------------
     Check Constraint
  ----------------------------------------------------- */

  if (
    error.code === "23514"
  ) {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  /* -----------------------------------------------------
     Not Null
  ----------------------------------------------------- */

  if (
    error.code === "23502"
  ) {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  /* -----------------------------------------------------
     Invalid UUID / Input
  ----------------------------------------------------- */

  if (
    error.code === "22P02"
  ) {
    return "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

/* =========================================================
   NORMALIZE PAYLOAD
========================================================= */

function normalizePayload(
  body = {},
  current = {}
) {
  return {
    earning_type_code:
      body.earning_type_code !==
      undefined
        ? cleanCode(
            body.earning_type_code
          )
        : current
            .earning_type_code,

    earning_type_name_th:
      body.earning_type_name_th !==
      undefined
        ? cleanText(
            body.earning_type_name_th
          )
        : current
            .earning_type_name_th,

    earning_type_name_en:
      body.earning_type_name_en !==
      undefined
        ? cleanNullableText(
            body.earning_type_name_en
          )
        : current
            .earning_type_name_en,

    description:
      body.description !==
      undefined
        ? cleanNullableText(
            body.description
          )
        : current.description,

    earning_category:
      body.earning_category !==
      undefined
        ? cleanText(
            body.earning_category
          ).toLowerCase()
        : current
            .earning_category,

    is_taxable:
      body.is_taxable !==
      undefined
        ? cleanBoolean(
            body.is_taxable,
            true
          )
        : Boolean(
            current.is_taxable
          ),

    is_social_security_base:
      body
        .is_social_security_base !==
      undefined
        ? cleanBoolean(
            body
              .is_social_security_base,
            false
          )
        : Boolean(
            current
              .is_social_security_base
          ),

    is_provident_fund_base:
      body
        .is_provident_fund_base !==
      undefined
        ? cleanBoolean(
            body
              .is_provident_fund_base,
            false
          )
        : Boolean(
            current
              .is_provident_fund_base
          ),

    is_recurring:
      body.is_recurring !==
      undefined
        ? cleanBoolean(
            body.is_recurring,
            false
          )
        : Boolean(
            current.is_recurring
          ),

    is_proratable:
      body.is_proratable !==
      undefined
        ? cleanBoolean(
            body.is_proratable,
            false
          )
        : Boolean(
            current.is_proratable
          ),

    sort_order:
      body.sort_order !==
      undefined
        ? parseSortOrder(
            body.sort_order,
            0
          )
        : Number(
            current.sort_order ||
              0
          ),

    status:
      body.status !==
      undefined
        ? cleanText(
            body.status
          ).toLowerCase()
        : current.status,
  };
}

/* =========================================================
   VALIDATE PAYLOAD
========================================================= */

function validatePayload(
  payload
) {
  if (
    !payload.earning_type_code
  ) {
    return "กรุณากรอกรหัสประเภทเงินได้";
  }

  if (
    !payload
      .earning_type_name_th
  ) {
    return "กรุณากรอกชื่อประเภทเงินได้";
  }

  if (
    !ALLOWED_CATEGORIES.includes(
      payload.earning_category
    )
  ) {
    return "หมวดประเภทเงินได้ไม่ถูกต้อง";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะประเภทเงินได้ไม่ถูกต้อง";
  }

  if (
    !Number.isInteger(
      Number(
        payload.sort_order
      )
    ) ||
    Number(
      payload.sort_order
    ) < 0
  ) {
    return "ลำดับต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป";
  }

  return null;
}

/* =========================================================
   LOAD EARNING TYPE
========================================================= */

async function getEarningTypeById(
  id
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("earning_types")
      .select(
        EARNING_TYPE_SELECT
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

  return {
    data,
    error,
  };
}

/* =========================================================
   DUPLICATE CHECK
========================================================= */

async function checkDuplicateCode({
  id,
  earningTypeCode,
}) {
  let query =
    supabaseAdmin
      .from("earning_types")
      .select(
        `
          id,
          earning_type_code
        `
      )
      .eq(
        "earning_type_code",
        earningTypeCode
      );

  if (id) {
    query =
      query.neq(
        "id",
        id
      );
  }

  const {
    data,
    error,
  } =
    await query
      .limit(1)
      .maybeSingle();

  return {
    data,
    error,
  };
}

/* =========================================================
   GET
   /api/admin/earning-types/[id]
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    /* -----------------------------------------------------
       Permission
    ----------------------------------------------------- */

    const guard =
      await requireScopedAccess(
        "ems.earning_types",
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    /* -----------------------------------------------------
       Params
    ----------------------------------------------------- */

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสประเภทเงินได้",
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Load
    ----------------------------------------------------- */

    const {
      data,
      error,
    } =
      await getEarningTypeById(
        id
      );

    if (error) {
      console.error(
        "GET earning-types/[id] error:",
        error
      );

      return errorResponse(
        "ไม่สามารถโหลดข้อมูลประเภทเงินได้",
        {
          status:
            getErrorStatus(
              error
            ),

          error:
            mapDatabaseError(
              error
            ),
        }
      );
    }

    if (!data) {
      return errorResponse(
        "ไม่พบข้อมูลประเภทเงินได้",
        {
          status: 404,
        }
      );
    }

    return successResponse(
      data
    );
  } catch (error) {
    console.error(
      "GET /api/admin/earning-types/[id] exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการโหลดข้อมูลประเภทเงินได้",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}

/* =========================================================
   PATCH
   /api/admin/earning-types/[id]
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    /* -----------------------------------------------------
       Permission
    ----------------------------------------------------- */

    const guard =
      await requireScopedAccess(
        "ems.earning_types",
        "edit"
      );

    if (!guard.ok) {
      return guard.response;
    }

    /* -----------------------------------------------------
       Params
    ----------------------------------------------------- */

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสประเภทเงินได้",
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Request Body
    ----------------------------------------------------- */

    let body = null;

    try {
      body =
        await req.json();
    } catch (error) {
      return errorResponse(
        "รูปแบบ Request Body ไม่ถูกต้อง",
        {
          status: 400,

          error:
            error?.message ||
            null,
        }
      );
    }

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Request Body ต้องเป็น Object",
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Load Current
    ----------------------------------------------------- */

    const {
      data: current,
      error: currentError,
    } =
      await getEarningTypeById(
        id
      );

    if (currentError) {
      return errorResponse(
        "ไม่สามารถโหลดข้อมูลประเภทเงินได้เดิม",
        {
          status:
            getErrorStatus(
              currentError
            ),

          error:
            mapDatabaseError(
              currentError
            ),
        }
      );
    }

    if (!current) {
      return errorResponse(
        "ไม่พบข้อมูลประเภทเงินได้",
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       Normalize
    ----------------------------------------------------- */

    const payload =
      normalizePayload(
        body,
        current
      );

    /* -----------------------------------------------------
       Validate
    ----------------------------------------------------- */

    const validationError =
      validatePayload(
        payload
      );

    if (validationError) {
      return errorResponse(
        validationError,
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Duplicate Code
    ----------------------------------------------------- */

    const {
      data: duplicate,
      error: duplicateError,
    } =
      await checkDuplicateCode({
        id,

        earningTypeCode:
          payload
            .earning_type_code,
      });

    if (duplicateError) {
      return errorResponse(
        "ไม่สามารถตรวจสอบรหัสประเภทเงินได้",
        {
          status:
            getErrorStatus(
              duplicateError
            ),

          error:
            mapDatabaseError(
              duplicateError
            ),
        }
      );
    }

    if (duplicate) {
      return errorResponse(
        "รหัสประเภทเงินได้นี้มีอยู่แล้ว",
        {
          status: 409,

          details: {
            earning_type_id:
              duplicate.id,

            earning_type_code:
              duplicate
                .earning_type_code,
          },
        }
      );
    }

    /* -----------------------------------------------------
       Update
    ----------------------------------------------------- */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("earning_types")
        .update({
          ...payload,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          id
        )
        .select(
          EARNING_TYPE_SELECT
        )
        .single();

    if (error) {
      console.error(
        "PATCH earning-types/[id] error:",
        error
      );

      return errorResponse(
        mapDatabaseError(
          error
        ),
        {
          status:
            getErrorStatus(
              error
            ),

          error:
            error.message,
        }
      );
    }

    /* -----------------------------------------------------
       Activity Log
    ----------------------------------------------------- */

    try {
      await writeActivityLog({
        moduleName:
          "earning_types",

        actionType:
          "UPDATE",

        referenceTable:
          "earning_types",

        referenceId:
          id,

        description:
          `แก้ไขประเภทเงินได้ ${data.earning_type_code} - ${data.earning_type_name_th}`,

        oldData:
          current,

        newData:
          data,
      });
    } catch (logError) {
      console.error(
        "Write earning type update activity log error:",
        logError
      );
    }

    /* -----------------------------------------------------
       Response
    ----------------------------------------------------- */

    return successResponse(
      data,
      {
        message:
          "แก้ไขประเภทเงินได้เรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "PATCH /api/admin/earning-types/[id] exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการแก้ไขประเภทเงินได้",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}

/* =========================================================
   DELETE
   /api/admin/earning-types/[id]
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    /* -----------------------------------------------------
       Permission
    ----------------------------------------------------- */

    const guard =
      await requireScopedAccess(
        "ems.earning_types",
        "delete"
      );

    if (!guard.ok) {
      return guard.response;
    }

    /* -----------------------------------------------------
       Params
    ----------------------------------------------------- */

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสประเภทเงินได้",
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Load Current
    ----------------------------------------------------- */

    const {
      data: current,
      error: currentError,
    } =
      await getEarningTypeById(
        id
      );

    if (currentError) {
      return errorResponse(
        "ไม่สามารถตรวจสอบข้อมูลประเภทเงินได้ก่อนลบ",
        {
          status:
            getErrorStatus(
              currentError
            ),

          error:
            mapDatabaseError(
              currentError
            ),
        }
      );
    }

    if (!current) {
      return errorResponse(
        "ไม่พบข้อมูลประเภทเงินได้",
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------------
       Delete

       ถ้ามี Foreign Key จากข้อมูลอื่น เช่น
       salary_components → earning_types

       Database จะตอบ 23503
       และระบบจะไม่ยอม Hard Delete
    ----------------------------------------------------- */

    const {
      error,
    } =
      await supabaseAdmin
        .from("earning_types")
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      console.error(
        "DELETE earning-types/[id] error:",
        error
      );

      if (
        error.code === "23503"
      ) {
        return errorResponse(
          "ไม่สามารถลบประเภทเงินได้นี้ได้ เนื่องจากมีรายการเงินเดือนหรือข้อมูลอื่นอ้างอิงอยู่ กรุณาเปลี่ยนสถานะเป็นไม่ใช้งานแทน",
          {
            status: 409,

            error:
              error.message,
          }
        );
      }

      return errorResponse(
        mapDatabaseError(
          error
        ),
        {
          status:
            getErrorStatus(
              error
            ),

          error:
            error.message,
        }
      );
    }

    /* -----------------------------------------------------
       Activity Log
    ----------------------------------------------------- */

    try {
      await writeActivityLog({
        moduleName:
          "earning_types",

        actionType:
          "DELETE",

        referenceTable:
          "earning_types",

        referenceId:
          id,

        description:
          `ลบประเภทเงินได้ ${current.earning_type_code} - ${current.earning_type_name_th}`,

        oldData:
          current,

        newData:
          null,
      });
    } catch (logError) {
      console.error(
        "Write earning type delete activity log error:",
        logError
      );
    }

    /* -----------------------------------------------------
       Response
    ----------------------------------------------------- */

    return successResponse(
      {
        id,

        earning_type_code:
          current
            .earning_type_code,

        earning_type_name_th:
          current
            .earning_type_name_th,
      },
      {
        message:
          "ลบประเภทเงินได้เรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "DELETE /api/admin/earning-types/[id] exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการลบประเภทเงินได้",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}