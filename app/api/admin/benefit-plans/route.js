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
  "benefits.benefit_plans";

const ALLOWED_TYPES = [
  "allowance",
  "insurance",
  "reimbursement",
  "general",
];

const ALLOWED_PERIODS = [
  "once",
  "monthly",
  "yearly",
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
    Number(
      value
    );

  if (
    !Number.isInteger(
      parsed
    )
  ) {
    return fallback;
  }

  return parsed;
}

function parseBoolean(
  value,
  fallback = true
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
    category_id:
      cleanNullableText(
        body.category_id
      ),

    benefit_code:
      cleanText(
        body.benefit_code
      ).toUpperCase(),

    benefit_name:
      cleanText(
        body.benefit_name
      ),

    description:
      cleanNullableText(
        body.description
      ),

    benefit_type:
      cleanText(
        body.benefit_type ||
          "general"
      ).toLowerCase(),

    active_period:
      cleanNullableText(
        body.active_period
      )?.toLowerCase() ||
      null,

    is_active:
      parseBoolean(
        body.is_active,
        true
      ),

    sort_order:
      parseInteger(
        body.sort_order,
        0
      ),
  };
}

function validatePayload(
  payload
) {
  if (
    !payload
      .category_id
  ) {
    return "กรุณาเลือกประเภทสวัสดิการ";
  }

  if (
    !payload
      .benefit_code
  ) {
    return "กรุณากรอกรหัสแผนสวัสดิการ";
  }

  if (
    !/^[A-Z0-9_]+$/.test(
      payload
        .benefit_code
    )
  ) {
    return "รหัสแผนใช้ได้เฉพาะ A-Z, 0-9 และ _";
  }

  if (
    !payload
      .benefit_name
  ) {
    return "กรุณากรอกชื่อแผนสวัสดิการ";
  }

  if (
    !ALLOWED_TYPES.includes(
      payload.benefit_type
    )
  ) {
    return "รูปแบบสวัสดิการไม่ถูกต้อง";
  }

  if (
    payload.active_period &&
    !ALLOWED_PERIODS.includes(
      payload.active_period
    )
  ) {
    return "รอบสิทธิ์ไม่ถูกต้อง";
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

  return null;
}

async function assertCategory(
  categoryId
) {
  return supabaseAdmin
    .from(
      "benefit_categories"
    )
    .select(
      "id,category_code,category_name,is_active"
    )
    .eq(
      "id",
      categoryId
    )
    .maybeSingle();
}

async function loadReferenceMaps() {
  const [
    ruleResult,
    entitlementResult,
    requestResult,
    usageResult,
  ] =
    await Promise.all([
      supabaseAdmin
        .from(
          "benefit_rules"
        )
        .select(
          "benefit_id"
        ),

      supabaseAdmin
        .from(
          "benefit_entitlements"
        )
        .select(
          "benefit_id"
        ),

      supabaseAdmin
        .from(
          "benefit_requests"
        )
        .select(
          "benefit_id"
        ),

      supabaseAdmin
        .from(
          "benefit_usages"
        )
        .select(
          "benefit_id"
        ),
    ]);

  for (
    const result
    of [
      ruleResult,
      entitlementResult,
      requestResult,
      usageResult,
    ]
  ) {
    if (
      result.error
    ) {
      throw result.error;
    }
  }

  function countMap(
    rows
  ) {
    const map =
      new Map();

    for (
      const item
      of rows || []
    ) {
      const key =
        item.benefit_id;

      map.set(
        key,
        (
          map.get(
            key
          ) || 0
        ) + 1
      );
    }

    return map;
  }

  return {
    rules:
      countMap(
        ruleResult.data
      ),

    entitlements:
      countMap(
        entitlementResult.data
      ),

    requests:
      countMap(
        requestResult.data
      ),

    usages:
      countMap(
        usageResult.data
      ),
  };
}

function enrichReferenceCounts(
  rows,
  maps
) {
  return (
    rows || []
  ).map(
    (item) => {
      const ruleCount =
        maps.rules.get(
          item.id
        ) || 0;

      const entitlementCount =
        maps.entitlements.get(
          item.id
        ) || 0;

      const requestCount =
        maps.requests.get(
          item.id
        ) || 0;

      const usageCount =
        maps.usages.get(
          item.id
        ) || 0;

      return {
        ...item,

        rule_count:
          ruleCount,

        entitlement_count:
          entitlementCount,

        request_count:
          requestCount,

        usage_count:
          usageCount,

        reference_count:
          ruleCount +
          entitlementCount +
          requestCount +
          usageCount,
      };
    }
  );
}

async function getSummary(
  referenceMaps
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "benefits"
      )
      .select(
        "id,is_active"
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
          item.is_active ===
          true
      ).length,

    inactive:
      rows.filter(
        (item) =>
          item.is_active ===
          false
      ).length,

    with_rules:
      rows.filter(
        (item) =>
          (
            referenceMaps
              .rules
              .get(
                item.id
              ) || 0
          ) > 0
      ).length,
  };
}

