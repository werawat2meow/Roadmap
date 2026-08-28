import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const TABLE_NAME = "earning_types";
const ALLOWED_STATUSES = ["active", "inactive"];
const ALLOWED_CATEGORIES = [
  "salary",
  "overtime",
  "allowance",
  "bonus",
  "commission",
  "other",
];
const ALLOWED_CALCULATION_METHODS = [
  "fixed",
  "variable",
  "formula",
];

function cleanText(value) {
  return String(value || "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanCode(value) {
  return cleanText(value).toUpperCase();
}

function cleanBoolean(value, fallback = false) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function cleanNumber(value, fallback = null) {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getActorId(guard) {
  return (
    guard?.access?.user_account_id ||
    guard?.access?.user?.id ||
    guard?.user?.id ||
    null
  );
}

function jsonError(message, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status }
  );
}

function getErrorStatus(error) {
  if (!error) return 500;
  if (error.code === "23505") return 409;

  if (
    ["23503", "23514", "23502", "22P02"].includes(error.code)
  ) {
    return 400;
  }

  return 500;
}

function mapDatabaseError(error) {
  if (!error) return "เกิดข้อผิดพลาดในฐานข้อมูล";
  if (error.code === "23505") {
    return "รหัสประเภทเงินได้นี้มีอยู่แล้วในบริษัท";
  }
  if (error.code === "23503") {
    return "ไม่พบบริษัทหรือผู้ใช้งานที่อ้างอิง";
  }
  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }
  if (error.code === "23502") {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }
  if (error.code === "22P02") {
    return "รูปแบบข้อมูลหรือ UUID ไม่ถูกต้อง";
  }

  return error.message || "เกิดข้อผิดพลาดในฐานข้อมูล";
}

function normalizePayload(body, current) {
  return {
    company_id:
      body.company_id !== undefined
        ? cleanNullableText(body.company_id)
        : current.company_id,

    earning_code:
      body.earning_code !== undefined
        ? cleanCode(body.earning_code)
        : current.earning_code,

    earning_name:
      body.earning_name !== undefined
        ? cleanText(body.earning_name)
        : current.earning_name,

    description:
      body.description !== undefined
        ? cleanNullableText(body.description)
        : current.description,

    earning_category:
      body.earning_category !== undefined
        ? cleanText(body.earning_category)
        : current.earning_category,

    calculation_method:
      body.calculation_method !== undefined
        ? cleanText(body.calculation_method)
        : current.calculation_method,

    default_amount:
      body.default_amount !== undefined
        ? cleanNumber(body.default_amount, null)
        : current.default_amount,

    taxable:
      body.taxable !== undefined
        ? cleanBoolean(body.taxable, true)
        : current.taxable,

    social_security_applicable:
      body.social_security_applicable !== undefined
        ? cleanBoolean(body.social_security_applicable, false)
        : current.social_security_applicable,

    provident_fund_applicable:
      body.provident_fund_applicable !== undefined
        ? cleanBoolean(body.provident_fund_applicable, false)
        : current.provident_fund_applicable,

    include_in_gross_pay:
      body.include_in_gross_pay !== undefined
        ? cleanBoolean(body.include_in_gross_pay, true)
        : current.include_in_gross_pay,

    is_recurring:
      body.is_recurring !== undefined
        ? cleanBoolean(body.is_recurring, false)
        : current.is_recurring,

    effective_date:
      body.effective_date !== undefined
        ? cleanNullableText(body.effective_date)
        : current.effective_date,

    expire_date:
      body.expire_date !== undefined
        ? cleanNullableText(body.expire_date)
        : current.expire_date,

    status:
      body.status !== undefined
        ? cleanText(body.status)
        : current.status,

    sort_order:
      body.sort_order !== undefined
        ? Math.max(
            0,
            Number.parseInt(String(body.sort_order ?? 0), 10) || 0
          )
        : current.sort_order,

    remark:
      body.remark !== undefined
        ? cleanNullableText(body.remark)
        : current.remark,
  };
}

