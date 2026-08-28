import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   Constants
========================================================= */

const TABLE_NAME = "payroll_formulas";

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

const ALLOWED_FORMULA_TYPES = [
  "earning",
  "deduction",
  "general",
];

const ALLOWED_ROUNDING_METHODS = [
  "none",
  "round",
  "floor",
  "ceil",
];

const ALLOWED_FUNCTIONS = new Set([
  "IF",
  "MIN",
  "MAX",
  "ROUND",
  "FLOOR",
  "CEIL",
  "ABS",
]);

const RESERVED_WORDS = new Set([
  "TRUE",
  "FALSE",
  ...ALLOWED_FUNCTIONS,
]);

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALL_LIMIT = 500;

/* =========================================================
   Helpers
========================================================= */

function cleanText(value) {
  return String(value || "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanCode(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanBoolean(value, fallback = false) {
  if (value === true || value === false) {
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

function cleanInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isInteger(parsed)) {
    return fallback;
  }

  return parsed;
}

function cleanNullableNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function cleanDate(value) {
  const text = cleanText(value);
  return text || null;
}

function sanitizeSearch(value) {
  return cleanText(value)
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("%", "")
    .replaceAll("*", "")
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

function jsonError(message, status = 500, extra = {}) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    {
      status,
    }
  );
}

function getErrorStatus(error) {
  if (!error) {
    return 500;
  }

  if (error.code === "23505") {
    return 409;
  }

  if (
    [
      "23503",
      "23514",
      "23502",
      "22P02",
    ].includes(error.code)
  ) {
    return 400;
  }

  return 500;
}

