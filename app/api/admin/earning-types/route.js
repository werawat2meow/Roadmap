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

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALL_LIMIT = 500;

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

function sanitizeSearch(value) {
  return cleanText(value)
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .trim();
}

function getActorId(guard) {
  return (
    guard?.access?.user_account_id ||
    guard?.access?.user?.id ||
    guard?.user?.id ||
    null
  );
}

function normalizePayload(body = {}) {
  return {
    company_id: cleanNullableText(body.company_id),
    earning_code: cleanCode(body.earning_code),
    earning_name: cleanText(body.earning_name),
    description: cleanNullableText(body.description),
    earning_category: cleanText(body.earning_category) || "other",
    calculation_method: cleanText(body.calculation_method) || "fixed",
    default_amount: cleanNumber(body.default_amount, null),
    taxable: cleanBoolean(body.taxable, true),
    social_security_applicable: cleanBoolean(
      body.social_security_applicable,
      false
    ),
    provident_fund_applicable: cleanBoolean(
      body.provident_fund_applicable,
      false
    ),
    include_in_gross_pay: cleanBoolean(
      body.include_in_gross_pay,
      true
    ),
    is_recurring: cleanBoolean(body.is_recurring, false),
    effective_date:
      cleanNullableText(body.effective_date) ||
      new Date().toISOString().slice(0, 10),
    expire_date: cleanNullableText(body.expire_date),
    status: cleanText(body.status) || "active",
    sort_order: Math.max(
      0,
      Number.parseInt(String(body.sort_order ?? 0), 10) || 0
    ),
    remark: cleanNullableText(body.remark),
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
    (payload.default_amount === null || payload.default_amount < 0)
  ) {
    return "กรุณาระบุจำนวนเงินเริ่มต้นสำหรับแบบจำนวนคงที่";
  }

  if (
    payload.default_amount !== null &&
    payload.default_amount < 0
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

function jsonError(message, status = 500, extra = {}) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    { status }
  );
}

function applyListFilters(
  query,
  {
    guard,
    search,
    companyId,
    status,
    category,
    calculationMethod,
  }
) {
  query = guard.applyScope(query, "company_id");

  if (search) {
    query = query.or(
      [
        `earning_code.ilike.%${search}%`,
        `earning_name.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `remark.ilike.%${search}%`,
      ].join(",")
    );
  }

  if (companyId) query = query.eq("company_id", companyId);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("earning_category", category);

  if (calculationMethod) {
    query = query.eq("calculation_method", calculationMethod);
  }

  return query;
}

async function loadSummary(filters) {
  let query = supabaseAdmin
    .from(TABLE_NAME)
    .select("id, status, taxable");

  query = applyListFilters(query, filters);

  const { data, error } = await query.limit(5000);
  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];

  return {
    total: rows.length,
    active: rows.filter((item) => item.status === "active").length,
    inactive: rows.filter((item) => item.status === "inactive").length,
    taxable: rows.filter((item) => item.taxable === true).length,
  };
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.earning_types",
      "view",
      { scopeType: "company" }
    );

    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);

    const search = sanitizeSearch(searchParams.get("search"));
    const companyId = cleanText(searchParams.get("company_id"));
    const status = cleanText(searchParams.get("status"));
    const category = cleanText(
      searchParams.get("earning_category")
    );
    const calculationMethod = cleanText(
      searchParams.get("calculation_method")
    );
    const all = searchParams.get("all") === "true";

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(searchParams.get("pageSize")) ||
          DEFAULT_PAGE_SIZE,
        1
      ),
      MAX_PAGE_SIZE
    );

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return jsonError("สถานะไม่ถูกต้อง", 400);
    }

    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return jsonError("หมวดเงินได้ไม่ถูกต้อง", 400);
    }

    if (
      calculationMethod &&
      !ALLOWED_CALCULATION_METHODS.includes(calculationMethod)
    ) {
      return jsonError("วิธีคำนวณไม่ถูกต้อง", 400);
    }

    if (companyId && !guard.canAccessId(companyId)) {
      return jsonError(
        "คุณไม่มีสิทธิ์เข้าถึงประเภทเงินได้ของบริษัทนี้",
        403
      );
    }

    let query = supabaseAdmin
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
        `,
        {
          count: all ? undefined : "exact",
        }
      );

    const filters = {
      guard,
      search,
      companyId,
      status,
      category,
      calculationMethod,
    };

    query = applyListFilters(query, filters);

    query = query
      .order("sort_order", { ascending: true })
      .order("earning_code", { ascending: true });

    if (all) {
      query = query.limit(ALL_LIMIT);
    } else {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const summary = await loadSummary(filters);

    const total = all ? data?.length || 0 : count || 0;
    const totalPages = all
      ? 1
      : Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: data || [],
      summary,
      pagination: {
        page: all ? 1 : page,
        pageSize: all ? total : pageSize,
        total,
        totalPages,
      },
      meta: {
        scope_type: "company",
        has_all_scope: guard.hasAllScope,
        accessible_company_ids: guard.hasAllScope
          ? []
          : guard.accessibleIds,
      },
    });
  } catch (error) {
    console.error("GET_EARNING_TYPES_ERROR:", error);

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

export async function POST(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.earning_types",
      "create",
      { scopeType: "company" }
    );

    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError("Request Body ไม่ถูกต้อง", 400);
    }

    const payload = normalizePayload(body);
    const validationError = validatePayload(payload);

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const scopeError = guard.assertAccessId(
      payload.company_id,
      "คุณไม่มีสิทธิ์เพิ่มประเภทเงินได้ในบริษัทนี้"
    );

    if (scopeError) return scopeError;

    const actorId = getActorId(guard);

    const { data, error } = await supabaseAdmin
      .from(TABLE_NAME)
      .insert({
        ...payload,
        created_by: actorId,
        updated_by: actorId,
      })
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
        actionType: "CREATE",
        referenceTable: TABLE_NAME,
        referenceId: data.id,
        description: `เพิ่มประเภทเงินได้ ${data.earning_code} - ${data.earning_name}`,
        oldData: null,
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
      message: "เพิ่มประเภทเงินได้เรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("POST_EARNING_TYPE_ERROR:", error);

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
