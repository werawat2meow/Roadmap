import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

function cleanText(value) {
  return String(
    value || ""
  ).trim();
}

function cleanNullableText(value) {
  const text =
    cleanText(value);

  return text || null;
}

function cleanBoolean(
  value,
  fallback = false
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function parseNullablePositiveInteger(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return null;
  }

  return Math.floor(parsed);
}

function parseSortOrder(value) {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return 0;
  }

  return Math.floor(parsed);
}

function normalizeDate(value) {
  const text =
    cleanText(value);

  return text || null;
}

function normalizePayload(
  body = {}
) {
  return {
    company_id:
      cleanText(
        body.company_id
      ),

    permit_code:
      cleanText(
        body.permit_code
      ).toUpperCase(),

    permit_name_th:
      cleanText(
        body.permit_name_th
      ),

    permit_name_en:
      cleanNullableText(
        body.permit_name_en
      ),

    description:
      cleanNullableText(
        body.description
      ),

    requires_valid_visa:
      cleanBoolean(
        body.requires_valid_visa,
        true
      ),

    is_renewable:
      cleanBoolean(
        body.is_renewable,
        true
      ),

    default_validity_days:
      parseNullablePositiveInteger(
        body.default_validity_days
      ),

    effective_date:
      normalizeDate(
        body.effective_date
      ) ||
      new Date()
        .toISOString()
        .slice(0, 10),

    expire_date:
      normalizeDate(
        body.expire_date
      ),

    status:
      cleanText(
        body.status ||
        "active"
      ).toLowerCase(),

    sort_order:
      parseSortOrder(
        body.sort_order
      ),

    remark:
      cleanNullableText(
        body.remark
      ),

    updated_at:
      new Date()
        .toISOString(),
  };
}

function validateDateRange(
  effectiveDate,
  expireDate
) {
  if (
    !effectiveDate ||
    !expireDate
  ) {
    return null;
  }

  if (
    expireDate <
    effectiveDate
  ) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มมีผล";
  }

  return null;
}

async function loadById(id) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("work_permit_types")
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
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   GET /api/admin/work-permit-types/[id]

   Permission:
   ems.work_permit_types.view

   Scope:
   company
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    const {
      id,
    } =
      await params;

    const guard =
      await requireScopedAccess(
        "ems.work_permit_types",
        "view",
        {
          scopeType:
            "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const data =
      await loadById(id);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบประเภทใบอนุญาตทำงาน",
        },
        { status: 404 }
      );
    }

    const scopeResponse =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์เข้าถึงประเภทใบอนุญาตทำงานรายการนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET_WORK_PERMIT_TYPE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดประเภทใบอนุญาตทำงานได้",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/admin/work-permit-types/[id]

   Permission:
   ems.work_permit_types.edit

   Scope:
   company
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const {
      id,
    } =
      await params;

    const guard =
      await requireScopedAccess(
        "ems.work_permit_types",
        "edit",
        {
          scopeType:
            "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const oldData =
      await loadById(id);

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบประเภทใบอนุญาตทำงาน",
        },
        { status: 404 }
      );
    }

    let scopeResponse =
      guard.assertAccessId(
        oldData.company_id,
        "คุณไม่มีสิทธิ์แก้ไขประเภทใบอนุญาตทำงานรายการนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const body =
      await req.json();

    const payload =
      normalizePayload(
        body
      );

    if (!payload.company_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกบริษัท",
        },
        { status: 400 }
      );
    }

    if (!payload.permit_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสประเภทใบอนุญาตทำงาน",
        },
        { status: 400 }
      );
    }

    if (!payload.permit_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อประเภทใบอนุญาตทำงาน",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_STATUSES.includes(
        payload.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "สถานะไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const dateError =
      validateDateRange(
        payload.effective_date,
        payload.expire_date
      );

    if (dateError) {
      return NextResponse.json(
        {
          success: false,
          error:
            dateError,
        },
        { status: 400 }
      );
    }

    scopeResponse =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์ย้ายประเภทใบอนุญาตทำงานไปยังบริษัทนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const {
      data:
        duplicate,
      error:
        duplicateError,
    } =
      await supabaseAdmin
        .from("work_permit_types")
        .select("id")
        .eq(
          "company_id",
          payload.company_id
        )
        .eq(
          "permit_code",
          payload.permit_code
        )
        .neq(
          "id",
          id
        )
        .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสประเภทใบอนุญาตทำงานนี้มีอยู่แล้วในบริษัท",
        },
        { status: 400 }
      );
    }

    const actorId =
      guard?.access?.id ||
      null;

    const updatePayload = {
      ...payload,
      updated_by:
        actorId,
    };

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("work_permit_types")
        .update(
          updatePayload
        )
        .eq(
          "id",
          id
        )
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

    await writeActivityLog({
      module_name:
        "work_permit_types",

      action_type:
        "update",

      reference_table:
        "work_permit_types",

      reference_id:
        id,

      description:
        `แก้ไขประเภทใบอนุญาตทำงาน ${data.permit_code} - ${data.permit_name_th}`,

      old_data:
        oldData,

      new_data:
        data,
    });

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขประเภทใบอนุญาตทำงานสำเร็จ",
      data,
    });
  } catch (error) {
    console.error(
      "UPDATE_WORK_PERMIT_TYPE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถแก้ไขประเภทใบอนุญาตทำงานได้",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE /api/admin/work-permit-types/[id]

   Permission:
   ems.work_permit_types.delete

   Scope:
   company
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const {
      id,
    } =
      await params;

    const guard =
      await requireScopedAccess(
        "ems.work_permit_types",
        "delete",
        {
          scopeType:
            "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const oldData =
      await loadById(id);

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบประเภทใบอนุญาตทำงาน",
        },
        { status: 404 }
      );
    }

    const scopeResponse =
      guard.assertAccessId(
        oldData.company_id,
        "คุณไม่มีสิทธิ์ลบประเภทใบอนุญาตทำงานรายการนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from("work_permit_types")
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      throw error;
    }

    await writeActivityLog({
      module_name:
        "work_permit_types",

      action_type:
        "delete",

      reference_table:
        "work_permit_types",

      reference_id:
        id,

      description:
        `ลบประเภทใบอนุญาตทำงาน ${oldData.permit_code} - ${oldData.permit_name_th}`,

      old_data:
        oldData,
    });

    return NextResponse.json({
      success: true,
      message:
        "ลบประเภทใบอนุญาตทำงานสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_WORK_PERMIT_TYPE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถลบประเภทใบอนุญาตทำงานได้",
      },
      { status: 500 }
    );
  }
}
