import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALL_LIMIT = 5000;

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
   RESPONSE HELPERS
========================================================= */

function successResponse(
  data,
  {
    status = 200,
    message = null,
    pagination = null,
    meta = null,
  } = {}
) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  if (meta) {
    response.meta = meta;
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
    response.error = error;
  }

  if (details) {
    response.details = details;
  }

  return NextResponse.json(
    response,
    {
      status,
    }
  );
}

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
  return String(
    value ?? ""
  ).trim();
}

function cleanNullableText(value) {
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
    typeof value === "boolean"
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

function parsePositiveInteger(
  value,
  fallback,
  max = null
) {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  if (
    max !== null &&
    parsed > max
  ) {
    return max;
  }

  return parsed;
}

function parseSortOrder(
  value,
  fallback = 0
) {
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

function sanitizeSearch(value) {
  return cleanText(value)
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .trim();
}

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

function mapDatabaseError(error) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

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

  if (
    error.code === "23503"
  ) {
    return "ไม่พบข้อมูล Master ที่อ้างอิง";
  }

  if (
    error.code === "23514"
  ) {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  if (
    error.code === "23502"
  ) {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

/* =========================================================
   NORMALIZE PAYLOAD
========================================================= */

function normalizePayload(body = {}) {
  return {
    earning_type_code:
      cleanCode(
        body.earning_type_code
      ),

    earning_type_name_th:
      cleanText(
        body.earning_type_name_th
      ),

    earning_type_name_en:
      cleanNullableText(
        body.earning_type_name_en
      ),

    description:
      cleanNullableText(
        body.description
      ),

    earning_category:
      cleanText(
        body.earning_category ||
        "other"
      ).toLowerCase(),

    is_taxable:
      cleanBoolean(
        body.is_taxable,
        true
      ),

    is_social_security_base:
      cleanBoolean(
        body.is_social_security_base,
        false
      ),

    is_provident_fund_base:
      cleanBoolean(
        body.is_provident_fund_base,
        false
      ),

    is_recurring:
      cleanBoolean(
        body.is_recurring,
        false
      ),

    is_proratable:
      cleanBoolean(
        body.is_proratable,
        false
      ),

    sort_order:
      parseSortOrder(
        body.sort_order,
        0
      ),

    status:
      cleanText(
        body.status ||
        "active"
      ).toLowerCase(),
  };
}

/* =========================================================
   VALIDATE PAYLOAD
========================================================= */

function validatePayload(payload) {
  if (
    !payload.earning_type_code
  ) {
    return "กรุณากรอกรหัสประเภทเงินได้";
  }

  if (
    !payload.earning_type_name_th
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

  return null;
}

/* =========================================================
   GET /api/admin/earning-types

   Query:
   ?search=
   &page=1
   &pageSize=20
   &status=active
   &earning_category=salary
   &all=true
========================================================= */

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.earning_types",
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { searchParams } =
      new URL(req.url);

    const search =
      sanitizeSearch(
        searchParams.get("search")
      );

    const status =
      cleanText(
        searchParams.get("status")
      ).toLowerCase();

    const earningCategory =
      cleanText(
        searchParams.get(
          "earning_category"
        )
      ).toLowerCase();

    const all =
      cleanBoolean(
        searchParams.get("all"),
        false
      );

    const page =
      parsePositiveInteger(
        searchParams.get("page"),
        DEFAULT_PAGE
      );

    const pageSize =
      parsePositiveInteger(
        searchParams.get("pageSize"),
        DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE
      );

    /* -----------------------------------------------------
       Validate Filters
    ----------------------------------------------------- */

    if (
      status &&
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return errorResponse(
        "สถานะประเภทเงินได้ไม่ถูกต้อง",
        {
          status: 400,
        }
      );
    }

    if (
      earningCategory &&
      !ALLOWED_CATEGORIES.includes(
        earningCategory
      )
    ) {
      return errorResponse(
        "หมวดประเภทเงินได้ไม่ถูกต้อง",
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Build Query
    ----------------------------------------------------- */

    let query =
      supabaseAdmin
        .from("earning_types")
        .select(
          `
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
          `,
          {
            count:
              all
                ? undefined
                : "exact",
          }
        );

    /* -----------------------------------------------------
       Search
    ----------------------------------------------------- */

    if (search) {
      query =
        query.or(
          [
            `earning_type_code.ilike.%${search}%`,
            `earning_type_name_th.ilike.%${search}%`,
            `earning_type_name_en.ilike.%${search}%`,
            `description.ilike.%${search}%`,
          ].join(",")
        );
    }

    /* -----------------------------------------------------
       Filters
    ----------------------------------------------------- */

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

    if (earningCategory) {
      query =
        query.eq(
          "earning_category",
          earningCategory
        );
    }

    /* -----------------------------------------------------
       Sort
    ----------------------------------------------------- */

    query =
      query
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "earning_type_code",
          {
            ascending: true,
          }
        );

    /* -----------------------------------------------------
       All / Pagination
    ----------------------------------------------------- */

    if (all) {
      query =
        query.limit(
          ALL_LIMIT
        );
    } else {
      const from =
        (page - 1) *
        pageSize;

      const to =
        from +
        pageSize -
        1;

      query =
        query.range(
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
        "GET earning-types error:",
        error
      );

      return errorResponse(
        "ไม่สามารถโหลดข้อมูลประเภทเงินได้",
        {
          status:
            getErrorStatus(error),

          error:
            mapDatabaseError(error),
        }
      );
    }

    const rows =
      Array.isArray(data)
        ? data
        : [];

    /* -----------------------------------------------------
       All Response
    ----------------------------------------------------- */

    if (all) {
      return successResponse(
        rows,
        {
          meta: {
            total:
              rows.length,

            all: true,

            limit:
              ALL_LIMIT,
          },
        }
      );
    }

    /* -----------------------------------------------------
       Pagination
    ----------------------------------------------------- */

    const total =
      Number(count || 0);

    const totalPages =
      Math.max(
        Math.ceil(
          total /
          pageSize
        ),
        1
      );

    return successResponse(
      rows,
      {
        pagination: {
          page,
          pageSize,
          total,
          totalPages,

          hasNextPage:
            page <
            totalPages,

          hasPreviousPage:
            page > 1,
        },

        meta: {
          search:
            search || null,

          filters: {
            status:
              status || null,

            earning_category:
              earningCategory ||
              null,
          },
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/earning-types exception:",
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
   POST /api/admin/earning-types
========================================================= */

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.earning_types",
        "create"
      );

    if (!guard.ok) {
      return guard.response;
    }

    let body = null;

    try {
      body =
        await req.json();
    } catch {
      return errorResponse(
        "รูปแบบ Request Body ไม่ถูกต้อง",
        {
          status: 400,
        }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Request Body ต้องเป็น Object",
        {
          status: 400,
        }
      );
    }

    const payload =
      normalizePayload(body);

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
      await supabaseAdmin
        .from("earning_types")
        .select(
          `
            id,
            earning_type_code
          `
        )
        .eq(
          "earning_type_code",
          payload
            .earning_type_code
        )
        .maybeSingle();

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
        }
      );
    }

    /* -----------------------------------------------------
       Insert
    ----------------------------------------------------- */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("earning_types")
        .insert({
          ...payload,

          updated_at:
            new Date()
              .toISOString(),
        })
        .select(
          `
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
          `
        )
        .single();

    if (error) {
      console.error(
        "POST earning-types error:",
        error
      );

      return errorResponse(
        mapDatabaseError(error),
        {
          status:
            getErrorStatus(error),

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
          "CREATE",

        referenceTable:
          "earning_types",

        referenceId:
          data.id,

        description:
          `เพิ่มประเภทเงินได้ ${data.earning_type_code} - ${data.earning_type_name_th}`,

        oldData:
          null,

        newData:
          data,
      });
    } catch (logError) {
      console.error(
        "Write earning type activity log error:",
        logError
      );
    }

    return successResponse(
      data,
      {
        status: 201,

        message:
          "เพิ่มประเภทเงินได้เรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/earning-types exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการเพิ่มประเภทเงินได้",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}