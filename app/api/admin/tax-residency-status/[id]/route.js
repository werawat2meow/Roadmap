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

async function loadById(
  id
) {
  return supabaseAdmin
    .from(
      "tax_residency_statuses"
    )
    .select("*")
    .eq(
      "id",
      id
    )
    .maybeSingle();
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
        "ไม่พบสถานะผู้มีถิ่นที่อยู่ทางภาษีที่เลือก",
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
      "GET_TAX_RESIDENCY_STATUS_ITEM_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
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
        "ไม่พบสถานะผู้มีถิ่นที่อยู่ทางภาษีที่เลือก",
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
        .update({
          ...payload,

          /*
           * residency_code ไม่ให้แก้
           * เพื่อไม่ให้ค่าที่ Employee Profile ใช้อยู่เปลี่ยนความหมาย
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
          "tax_residency_statuses",

        action_type:
          "update",

        reference_table:
          "tax_residency_statuses",

        reference_id:
          id,

        description:
          `แก้ไขสถานะผู้มีถิ่นที่อยู่ทางภาษี ${current.residency_code} - ${payload.residency_name_th}`,

        old_data:
          current,

        new_data:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "UPDATE_TAX_RESIDENCY_STATUS_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "แก้ไขสถานะผู้มีถิ่นที่อยู่ทางภาษีเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH_TAX_RESIDENCY_STATUS_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถแก้ไขสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
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
        "ไม่พบสถานะผู้มีถิ่นที่อยู่ทางภาษีที่เลือก",
        404
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "tax_residency_statuses"
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
          "tax_residency_statuses",

        action_type:
          "delete",

        reference_table:
          "tax_residency_statuses",

        reference_id:
          id,

        description:
          `ลบสถานะผู้มีถิ่นที่อยู่ทางภาษี ${current.residency_code} - ${current.residency_name_th}`,

        old_data:
          current,
      });
    } catch (
      logError
    ) {
      console.error(
        "DELETE_TAX_RESIDENCY_STATUS_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "ลบสถานะผู้มีถิ่นที่อยู่ทางภาษีเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_TAX_RESIDENCY_STATUS_ERROR:",
      error
    );

    if (
      error?.code ===
      "23503"
    ) {
      return jsonError(
        "ไม่สามารถลบสถานะนี้ได้ เนื่องจากมีข้อมูลพนักงานอ้างอิงอยู่ แนะนำให้เปลี่ยนสถานะเป็นไม่ใช้งาน",
        409
      );
    }

    return jsonError(
      error?.message ||
        "ไม่สามารถลบสถานะผู้มีถิ่นที่อยู่ทางภาษีได้"
    );
  }
}