function validatePayload(payload) {
  if (!payload.company_id) return "กรุณาเลือกบริษัท";
  if (!payload.earning_code) return "กรุณากรอกรหัสประเภทเงินได้";
  if (!payload.earning_name) return "กรุณากรอกชื่อประเภทเงินได้";

  if (!ALLOWED_CATEGORIES.includes(payload.earning_category)) {
    return "หมวดเงินได้ไม่ถูกต้อง";
  }

  if (
    !ALLOWED_CALCULATION_METHODS.includes(
      payload.calculation_method
    )
  ) {
    return "วิธีคำนวณไม่ถูกต้อง";
  }

  if (
    payload.calculation_method === "fixed" &&
    (payload.default_amount === null ||
      Number(payload.default_amount) < 0)
  ) {
    return "กรุณาระบุจำนวนเงินเริ่มต้นสำหรับแบบจำนวนคงที่";
  }

  if (
    payload.default_amount !== null &&
    Number(payload.default_amount) < 0
  ) {
    return "จำนวนเงินเริ่มต้นต้องไม่น้อยกว่า 0";
  }

  if (!ALLOWED_STATUSES.includes(payload.status)) {
    return "สถานะไม่ถูกต้อง";
  }

  if (
    payload.expire_date &&
    payload.effective_date &&
    payload.expire_date < payload.effective_date
  ) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้";
  }

  return null;
}

async function loadRecord(id) {
  return supabaseAdmin
    .from(TABLE_NAME)
    .select(
      `
        id,
        company_id,
        earning_code,
        earning_name,
        description,
        earning_category,
        calculation_method,
        default_amount,
        taxable,
        social_security_applicable,
        provident_fund_applicable,
        include_in_gross_pay,
        is_recurring,
        effective_date,
        expire_date,
        status,
        sort_order,
        remark,
        created_by,
        updated_by,
        created_at,
        updated_at,
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
}

export async function GET(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.earning_types",
      "view",
      { scopeType: "company" }
    );

    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data, error } = await loadRecord(id);

    if (error) throw error;
    if (!data) return jsonError("ไม่พบประเภทเงินได้", 404);

    const scopeError = guard.assertAccessId(
      data.company_id,
      "คุณไม่มีสิทธิ์ดูประเภทเงินได้ของบริษัทนี้"
    );

    if (scopeError) return scopeError;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_EARNING_TYPE_ERROR:", error);

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.earning_types",
      "edit",
      { scopeType: "company" }
    );

    if (!guard.ok) return guard.response;

    const { id } = await params;
    const currentResult = await loadRecord(id);

    if (currentResult.error) throw currentResult.error;

    const current = currentResult.data;

    if (!current) {
      return jsonError("ไม่พบประเภทเงินได้", 404);
    }

    const currentScopeError = guard.assertAccessId(
      current.company_id,
      "คุณไม่มีสิทธิ์แก้ไขประเภทเงินได้ของบริษัทนี้"
    );

    if (currentScopeError) return currentScopeError;

    const body = await req.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError("Request Body ไม่ถูกต้อง", 400);
    }

    const payload = normalizePayload(body, current);
    const validationError = validatePayload(payload);

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const targetScopeError = guard.assertAccessId(
      payload.company_id,
      "คุณไม่มีสิทธิ์ย้ายประเภทเงินได้ไปยังบริษัทนี้"
    );

    if (targetScopeError) return targetScopeError;

    const actorId = getActorId(guard);

    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .update({
        ...payload,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
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

    if (error) throw error;

    try {
      await writeActivityLog({
        moduleName: "earning_types",
        actionType: "UPDATE",
        referenceTable: TABLE_NAME,
        referenceId: id,
        description: `แก้ไขประเภทเงินได้ ${data.earning_code} - ${data.earning_name}`,
        oldData: current,
        newData: data,
      });
    } catch (logError) {
      console.error(
        "EARNING_TYPE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขประเภทเงินได้เรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("PATCH_EARNING_TYPE_ERROR:", error);

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.earning_types",
      "delete",
      { scopeType: "company" }
    );

    if (!guard.ok) return guard.response;

    const { id } = await params;
    const currentResult = await loadRecord(id);

    if (currentResult.error) throw currentResult.error;

    const current = currentResult.data;

    if (!current) {
      return jsonError("ไม่พบประเภทเงินได้", 404);
    }

    const scopeError = guard.assertAccessId(
      current.company_id,
      "คุณไม่มีสิทธิ์ลบประเภทเงินได้ของบริษัทนี้"
    );

    if (scopeError) return scopeError;

    const { error } = await supabaseAdmin
      .from(TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) throw error;

    try {
      await writeActivityLog({
        moduleName: "earning_types",
        actionType: "DELETE",
        referenceTable: TABLE_NAME,
        referenceId: id,
        description: `ลบประเภทเงินได้ ${current.earning_code} - ${current.earning_name}`,
        oldData: current,
        newData: null,
      });
    } catch (logError) {
      console.error(
        "EARNING_TYPE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบประเภทเงินได้เรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE_EARNING_TYPE_ERROR:", error);

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
