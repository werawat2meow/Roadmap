import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const ALLOWED_CATEGORIES = [
  "mou",
  "direct_hire",
  "expat",
  "boi",
  "contractor",
  "other",
];

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

function cleanText(value) {
  return String(value || "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
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

function parseSortOrder(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function normalizeDate(value) {
  const text = cleanText(value);
  return text || null;
}

function normalizePayload(body = {}) {
  return {
    company_id: cleanText(body.company_id),
    scheme_code: cleanText(body.scheme_code).toUpperCase(),
    scheme_name_th: cleanText(body.scheme_name_th),
    scheme_name_en: cleanNullableText(body.scheme_name_en),
    scheme_category: cleanText(
      body.scheme_category || "other"
    ).toLowerCase(),
    description: cleanNullableText(body.description),
    requires_visa: cleanBoolean(body.requires_visa, true),
    requires_work_permit: cleanBoolean(
      body.requires_work_permit,
      true
    ),
    effective_date:
      normalizeDate(body.effective_date) ||
      new Date().toISOString().slice(0, 10),
    expire_date: normalizeDate(body.expire_date),
    status: cleanText(
      body.status || "active"
    ).toLowerCase(),
    sort_order: parseSortOrder(body.sort_order),
    remark: cleanNullableText(body.remark),
    updated_at: new Date().toISOString(),
  };
}

function validateDateRange(effectiveDate, expireDate) {
  if (!effectiveDate || !expireDate) {
    return null;
  }

  if (expireDate < effectiveDate) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มมีผล";
  }

  return null;
}

async function loadById(id) {
  const { data, error } =
    await supabaseAdmin
      .from(
        "foreign_employment_schemes"
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
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

/* =========================================================
   GET /api/admin/foreign-employment-schemes/[id]
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    const { id } = await params;

    const guard =
      await requireScopedAccess(
        "ems.foreign_employment_schemes",
        "view",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const data = await loadById(id);

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรูปแบบการจ้างพนักงานต่างชาติ",
        },
        { status: 404 }
      );
    }

    const scopeResponse =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์เข้าถึงรูปแบบการจ้างพนักงานต่างชาติรายการนี้"
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
      "GET_FOREIGN_EMPLOYMENT_SCHEME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดข้อมูลได้",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH /api/admin/foreign-employment-schemes/[id]
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } = await params;

    const guard =
      await requireScopedAccess(
        "ems.foreign_employment_schemes",
        "edit",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const oldData = await loadById(id);

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรูปแบบการจ้างพนักงานต่างชาติ",
        },
        { status: 404 }
      );
    }

    let scopeResponse =
      guard.assertAccessId(
        oldData.company_id,
        "คุณไม่มีสิทธิ์แก้ไขรูปแบบการจ้างพนักงานต่างชาติรายการนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const body = await req.json();
    const payload = normalizePayload(
      body
    );

    if (!payload.company_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกบริษัท",
        },
        { status: 400 }
      );
    }

    if (!payload.scheme_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสรูปแบบการจ้าง",
        },
        { status: 400 }
      );
    }

    if (!payload.scheme_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อรูปแบบการจ้าง",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_CATEGORIES.includes(
        payload.scheme_category
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ประเภทรูปแบบการจ้างไม่ถูกต้อง",
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
          error: "สถานะไม่ถูกต้อง",
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
          error: dateError,
        },
        { status: 400 }
      );
    }

    scopeResponse =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์ย้ายรูปแบบการจ้างพนักงานต่างชาติไปบริษัทนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabaseAdmin
      .from(
        "foreign_employment_schemes"
      )
      .select("id")
      .eq(
        "company_id",
        payload.company_id
      )
      .eq(
        "scheme_code",
        payload.scheme_code
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสรูปแบบการจ้างนี้มีอยู่แล้วในบริษัท",
        },
        { status: 400 }
      );
    }

    const actorId =
      guard?.access?.id || null;

    const updatePayload = {
      ...payload,
      updated_by: actorId,
    };

    const { data, error } =
      await supabaseAdmin
        .from(
          "foreign_employment_schemes"
        )
        .update(updatePayload)
        .eq("id", id)
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
        "foreign_employment_schemes",
      action_type: "update",
      reference_table:
        "foreign_employment_schemes",
      reference_id: id,
      description:
        `แก้ไขรูปแบบการจ้างพนักงานต่างชาติ ${data.scheme_code} - ${data.scheme_name_th}`,
      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขรูปแบบการจ้างพนักงานต่างชาติสำเร็จ",
      data,
    });
  } catch (error) {
    console.error(
      "UPDATE_FOREIGN_EMPLOYMENT_SCHEME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถแก้ไขรูปแบบการจ้างพนักงานต่างชาติได้",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE /api/admin/foreign-employment-schemes/[id]
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } = await params;

    const guard =
      await requireScopedAccess(
        "ems.foreign_employment_schemes",
        "delete",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const oldData = await loadById(id);

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรูปแบบการจ้างพนักงานต่างชาติ",
        },
        { status: 404 }
      );
    }

    const scopeResponse =
      guard.assertAccessId(
        oldData.company_id,
        "คุณไม่มีสิทธิ์ลบรูปแบบการจ้างพนักงานต่างชาติรายการนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const { error } =
      await supabaseAdmin
        .from(
          "foreign_employment_schemes"
        )
        .delete()
        .eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            error:
              "รูปแบบการจ้างนี้ถูกใช้งานอยู่ ไม่สามารถลบได้ กรุณาปรับสถานะเป็นไม่ใช้งานแทน",
          },
          { status: 409 }
        );
      }

      throw error;
    }

    await writeActivityLog({
      module_name:
        "foreign_employment_schemes",
      action_type: "delete",
      reference_table:
        "foreign_employment_schemes",
      reference_id: id,
      description:
        `ลบรูปแบบการจ้างพนักงานต่างชาติ ${oldData.scheme_code} - ${oldData.scheme_name_th}`,
      old_data: oldData,
    });

    return NextResponse.json({
      success: true,
      message:
        "ลบรูปแบบการจ้างพนักงานต่างชาติสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_FOREIGN_EMPLOYMENT_SCHEME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถลบรูปแบบการจ้างพนักงานต่างชาติได้",
      },
      { status: 500 }
    );
  }
}
