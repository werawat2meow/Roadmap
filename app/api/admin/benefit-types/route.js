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
  "benefits.benefit_types";

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
    category_code:
      cleanText(
        body
          .category_code
      ).toUpperCase(),

    category_name:
      cleanText(
        body
          .category_name
      ),

    description:
      cleanNullableText(
        body.description
      ),

    sort_order:
      parseInteger(
        body.sort_order,
        0
      ),

    is_active:
      parseBoolean(
        body.is_active,
        true
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
    return "กรุณากรอกรหัสประเภทสวัสดิการ";
  }

  if (
    !/^[A-Z0-9_]+$/.test(
      payload
        .category_code
    )
  ) {
    return "รหัสประเภทใช้ได้เฉพาะ A-Z, 0-9 และ _";
  }

  if (
    !payload
      .category_name
  ) {
    return "กรุณากรอกชื่อประเภทสวัสดิการ";
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

async function loadBenefitCountMap() {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "benefits"
      )
      .select(
        "category_id"
      )
      .not(
        "category_id",
        "is",
        null
      );

  if (error) {
    throw error;
  }

  const map =
    new Map();

  for (
    const item
    of data || []
  ) {
    const key =
      item.category_id;

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

async function getSummary() {
  const [
    categoryResult,
    benefitCountMap,
  ] =
    await Promise.all([
      supabaseAdmin
        .from(
          "benefit_categories"
        )
        .select(
          "id,is_active"
        ),

      loadBenefitCountMap(),
    ]);

  if (
    categoryResult.error
  ) {
    throw categoryResult.error;
  }

  const rows =
    categoryResult.data ||
    [];

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

    in_use:
      rows.filter(
        (item) =>
          (
            benefitCountMap.get(
              item.id
            ) || 0
          ) > 0
      ).length,
  };
}

/* =========================================================
   GET /api/admin/benefit-types
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
          "benefit_categories"
        )
        .select(
          `
            id,
            category_code,
            category_name,
            description,
            sort_order,
            is_active,
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
            `category_code.ilike.%${search}%`,
            `category_name.ilike.%${search}%`,
            `description.ilike.%${search}%`,
          ].join(
            ","
          )
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
          "category_name",
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
      benefitCountMap,
    ] =
      await Promise.all([
        query,
        getSummary(),
        loadBenefitCountMap(),
      ]);

    if (
      listResult.error
    ) {
      throw listResult.error;
    }

    const data =
      (
        listResult.data ||
        []
      ).map(
        (item) => ({
          ...item,

          benefit_count:
            benefitCountMap.get(
              item.id
            ) || 0,
        })
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
      "GET_BENEFIT_TYPES_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดประเภทสวัสดิการได้"
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
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "benefit_categories"
        )
        .insert(
          payload
        )
        .select(
          "*"
        )
        .single();

    if (error) {
      if (
        error.code ===
        "23505"
      ) {
        return jsonError(
          "รหัสประเภทสวัสดิการนี้มีอยู่แล้ว",
          409
        );
      }

      throw error;
    }

    try {
      await writeActivityLog({
        module_name:
          "benefit_types",

        action_type:
          "create",

        reference_table:
          "benefit_categories",

        reference_id:
          data.id,

        description:
          `เพิ่มประเภทสวัสดิการ ${data.category_code} - ${data.category_name}`,

        new_data:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "CREATE_BENEFIT_TYPE_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json(
      {
        success:
          true,

        message:
          "เพิ่มประเภทสวัสดิการเรียบร้อยแล้ว",

        data,
      },
      {
        status:
          201,
      }
    );
  } catch (error) {
    console.error(
      "POST_BENEFIT_TYPE_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถเพิ่มประเภทสวัสดิการได้"
    );
  }
}
