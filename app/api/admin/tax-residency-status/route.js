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
  "ems.tax_residency";

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
  return {
    residency_code:
      cleanText(
        body
          .residency_code
      ).toLowerCase(),

    residency_name_th:
      cleanText(
        body
          .residency_name_th
      ),

    residency_name_en:
      cleanNullableText(
        body
          .residency_name_en
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
      .residency_code
  ) {
    return "กรุณากรอกรหัสสถานะ";
  }

  if (
    !/^[a-z0-9_]+$/.test(
      payload
        .residency_code
    )
  ) {
    return "รหัสสถานะใช้ได้เฉพาะ a-z, 0-9 และ _";
  }

  if (
    !payload
      .residency_name_th
  ) {
    return "กรุณากรอกชื่อสถานะภาษาไทย";
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

  return null;
}

async function getSummary() {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "tax_residency_statuses"
      )
      .select(
        "status"
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
  };
}

/* =========================================================
   GET /api/admin/tax-residency-status

   Permission:
   - Master Page:
     ems.tax_residency.view
   - Employee Context:
     ems.employees.view

   Global Master
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
     * Explicit allowlist only.
     * Do not trust arbitrary module code from query string.
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
          "tax_residency_statuses"
        )
        .select(
          `
            id,
            residency_code,
            residency_name_th,
            residency_name_en,
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
      query =
        query.or(
          [
            `residency_code.ilike.%${search}%`,
            `residency_name_th.ilike.%${search}%`,
            `residency_name_en.ilike.%${search}%`,
            `remark.ilike.%${search}%`,
          ].join(",")
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
          "residency_name_th",
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
              : "ems.tax_residency.view",
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
            : "ems.tax_residency.view",
      },
    });
  } catch (error) {
    console.error(
      "GET_TAX_RESIDENCY_STATUS_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
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

    const actorId =
      guard?.access?.id ||
      null;

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "tax_residency_statuses"
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
          "รหัสสถานะผู้มีถิ่นที่อยู่ทางภาษีนี้มีอยู่แล้ว",
          409
        );
      }

      throw error;
    }

    try {
      await writeActivityLog({
        module_name:
          "tax_residency_statuses",

        action_type:
          "create",

        reference_table:
          "tax_residency_statuses",

        reference_id:
          data.id,

        description:
          `เพิ่มสถานะผู้มีถิ่นที่อยู่ทางภาษี ${data.residency_code} - ${data.residency_name_th}`,

        new_data:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "CREATE_TAX_RESIDENCY_STATUS_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        message:
          "เพิ่มสถานะผู้มีถิ่นที่อยู่ทางภาษีเรียบร้อยแล้ว",

        data,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "POST_TAX_RESIDENCY_STATUS_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถเพิ่มสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
    );
  }
}
