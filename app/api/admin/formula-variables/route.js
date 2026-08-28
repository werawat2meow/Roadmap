import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   Constants
========================================================= */

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

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALL_LIMIT = 500;

/* =========================================================
   Helpers
========================================================= */

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

function sanitizeSearch(
  value
) {
  return cleanText(
    value
  )
    .replaceAll(
      ",",
      " "
    )
    .replaceAll(
      "(",
      " "
    )
    .replaceAll(
      ")",
      " "
    )
    .replaceAll(
      "%",
      ""
    )
    .replaceAll(
      "*",
      ""
    )
    .trim();
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

function normalizePayload(
  body = {}
) {
  return {
    company_id:
      cleanNullableText(
        body.company_id
      ),

    variable_code:
      cleanCode(
        body.variable_code
      ),

    variable_name:
      cleanText(
        body.variable_name
      ),

    description:
      cleanNullableText(
        body.description
      ),

    data_type:
      cleanText(
        body.data_type
      ) ||
      "number",

    source_type:
      cleanText(
        body.source_type
      ) ||
      "custom",

    source_key:
      cleanNullableText(
        body.source_key
      ),

    default_value:
      cleanNullableText(
        body.default_value
      ),

    /*
     * ผู้ใช้ทั่วไปสร้าง System Variable เองไม่ได้
     * System Variable ให้ seed/จัดการจากระบบเท่านั้น
     */
    is_system: false,

    is_required:
      cleanBoolean(
        body.is_required,
        false
      ),

    status:
      cleanText(
        body.status
      ) ||
      "active",

    sort_order:
      Math.max(
        0,
        Number.parseInt(
          String(
            body.sort_order ??
              0
          ),
          10
        ) || 0
      ),

    remark:
      cleanNullableText(
        body.remark
      ),
  };
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
    dataType === "number" &&
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

  const defaultError =
    validateDefaultValue(
      payload.data_type,
      payload.default_value
    );

  if (
    defaultError
  ) {
    return defaultError;
  }

  return null;
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

function jsonError(
  message,
  status = 500,
  extra = {}
) {
  return NextResponse.json(
    {
      success: false,
      error:
        message,
      ...extra,
    },
    {
      status,
    }
  );
}

function applyListFilters(
  query,
  {
    guard,
    search,
    companyId,
    dataType,
    sourceType,
    status,
    isSystem,
  }
) {
  query =
    guard.applyScope(
      query,
      "company_id"
    );

  if (search) {
    query =
      query.or(
        [
          `variable_code.ilike.%${search}%`,
          `variable_name.ilike.%${search}%`,
          `source_key.ilike.%${search}%`,
          `description.ilike.%${search}%`,
          `remark.ilike.%${search}%`,
        ].join(",")
      );
  }

  if (
    companyId
  ) {
    query =
      query.eq(
        "company_id",
        companyId
      );
  }

  if (
    dataType
  ) {
    query =
      query.eq(
        "data_type",
        dataType
      );
  }

  if (
    sourceType
  ) {
    query =
      query.eq(
        "source_type",
        sourceType
      );
  }

  if (status) {
    query =
      query.eq(
        "status",
        status
      );
  }

  if (
    isSystem ===
    true ||
    isSystem ===
    false
  ) {
    query =
      query.eq(
        "is_system",
        isSystem
      );
  }

  return query;
}

async function loadSummary(
  filters
) {
  let query =
    supabaseAdmin
      .from(
        TABLE_NAME
      )
      .select(
        "id,status,is_system"
      );

  query =
    applyListFilters(
      query,
      filters
    );

  const {
    data,
    error,
  } =
    await query.limit(
      5000
    );

  if (error) {
    throw error;
  }

  const rows =
    Array.isArray(
      data
    )
      ? data
      : [];

  return {
    total:
      rows.length,

    active:
      rows.filter(
        (item) =>
          item.status ===
          "active"
      ).length,

    system:
      rows.filter(
        (item) =>
          item.is_system ===
          true
      ).length,

    custom:
      rows.filter(
        (item) =>
          item.is_system !==
          true
      ).length,
  };
}

/* =========================================================
   GET
   /api/admin/formula-variables
========================================================= */

export async function GET(
  req
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
      searchParams,
    } =
      new URL(
        req.url
      );

    const search =
      sanitizeSearch(
        searchParams.get(
          "search"
        )
      );

    const companyId =
      cleanText(
        searchParams.get(
          "company_id"
        )
      );

    const dataType =
      cleanText(
        searchParams.get(
          "data_type"
        )
      );

    const sourceType =
      cleanText(
        searchParams.get(
          "source_type"
        )
      );

    const status =
      cleanText(
        searchParams.get(
          "status"
        )
      );

    const isSystemParam =
      searchParams.get(
        "is_system"
      );

    const isSystem =
      isSystemParam ===
      "true"
        ? true
        : isSystemParam ===
            "false"
          ? false
          : null;

    const all =
      searchParams.get(
        "all"
      ) === "true";

    const page =
      Math.max(
        Number(
          searchParams.get(
            "page"
          )
        ) || 1,
        1
      );

    const pageSize =
      Math.min(
        Math.max(
          Number(
            searchParams.get(
              "pageSize"
            )
          ) ||
            DEFAULT_PAGE_SIZE,
          1
        ),
        MAX_PAGE_SIZE
      );

    if (
      dataType &&
      !ALLOWED_DATA_TYPES.includes(
        dataType
      )
    ) {
      return jsonError(
        "ชนิดข้อมูลไม่ถูกต้อง",
        400
      );
    }

    if (
      sourceType &&
      !ALLOWED_SOURCE_TYPES.includes(
        sourceType
      )
    ) {
      return jsonError(
        "แหล่งข้อมูลไม่ถูกต้อง",
        400
      );
    }

    if (
      status &&
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return jsonError(
        "สถานะไม่ถูกต้อง",
        400
      );
    }

    if (
      companyId &&
      !guard.canAccessId(
        companyId
      )
    ) {
      return jsonError(
        "คุณไม่มีสิทธิ์เข้าถึงตัวแปรสูตรของบริษัทนี้",
        403
      );
    }

    let query =
      supabaseAdmin
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
          `,
          {
            count:
              all
                ? undefined
                : "exact",
          }
        );

    const filters = {
      guard,
      search,
      companyId,
      dataType,
      sourceType,
      status,
      isSystem,
    };

    query =
      applyListFilters(
        query,
        filters
      );

    query =
      query
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "variable_code",
          {
            ascending:
              true,
          }
        );

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
    } =
      await query;

    if (error) {
      throw error;
    }

    const summary =
      await loadSummary(
        filters
      );

    const total =
      all
        ? data?.length ||
          0
        : count || 0;

    return NextResponse.json({
      success: true,

      data:
        data || [],

      summary,

      pagination: {
        page:
          all
            ? 1
            : page,

        pageSize:
          all
            ? total
            : pageSize,

        total,

        totalPages:
          all
            ? 1
            : Math.ceil(
                total /
                  pageSize
              ),
      },

      meta: {
        scope_type:
          "company",

        has_all_scope:
          guard.hasAllScope,

        accessible_company_ids:
          guard.hasAllScope
            ? []
            : guard.accessibleIds,
      },
    });
  } catch (error) {
    console.error(
      "GET_FORMULA_VARIABLES_ERROR:",
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
   POST
========================================================= */

export async function POST(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.formula_variables",
        "create",
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
        body
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

    const scopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์เพิ่มตัวแปรสูตรในบริษัทนี้"
      );

    if (
      scopeError
    ) {
      return scopeError;
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
        .insert({
          ...payload,

          created_by:
            actorId,

          updated_by:
            actorId,
        })
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
          "CREATE",

        referenceTable:
          TABLE_NAME,

        referenceId:
          data.id,

        description:
          `เพิ่มตัวแปรสูตร ${data.variable_code} - ${data.variable_name}`,

        oldData:
          null,

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
        "เพิ่มตัวแปรสูตรคำนวณเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "POST_FORMULA_VARIABLE_ERROR:",
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