/* =========================================================
   GET /api/admin/benefit-plans
========================================================= */

export async function GET(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        MODULE_CODE,
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(req.url);

    const search =
      cleanText(
        searchParams.get(
          "search"
        )
      );

    const categoryId =
      cleanText(
        searchParams.get(
          "category_id"
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
      ) ===
      "true";

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
      ![
        "active",
        "inactive",
      ].includes(
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
          "benefits"
        )
        .select(
          `
            id,
            category_id,
            benefit_code,
            benefit_name,
            description,
            benefit_type,
            active_period,
            is_active,
            sort_order,
            created_at,
            updated_at,
            benefit_categories:category_id (
              id,
              category_code,
              category_name,
              is_active
            )
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
            `benefit_code.ilike.%${search}%`,
            `benefit_name.ilike.%${search}%`,
            `description.ilike.%${search}%`,
          ].join(
            ","
          )
        );
    }

    if (
      categoryId
    ) {
      query =
        query.eq(
          "category_id",
          categoryId
        );
    }

    if (
      status ===
      "active"
    ) {
      query =
        query.eq(
          "is_active",
          true
        );
    }

    if (
      status ===
      "inactive"
    ) {
      query =
        query.eq(
          "is_active",
          false
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
          "benefit_name",
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

    const referenceMaps =
      await loadReferenceMaps();

    const [
      listResult,
      summary,
    ] =
      await Promise.all([
        query,
        getSummary(
          referenceMaps
        ),
      ]);

    if (
      listResult.error
    ) {
      throw listResult.error;
    }

    const data =
      enrichReferenceCounts(
        listResult.data ||
          [],
        referenceMaps
      );

    if (all) {
      return NextResponse.json({
        success:
          true,

        data,

        total:
          data.length,
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

      data,

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
    });
  } catch (error) {
    console.error(
      "GET_BENEFIT_PLANS_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดแผนสวัสดิการได้"
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

    let body =
      null;

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

    const {
      data:
        category,
      error:
        categoryError,
    } =
      await assertCategory(
        payload
          .category_id
      );

    if (
      categoryError
    ) {
      throw categoryError;
    }

    if (!category) {
      return jsonError(
        "ไม่พบประเภทสวัสดิการที่เลือก",
        400
      );
    }

    if (
      category.is_active !==
      true
    ) {
      return jsonError(
        "ประเภทสวัสดิการที่เลือกไม่ได้เปิดใช้งาน",
        400
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "benefits"
        )
        .insert(
          payload
        )
        .select(
          `
            *,
            benefit_categories:category_id (
              id,
              category_code,
              category_name,
              is_active
            )
          `
        )
        .single();

    if (error) {
      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "รหัสแผนสวัสดิการนี้มีอยู่แล้ว",
          409
        );
      }

      throw error;
    }

    try {
      await writeActivityLog({
        module_name:
          "benefit_plans",

        action_type:
          "create",

        reference_table:
          "benefits",

        reference_id:
          data.id,

        description:
          `เพิ่มแผนสวัสดิการ ${data.benefit_code} - ${data.benefit_name}`,

        new_data:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "CREATE_BENEFIT_PLAN_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        message:
          "เพิ่มแผนสวัสดิการเรียบร้อยแล้ว",

        data,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "POST_BENEFIT_PLAN_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถเพิ่มแผนสวัสดิการได้"
    );
  }
}
