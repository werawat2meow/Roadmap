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

async function loadById(
  id
) {
  return supabaseAdmin
    .from(
      "sso_categories"
    )
    .select("*")
    .eq(
      "id",
      id
    )
    .maybeSingle();
}

async function clearOtherDefaults(
  excludeId
) {
  const {
    error,
  } =
    await supabaseAdmin
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
      )
      .neq(
        "id",
        excludeId
      );

  if (error) {
    throw error;
  }
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

    const {
      data,
      error,
    } =
      await loadById(
        id
      );

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError(
        "ไม่พบประเภทผู้ประกันตนที่เลือก",
        404
      );
    }

    return NextResponse.json({
      success:
        true,

      data,
    });
  } catch (error) {
    console.error(
      "GET_SSO_CATEGORY_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดประเภทผู้ประกันตนได้"
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
        "ไม่พบประเภทผู้ประกันตนที่เลือก",
        404
      );
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
      await clearOtherDefaults(
        id
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
          "sso_categories"
        )
        .update({
          ...payload,

          /*
           * category_code ไม่ให้แก้
           * เพื่อไม่ทำให้ value เดิมใน Employee Profile เปลี่ยนความหมาย
           */
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
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        module_name:
          "sso_categories",

        action_type:
          "update",

        reference_table:
          "sso_categories",

        reference_id:
          id,

        description:
          `แก้ไขประเภทผู้ประกันตน ${current.category_code} - ${payload.category_name_th}`,

        old_data:
          current,

        new_data:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "UPDATE_SSO_CATEGORY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "แก้ไขประเภทผู้ประกันตนเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH_SSO_CATEGORY_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถแก้ไขประเภทผู้ประกันตนได้"
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
        "ไม่พบประเภทผู้ประกันตนที่เลือก",
        404
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "sso_categories"
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
          "sso_categories",

        action_type:
          "delete",

        reference_table:
          "sso_categories",

        reference_id:
          id,

        description:
          `ลบประเภทผู้ประกันตน ${current.category_code} - ${current.category_name_th}`,

        old_data:
          current,
      });
    } catch (
      logError
    ) {
      console.error(
        "DELETE_SSO_CATEGORY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "ลบประเภทผู้ประกันตนเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_SSO_CATEGORY_ERROR:",
      error
    );

    if (
      error?.code ===
      "23503"
    ) {
      return jsonError(
        "ไม่สามารถลบประเภทนี้ได้ เนื่องจากมีข้อมูลพนักงานอ้างอิงอยู่ แนะนำให้เปลี่ยนสถานะเป็นไม่ใช้งาน",
        409
      );
    }

    return jsonError(
      error?.message ||
        "ไม่สามารถลบประเภทผู้ประกันตนได้"
    );
  }
}
