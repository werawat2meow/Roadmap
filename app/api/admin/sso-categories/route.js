import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  writeActivityLog,
} from "@/lib/activityLogger";

const MODULE_CODE =
  "ems.sso_categories";

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

function cleanText(
  value
) {
  if (
    value ===
      undefined ||
    value === null
  ) {
    return "";
  }

  return String(
    value
  ).trim();
}

function cleanNullableText(
  value
) {
  const cleaned =
    cleanText(
      value
    );

  return cleaned ||
    null;
}

function parseBoolean(
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

function parseInteger(
  value,
  fallback = 0
) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(
      parsed
    )
  ) {
    return fallback;
  }

  return parsed;
}

function jsonError(
  message,
  status = 500
) {
  return NextResponse.json(
    {
      success:
        false,

      error:
        message,
    },
    {
      status,
    }
  );
}

function normalizePayload(
  body = {}
) {
  const sectionNoRaw =
    body.section_no;

  const sectionNo =
    sectionNoRaw ===
      "" ||
    sectionNoRaw ===
      null ||
    sectionNoRaw ===
      undefined
      ? null
      : Number(
          sectionNoRaw
        );

  return {
    category_code:
      cleanText(
        body.category_code
      ).toLowerCase(),

    category_name_th:
      cleanText(
        body
          .category_name_th
      ),

    category_name_en:
      cleanNullableText(
        body
          .category_name_en
      ),

    section_no:
      sectionNo,

    requires_employer_registration:
      parseBoolean(
        body
          .requires_employer_registration,
        false
      ),

    is_default:
      parseBoolean(
        body.is_default,
        false
      ),

    sort_order:
      parseInteger(
        body.sort_order,
        0
      ),

    status:
      cleanText(
        body.status ||
          "active"
      ).toLowerCase(),

    remark:
      cleanNullableText(
        body.remark
      ),
  };
}

