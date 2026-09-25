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

async function loadById(
  id
) {
  return supabaseAdmin
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
      `
    )
    .eq(
      "id",
      id
    )
    .maybeSingle();
}

async function countBenefits(
  categoryId
) {
  const {
    count,
    error,
  } =
    await supabaseAdmin
      .from(
        "benefits"
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
        "category_id",
        categoryId
      );

  if (error) {
    throw error;
  }

  return Number(
    count ||
      0
  );
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
      benefitCount,
    ] =
      await Promise.all([
        loadById(
          id
        ),

        countBenefits(
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
        "ไม่พบประเภทสวัสดิการที่เลือก",
        404
      );
    }

    return NextResponse.json({
      success:
        true,

      data: {
        ...result.data,

        benefit_count:
          benefitCount,
      },
    });
  } catch (error) {
    console.error(
      "GET_BENEFIT_TYPE_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดประเภทสวัสดิการได้"
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
        "ไม่พบประเภทสวัสดิการที่เลือก",
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
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "benefit_categories"
        )
        .update({
          ...payload,

          /*
           * category_code ไม่ให้แก้
           * เพื่อรักษาความหมายของ Master ที่ระบบอื่นอาจอ้างอิง
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
          "*"
        )
        .single();

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        module_name:
          "benefit_types",

        action_type:
          "update",

        reference_table:
          "benefit_categories",

        reference_id:
          id,

        description:
          `แก้ไขประเภทสวัสดิการ ${current.category_code} - ${payload.category_name}`,

        old_data:
          current,

        new_data:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "UPDATE_BENEFIT_TYPE_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "แก้ไขประเภทสวัสดิการเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH_BENEFIT_TYPE_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถแก้ไขประเภทสวัสดิการได้"
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
        "ไม่พบประเภทสวัสดิการที่เลือก",
        404
      );
    }

    const benefitCount =
      await countBenefits(
        id
      );

    if (
      benefitCount >
      0
    ) {
      return jsonError(
        `ไม่สามารถลบประเภทนี้ได้ เนื่องจากมีสวัสดิการอ้างอิงอยู่ ${benefitCount} รายการ แนะนำให้เปลี่ยนสถานะเป็นไม่ใช้งาน`,
        409
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "benefit_categories"
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
          "benefit_types",

        action_type:
          "delete",

        reference_table:
          "benefit_categories",

        reference_id:
          id,

        description:
          `ลบประเภทสวัสดิการ ${current.category_code} - ${current.category_name}`,

        old_data:
          current,
      });
    } catch (
      logError
    ) {
      console.error(
        "DELETE_BENEFIT_TYPE_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "ลบประเภทสวัสดิการเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_BENEFIT_TYPE_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถลบประเภทสวัสดิการได้"
    );
  }
}