function mapDatabaseError(error) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

  if (error.code === "23505") {
    return "รหัสสูตรนี้มีอยู่แล้วในบริษัท";
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

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

function normalizePayload(body = {}) {
  return {
    company_id:
      cleanNullableText(body.company_id),

    formula_code:
      cleanCode(body.formula_code),

    formula_name:
      cleanText(body.formula_name),

    description:
      cleanNullableText(body.description),

    formula_type:
      cleanText(body.formula_type) ||
      "general",

    formula_expression:
      cleanText(body.formula_expression),

    calculation_order:
      Math.max(
        0,
        cleanInteger(
          body.calculation_order,
          0
        )
      ),

    rounding_method:
      cleanText(body.rounding_method) ||
      "round",

    decimal_places:
      Math.min(
        6,
        Math.max(
          0,
          cleanInteger(
            body.decimal_places,
            2
          )
        )
      ),

    minimum_amount:
      cleanNullableNumber(
        body.minimum_amount
      ),

    maximum_amount:
      cleanNullableNumber(
        body.maximum_amount
      ),

    effective_date:
      cleanDate(body.effective_date) ||
      new Date()
        .toISOString()
        .slice(0, 10),

    expire_date:
      cleanDate(body.expire_date),

    /*
     * System Formula ต้องสร้างจาก seed/admin process เท่านั้น
     * ไม่รับค่า is_system=true จาก Client
     */
    is_system: false,

    status:
      cleanText(body.status) ||
      "active",

    sort_order:
      Math.max(
        0,
        cleanInteger(
          body.sort_order,
          0
        )
      ),

    remark:
      cleanNullableText(body.remark),
  };
}

function validateExpressionSyntax(expression) {
  if (!expression) {
    return "กรุณาระบุสูตรคำนวณ";
  }

  if (expression.length > 4000) {
    return "สูตรคำนวณยาวเกิน 4,000 ตัวอักษร";
  }

  /*
   * อนุญาตเฉพาะตัวอักษร/ตัวเลข/underscore,
   * operators, จุดทศนิยม, comma และวงเล็บ
   *
   * ไม่อนุญาต quote, semicolon, braces, brackets, backtick
   * เพื่อไม่ให้ expression ถูกใช้เป็น code โดยตรง
   */
  if (
    !/^[A-Za-z0-9_+\-*/%().,\s<>=!&|]+$/.test(
      expression
    )
  ) {
    return "สูตรมีอักขระที่ไม่อนุญาต";
  }

  let balance = 0;

  for (const char of expression) {
    if (char === "(") {
      balance += 1;
    }

    if (char === ")") {
      balance -= 1;

      if (balance < 0) {
        return "วงเล็บในสูตรไม่ถูกต้อง";
      }
    }
  }

  if (balance !== 0) {
    return "วงเล็บในสูตรไม่ครบ";
  }

  return null;
}

function extractVariableCodes(expression) {
  const tokens =
    String(expression || "")
      .toUpperCase()
      .match(/\b[A-Z][A-Z0-9_]*\b/g) ||
    [];

  return [
    ...new Set(
      tokens.filter(
        (token) =>
          !RESERVED_WORDS.has(token)
      )
    ),
  ];
}

async function validateFormulaVariables({
  companyId,
  expression,
}) {
  const variableCodes =
    extractVariableCodes(expression);

  if (!variableCodes.length) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("formula_variables")
      .select("variable_code,status")
      .eq("company_id", companyId)
      .in(
        "variable_code",
        variableCodes
      );

  if (error) {
    throw error;
  }

  const found =
    new Set(
      (data || [])
        .filter(
          (item) =>
            item.status === "active"
        )
        .map(
          (item) =>
            String(
              item.variable_code
            ).toUpperCase()
        )
    );

  const missing =
    variableCodes.filter(
      (code) =>
        !found.has(code)
    );

  if (missing.length) {
    return `ไม่พบตัวแปรที่ใช้งานได้ในบริษัทนี้: ${missing.join(", ")}`;
  }

  return null;
}

function validatePayload(payload) {
  if (!payload.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (!payload.formula_code) {
    return "กรุณากรอกรหัสสูตร";
  }

  if (
    !/^[A-Z][A-Z0-9_]*$/.test(
      payload.formula_code
    )
  ) {
    return "รหัสสูตรต้องขึ้นต้นด้วย A-Z และใช้ได้เฉพาะ A-Z, 0-9, _";
  }

  if (!payload.formula_name) {
    return "กรุณากรอกชื่อสูตร";
  }

  if (
    !ALLOWED_FORMULA_TYPES.includes(
      payload.formula_type
    )
  ) {
    return "ประเภทสูตรไม่ถูกต้อง";
  }

  const expressionError =
    validateExpressionSyntax(
      payload.formula_expression
    );

  if (expressionError) {
    return expressionError;
  }

  if (
    !ALLOWED_ROUNDING_METHODS.includes(
      payload.rounding_method
    )
  ) {
    return "วิธีปัดเศษไม่ถูกต้อง";
  }

  if (
    payload.decimal_places < 0 ||
    payload.decimal_places > 6
  ) {
    return "จำนวนตำแหน่งทศนิยมต้องอยู่ระหว่าง 0 - 6";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  if (
    payload.expire_date &&
    payload.effective_date &&
    payload.expire_date <
      payload.effective_date
  ) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้";
  }

  if (
    payload.minimum_amount !== null &&
    payload.maximum_amount !== null &&
    payload.maximum_amount <
      payload.minimum_amount
  ) {
    return "จำนวนสูงสุดต้องไม่น้อยกว่าจำนวนต่ำสุด";
  }

  return null;
}

function applyListFilters(
  query,
  {
    guard,
    search,
    companyId,
    formulaType,
    status,
  }
) {
  query =
    guard.applyScope(
      query,
      "company_id"
    );

  if (search) {
    query =
      query.or(
        [
          `formula_code.ilike.%${search}%`,
          `formula_name.ilike.%${search}%`,
          `formula_expression.ilike.%${search}%`,
          `description.ilike.%${search}%`,
          `remark.ilike.%${search}%`,
        ].join(",")
      );
  }

  if (companyId) {
    query =
      query.eq(
        "company_id",
        companyId
      );
  }

  if (formulaType) {
    query =
      query.eq(
        "formula_type",
        formulaType
      );
  }

  if (status) {
    query =
      query.eq(
        "status",
        status
      );
  }

  return query;
}

async function loadSummary(filters) {
  let query =
    supabaseAdmin
      .from(TABLE_NAME)
      .select(
        "id,status,formula_type"
      );

  query =
    applyListFilters(
      query,
      filters
    );

  const {
    data,
    error,
  } =
    await query.limit(5000);

  if (error) {
    throw error;
  }

  const rows =
    Array.isArray(data)
      ? data
      : [];

  return {
    total:
      rows.length,

    active:
      rows.filter(
        (item) =>
          item.status === "active"
      ).length,

    earning:
      rows.filter(
        (item) =>
          item.formula_type ===
          "earning"
      ).length,

    deduction:
      rows.filter(
        (item) =>
          item.formula_type ===
          "deduction"
      ).length,
  };
}

/* =========================================================
   GET
========================================================= */

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_formulas",
        "view",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(req.url);

    const search =
      sanitizeSearch(
        searchParams.get("search")
      );

    const companyId =
      cleanText(
        searchParams.get(
          "company_id"
        )
      );

    const formulaType =
      cleanText(
        searchParams.get(
          "formula_type"
        )
      );

    const status =
      cleanText(
        searchParams.get("status")
      );

    const all =
      searchParams.get("all") ===
      "true";

    const page =
      Math.max(
        Number(
          searchParams.get("page")
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
          ) ||
            DEFAULT_PAGE_SIZE,
          1
        ),
        MAX_PAGE_SIZE
      );

    if (
      formulaType &&
      !ALLOWED_FORMULA_TYPES.includes(
        formulaType
      )
    ) {
      return jsonError(
        "ประเภทสูตรไม่ถูกต้อง",
        400
      );
    }

    if (
      status &&
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return jsonError(
        "สถานะไม่ถูกต้อง",
        400
      );
    }

    if (
      companyId &&
      !guard.canAccessId(
        companyId
      )
    ) {
      return jsonError(
        "คุณไม่มีสิทธิ์เข้าถึงสูตรของบริษัทนี้",
        403
      );
    }

    let query =
      supabaseAdmin
        .from(TABLE_NAME)
        .select(
          `
            id,
            company_id,
            formula_code,
            formula_name,
            description,
            formula_type,
            formula_expression,
            calculation_order,
            rounding_method,
            decimal_places,
            minimum_amount,
            maximum_amount,
            effective_date,
            expire_date,
            is_system,
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
            count:
              all
                ? undefined
                : "exact",
          }
        );

    const filters = {
      guard,
      search,
      companyId,
      formulaType,
      status,
    };

    query =
      applyListFilters(
        query,
        filters
      );

    query =
      query
        .order(
          "calculation_order",
          {
            ascending: true,
          }
        )
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "formula_code",
          {
            ascending: true,
          }
        );

    if (all) {
      query =
        query.limit(
          ALL_LIMIT
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

    const {
      data,
      error,
      count,
    } =
      await query;

    if (error) {
      throw error;
    }

    const summary =
      await loadSummary(
        filters
      );

    const total =
      all
        ? data?.length || 0
        : count || 0;

    return NextResponse.json({
      success: true,

      data: data || [],

      summary,

      pagination: {
        page:
          all
            ? 1
            : page,

        pageSize:
          all
            ? total
            : pageSize,

        total,

        totalPages:
          all
            ? 1
            : Math.ceil(
                total /
                  pageSize
              ),
      },

      meta: {
        scope_type:
          "company",

        has_all_scope:
          guard.hasAllScope,

        accessible_company_ids:
          guard.hasAllScope
            ? []
            : guard.accessibleIds,
      },
    });
  } catch (error) {
    console.error(
      "GET_PAYROLL_FORMULAS_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

/* =========================================================
   POST
========================================================= */

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_formulas",
        "create",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const body =
      await req
        .json()
        .catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError(
        "Request Body ไม่ถูกต้อง",
        400
      );
    }

    const payload =
      normalizePayload(body);

    const validationError =
      validatePayload(payload);

    if (validationError) {
      return jsonError(
        validationError,
        400
      );
    }

    const scopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์เพิ่มสูตรในบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    const variableError =
      await validateFormulaVariables({
        companyId:
          payload.company_id,

        expression:
          payload.formula_expression,
      });

    if (variableError) {
      return jsonError(
        variableError,
        400
      );
    }

    const actorId =
      getActorId(guard);

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(TABLE_NAME)
        .insert({
          ...payload,

          created_by:
            actorId,

          updated_by:
            actorId,
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

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "payroll_formulas",

        actionType:
          "CREATE",

        referenceTable:
          TABLE_NAME,

        referenceId:
          data.id,

        description:
          `เพิ่มสูตรคำนวณเงินเดือน ${data.formula_code} - ${data.formula_name}`,

        oldData: null,

        newData: data,
      });
    } catch (logError) {
      console.error(
        "PAYROLL_FORMULA_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "เพิ่มสูตรการคำนวณเงินเดือนเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "POST_PAYROLL_FORMULA_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
