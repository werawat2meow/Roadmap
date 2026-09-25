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

async function loadById(
  id
) {
  return supabaseAdmin
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
      `
    )
    .eq(
      "id",
      id
    )
    .maybeSingle();
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

async function countReferences(
  benefitId
) {
  const [
    rules,
    entitlements,
    requests,
    usages,
  ] =
    await Promise.all([
      supabaseAdmin
        .from(
          "benefit_rules"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "benefit_id",
          benefitId
        ),

      supabaseAdmin
        .from(
          "benefit_entitlements"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "benefit_id",
          benefitId
        ),

      supabaseAdmin
        .from(
          "benefit_requests"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "benefit_id",
          benefitId
        ),

      supabaseAdmin
        .from(
          "benefit_usages"
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          }
        )
        .eq(
          "benefit_id",
          benefitId
        ),
    ]);

  for (
    const result
    of [
      rules,
      entitlements,
      requests,
      usages,
    ]
  ) {
    if (
      result.error
    ) {
      throw result.error;
    }
  }

  return {
    rules:
      Number(
        rules.count ||
          0
      ),

    entitlements:
      Number(
        entitlements.count ||
          0
      ),

    requests:
      Number(
        requests.count ||
          0
      ),

    usages:
      Number(
        usages.count ||
          0
      ),
  };
}

export async function GET(
  req,
  {
    params,
  }
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
      id,
    } =
      await params;

    const [
      result,
      references,
    ] =
      await Promise.all([
        loadById(
          id
        ),

        countReferences(
          id
        ),
      ]);

    if (
      result.error
    ) {
      throw result.error;
    }

    if (
      !result.data
    ) {
      return jsonError(
        "ไม่พบแผนสวัสดิการที่เลือก",
        404
      );
    }

    const referenceCount =
      references.rules +
      references.entitlements +
      references.requests +
      references.usages;

    return NextResponse.json({
      success:
        true,

      data: {
        ...result.data,

        rule_count:
          references.rules,

        entitlement_count:
          references.entitlements,

        request_count:
          references.requests,

        usage_count:
          references.usages,

        reference_count:
          referenceCount,
      },
    });
  } catch (error) {
    console.error(
      "GET_BENEFIT_PLAN_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดแผนสวัสดิการได้"
    );
  }
}

export async function PATCH(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        MODULE_CODE,
        "edit"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      id,
    } =
      await params;

    const {
      data:
        current,
      error:
        currentError,
    } =
      await loadById(
        id
      );

    if (
      currentError
    ) {
      throw currentError;
    }

    if (!current) {
      return jsonError(
        "ไม่พบแผนสวัสดิการที่เลือก",
        404
      );
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

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "benefits"
        )
        .update({
          ...payload,

          /*
           * benefit_code ไม่ให้แก้
           * เพื่อรักษาความหมายของ Plan ที่ Rule / Entitlement อ้างอิง
           */
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
      throw error;
    }

    try {
      await writeActivityLog({
        module_name:
          "benefit_plans",

        action_type:
          "update",

        reference_table:
          "benefits",

        reference_id:
          id,

        description:
          `แก้ไขแผนสวัสดิการ ${current.benefit_code} - ${payload.benefit_name}`,

        old_data:
          current,

        new_data:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "UPDATE_BENEFIT_PLAN_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "แก้ไขแผนสวัสดิการเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH_BENEFIT_PLAN_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถแก้ไขแผนสวัสดิการได้"
    );
  }
}

export async function DELETE(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        MODULE_CODE,
        "delete"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      id,
    } =
      await params;

    const {
      data:
        current,
      error:
        currentError,
    } =
      await loadById(
        id
      );

    if (
      currentError
    ) {
      throw currentError;
    }

    if (!current) {
      return jsonError(
        "ไม่พบแผนสวัสดิการที่เลือก",
        404
      );
    }

    const references =
      await countReferences(
        id
      );

    const totalReferences =
      references.rules +
      references.entitlements +
      references.requests +
      references.usages;

    if (
      totalReferences >
      0
    ) {
      return jsonError(
        `ไม่สามารถลบแผนนี้ได้ เนื่องจากมีข้อมูลอ้างอิงอยู่ ${totalReferences} รายการ แนะนำให้เปลี่ยนสถานะเป็นไม่ใช้งาน`,
        409
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "benefits"
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
        module_name:
          "benefit_plans",

        action_type:
          "delete",

        reference_table:
          "benefits",

        reference_id:
          id,

        description:
          `ลบแผนสวัสดิการ ${current.benefit_code} - ${current.benefit_name}`,

        old_data:
          current,
      });
    } catch (
      logError
    ) {
      console.error(
        "DELETE_BENEFIT_PLAN_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "ลบแผนสวัสดิการเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_BENEFIT_PLAN_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถลบแผนสวัสดิการได้"
    );
  }
}