function validatePayload(
  payload
) {
  if (
    !payload
      .category_code
  ) {
    return "กรุณากรอกรหัสประเภทผู้ประกันตน";
  }

  if (
    !/^[a-z0-9_]+$/.test(
      payload
        .category_code
    )
  ) {
    return "รหัสประเภทใช้ได้เฉพาะ a-z, 0-9 และ _";
  }

  if (
    !payload
      .category_name_th
  ) {
    return "กรุณากรอกชื่อประเภทผู้ประกันตน";
  }

  if (
    payload.section_no !==
      null &&
    (
      !Number.isInteger(
        payload.section_no
      ) ||
      payload.section_no <
        1 ||
      payload.section_no >
        999
    )
  ) {
    return "เลขมาตราไม่ถูกต้อง";
  }

  if (
    !Number.isInteger(
      payload.sort_order
    ) ||
    payload.sort_order <
      0
  ) {
    return "ลำดับแสดงผลไม่ถูกต้อง";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  if (
    payload.is_default &&
    payload.status !==
      "active"
  ) {
    return "ประเภทที่เป็นค่าเริ่มต้นต้องมีสถานะใช้งาน";
  }

  return null;
}

async function clearOtherDefaults(
  excludeId = null
) {
  let query =
    supabaseAdmin
      .from(
        "sso_categories"
      )
      .update({
        is_default:
          false,

        updated_at:
          new Date()
            .toISOString(),
      })
      .eq(
        "is_default",
        true
      );

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

async function getSummary() {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "sso_categories"
      )
      .select(
        "status,is_default"
      );

  if (error) {
    throw error;
  }

  const rows =
    data || [];

  return {
    total:
      rows.length,

    active:
      rows.filter(
        (item) =>
          item.status ===
          "active"
      ).length,

    inactive:
      rows.filter(
        (item) =>
          item.status ===
          "inactive"
      ).length,

    default:
      rows.filter(
        (item) =>
          item.is_default ===
          true
      ).length,
  };
}

/* =========================================================
   GET /api/admin/sso-categories

   Permission:
   - Master Page:
     ems.sso_categories.view
   - Employee Context:
     ems.employees.view

   SSO Category เป็น Global Master
   ไม่ผูก Company Scope
========================================================= */

export async function GET(
  req
) {
  try {
    const {
      searchParams,
    } =
      new URL(req.url);

    const scopeContext =
      cleanText(
        searchParams.get(
          "scope_context"
        )
      );

    /*
     * Allowlist Context เท่านั้น
     * ห้ามนำ scope_context ไปใช้เป็น module แบบ dynamic
     */
    const isEmployeeContext =
      scopeContext ===
      "ems.employees";

    const guard =
      isEmployeeContext
        ? await requireScopedAccess(
            "ems.employees",
            "view"
          )
        : await requireScopedAccess(
            MODULE_CODE,
            "view"
          );

    if (!guard.ok) {
      return guard.response;
    }

    const search =
      cleanText(
        searchParams.get(
          "search"
        )
      );

    const status =
      cleanText(
        searchParams.get(
          "status"
        )
      ).toLowerCase();

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
          ) || 20,
          1
        ),
        100
      );

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

    let query =
      supabaseAdmin
        .from(
          "sso_categories"
        )
        .select(
          `
            id,
            category_code,
            category_name_th,
            category_name_en,
            section_no,
            requires_employer_registration,
            is_default,
            sort_order,
            status,
            remark,
            created_by,
            updated_by,
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

    if (search) {
      const numericSearch =
        Number(search);

      const filters = [
        `category_code.ilike.%${search}%`,
        `category_name_th.ilike.%${search}%`,
        `category_name_en.ilike.%${search}%`,
        `remark.ilike.%${search}%`,
      ];

      if (
        Number.isInteger(
          numericSearch
        )
      ) {
        filters.push(
          `section_no.eq.${numericSearch}`
        );
      }

      query =
        query.or(
          filters.join(
            ","
          )
        );
    }

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

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
          "section_no",
          {
            ascending:
              true,
            nullsFirst:
              false,
          }
        )
        .order(
          "category_name_th",
          {
            ascending:
              true,
          }
        );

    if (all) {
      query =
        query.limit(
          1000
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

    const [
      listResult,
      summary,
    ] =
      await Promise.all([
        query,
        getSummary(),
      ]);

    if (
      listResult.error
    ) {
      throw listResult.error;
    }

    if (all) {
      return NextResponse.json({
        success:
          true,

        data:
          listResult.data ||
          [],

        total:
          listResult.data
            ?.length ||
          0,

        meta: {
          scope_context:
            scopeContext ||
            null,

          permission_context:
            isEmployeeContext
              ? "ems.employees.view"
              : "ems.sso_categories.view",
        },
      });
    }

    const total =
      Number(
        listResult.count ||
          0
      );

    return NextResponse.json({
      success:
        true,

      data:
        listResult.data ||
        [],

      summary,

      pagination: {
        page,
        pageSize,
        total,

        totalPages:
          Math.max(
            Math.ceil(
              total /
                pageSize
            ),
            1
          ),
      },

      meta: {
        scope_context:
          scopeContext ||
          null,

        permission_context:
          isEmployeeContext
            ? "ems.employees.view"
            : "ems.sso_categories.view",
      },
    });
  } catch (error) {
    console.error(
      "GET_SSO_CATEGORIES_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดประเภทผู้ประกันตนได้"
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
        MODULE_CODE,
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
      return jsonError(
        "รูปแบบ Request Body ไม่ถูกต้อง",
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

    if (
      payload.is_default
    ) {
      await clearOtherDefaults();
    }

    const actorId =
      guard?.access?.id ||
      null;

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "sso_categories"
        )
        .insert({
          ...payload,

          created_by:
            actorId,

          updated_by:
            actorId,
        })
        .select("*")
        .single();

    if (error) {
      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "รหัสประเภทผู้ประกันตนนี้มีอยู่แล้ว",
          409
        );
      }

      throw error;
    }

    try {
      await writeActivityLog({
        module_name:
          "sso_categories",

        action_type:
          "create",

        reference_table:
          "sso_categories",

        reference_id:
          data.id,

        description:
          `เพิ่มประเภทผู้ประกันตน ${data.category_code} - ${data.category_name_th}`,

        new_data:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "CREATE_SSO_CATEGORY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        message:
          "เพิ่มประเภทผู้ประกันตนเรียบร้อยแล้ว",

        data,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "POST_SSO_CATEGORY_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถเพิ่มประเภทผู้ประกันตนได้"
    );
  }
}
