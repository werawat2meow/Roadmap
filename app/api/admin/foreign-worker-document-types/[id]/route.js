import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

const ALLOWED_CATEGORIES = [
  "passport",
  "visa",
  "work_permit",
  "mou",
  "identity",
  "medical",
  "insurance",
  "employment",
  "government",
  "other",
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

    document_code:
      cleanText(
        body.document_code
      ).toUpperCase(),

    document_name_th:
      cleanText(
        body.document_name_th
      ),

    document_name_en:
      cleanNullableText(
        body.document_name_en
      ),

    document_category:
      cleanText(
        body.document_category ||
        "other"
      ).toLowerCase(),

    description:
      cleanNullableText(
        body.description
      ),

    requires_document_no:
      cleanBoolean(
        body.requires_document_no,
        true
      ),

    requires_issue_date:
      cleanBoolean(
        body.requires_issue_date,
        false
      ),

    requires_expiry_date:
      cleanBoolean(
        body.requires_expiry_date,
        false
      ),

    is_mandatory:
      cleanBoolean(
        body.is_mandatory,
        false
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
      .from(
        "foreign_worker_document_types"
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
   GET /api/admin/foreign-worker-document-types/[id]

   Permission:
   ems.foreign_worker_document_types.view

   Scope:
   company
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

    const guard =
      await requireScopedAccess(
        "ems.foreign_worker_document_types",
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
            "ไม่พบประเภทเอกสารแรงงานต่างชาติ",
        },
        { status: 404 }
      );
    }

    const scopeResponse =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์เข้าถึงประเภทเอกสารแรงงานต่างชาติรายการนี้"
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
      "GET_FOREIGN_WORKER_DOCUMENT_TYPE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดประเภทเอกสารแรงงานต่างชาติได้",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/admin/foreign-worker-document-types/[id]

   Permission:
   ems.foreign_worker_document_types.edit

   Scope:
   company
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

    const guard =
      await requireScopedAccess(
        "ems.foreign_worker_document_types",
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
            "ไม่พบประเภทเอกสารแรงงานต่างชาติ",
        },
        { status: 404 }
      );
    }

    let scopeResponse =
      guard.assertAccessId(
        oldData.company_id,
        "คุณไม่มีสิทธิ์แก้ไขประเภทเอกสารแรงงานต่างชาติรายการนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const body =
      await req.json();

    const payload =
      normalizePayload(body);

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

    if (!payload.document_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสประเภทเอกสาร",
        },
        { status: 400 }
      );
    }

    if (!payload.document_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อประเภทเอกสาร",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_CATEGORIES.includes(
        payload.document_category
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "หมวดเอกสารไม่ถูกต้อง",
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
        "คุณไม่มีสิทธิ์ย้ายประเภทเอกสารแรงงานต่างชาติไปยังบริษัทนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const {
      data: duplicate,
      error: duplicateError,
    } =
      await supabaseAdmin
        .from(
          "foreign_worker_document_types"
        )
        .select("id")
        .eq(
          "company_id",
          payload.company_id
        )
        .eq(
          "document_code",
          payload.document_code
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
            "รหัสประเภทเอกสารนี้มีอยู่แล้วในบริษัท",
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
        .from(
          "foreign_worker_document_types"
        )
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
        "foreign_worker_document_types",

      action_type:
        "update",

      reference_table:
        "foreign_worker_document_types",

      reference_id:
        id,

      description:
        `แก้ไขประเภทเอกสารแรงงานต่างชาติ ${data.document_code} - ${data.document_name_th}`,

      old_data:
        oldData,

      new_data:
        data,
    });

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขประเภทเอกสารแรงงานต่างชาติสำเร็จ",
      data,
    });
  } catch (error) {
    console.error(
      "UPDATE_FOREIGN_WORKER_DOCUMENT_TYPE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถแก้ไขประเภทเอกสารแรงงานต่างชาติได้",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE /api/admin/foreign-worker-document-types/[id]

   Permission:
   ems.foreign_worker_document_types.delete

   Scope:
   company
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

    const guard =
      await requireScopedAccess(
        "ems.foreign_worker_document_types",
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
            "ไม่พบประเภทเอกสารแรงงานต่างชาติ",
        },
        { status: 404 }
      );
    }

    const scopeResponse =
      guard.assertAccessId(
        oldData.company_id,
        "คุณไม่มีสิทธิ์ลบประเภทเอกสารแรงงานต่างชาติรายการนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "foreign_worker_document_types"
        )
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
        "foreign_worker_document_types",

      action_type:
        "delete",

      reference_table:
        "foreign_worker_document_types",

      reference_id:
        id,

      description:
        `ลบประเภทเอกสารแรงงานต่างชาติ ${oldData.document_code} - ${oldData.document_name_th}`,

      old_data:
        oldData,
    });

    return NextResponse.json({
      success: true,
      message:
        "ลบประเภทเอกสารแรงงานต่างชาติสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_FOREIGN_WORKER_DOCUMENT_TYPE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถลบประเภทเอกสารแรงงานต่างชาติได้",
      },
      { status: 500 }
    );
  }
}
