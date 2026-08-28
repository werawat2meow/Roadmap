import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

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

function cleanInteger(value, fallback = 0) {
  const parsed =
    Number.parseInt(
      String(value ?? ""),
      10
    );

  return Number.isInteger(parsed)
    ? parsed
    : fallback;
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

function validateExpressionSyntax(expression) {
  if (!expression) {
    return "กรุณาระบุสูตรคำนวณ";
  }

  if (expression.length > 4000) {
    return "สูตรคำนวณยาวเกิน 4,000 ตัวอักษร";
  }

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

function normalizePayload(body, current) {
  return {
    company_id:
      body.company_id !== undefined
        ? cleanNullableText(
            body.company_id
          )
        : current.company_id,

    formula_code:
      body.formula_code !== undefined
        ? cleanCode(
            body.formula_code
          )
        : current.formula_code,

    formula_name:
      body.formula_name !== undefined
        ? cleanText(
            body.formula_name
          )
        : current.formula_name,

    description:
      body.description !== undefined
        ? cleanNullableText(
            body.description
          )
        : current.description,

    formula_type:
      body.formula_type !== undefined
        ? cleanText(
            body.formula_type
          )
        : current.formula_type,

    formula_expression:
      body.formula_expression !== undefined
        ? cleanText(
            body.formula_expression
          )
        : current.formula_expression,

    calculation_order:
      body.calculation_order !== undefined
        ? Math.max(
            0,
            cleanInteger(
              body.calculation_order,
              0
            )
          )
        : current.calculation_order,

    rounding_method:
      body.rounding_method !== undefined
        ? cleanText(
            body.rounding_method
          )
        : current.rounding_method,

    decimal_places:
      body.decimal_places !== undefined
        ? Math.min(
            6,
            Math.max(
              0,
              cleanInteger(
                body.decimal_places,
                2
              )
            )
          )
        : current.decimal_places,

    minimum_amount:
      body.minimum_amount !== undefined
        ? cleanNullableNumber(
            body.minimum_amount
          )
        : current.minimum_amount,

    maximum_amount:
      body.maximum_amount !== undefined
        ? cleanNullableNumber(
            body.maximum_amount
          )
        : current.maximum_amount,

    effective_date:
      body.effective_date !== undefined
        ? cleanDate(
            body.effective_date
          )
        : current.effective_date,

    expire_date:
      body.expire_date !== undefined
        ? cleanDate(
            body.expire_date
          )
        : current.expire_date,

    is_system:
      current.is_system === true,

    status:
      body.status !== undefined
        ? cleanText(
            body.status
          )
        : current.status,

    sort_order:
      body.sort_order !== undefined
        ? Math.max(
            0,
            cleanInteger(
              body.sort_order,
              0
            )
          )
        : current.sort_order,

    remark:
      body.remark !== undefined
        ? cleanNullableText(
            body.remark
          )
        : current.remark,
  };
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

async function loadRecord(id) {
  return supabaseAdmin
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
      `
    )
    .eq("id", id)
    .maybeSingle();
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  req,
  {
    params,
  }
) {
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
      id,
    } =
      await params;

    const {
      data,
      error,
    } =
      await loadRecord(id);

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError(
        "ไม่พบสูตรการคำนวณเงินเดือน",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        data.company_id,
        "คุณไม่มีสิทธิ์ดูสูตรของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "GET_PAYROLL_FORMULA_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_formulas",
        "edit",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      id,
    } =
      await params;

    const currentResult =
      await loadRecord(id);

    if (currentResult.error) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบสูตรการคำนวณเงินเดือน",
        404
      );
    }

    const currentScopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์แก้ไขสูตรของบริษัทนี้"
      );

    if (currentScopeError) {
      return currentScopeError;
    }

    if (current.is_system === true) {
      return jsonError(
        "สูตรระบบไม่อนุญาตให้แก้ไขจากหน้าจอนี้",
        400
      );
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
      normalizePayload(
        body,
        current
      );

    const validationError =
      validatePayload(payload);

    if (validationError) {
      return jsonError(
        validationError,
        400
      );
    }

    const targetScopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์ย้ายสูตรไปยังบริษัทนี้"
      );

    if (targetScopeError) {
      return targetScopeError;
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
        .update({
          ...payload,

          updated_by:
            actorId,

          updated_at:
            new Date()
              .toISOString(),
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

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "payroll_formulas",

        actionType:
          "UPDATE",

        referenceTable:
          TABLE_NAME,

        referenceId:
          id,

        description:
          `แก้ไขสูตรคำนวณเงินเดือน ${data.formula_code} - ${data.formula_name}`,

        oldData:
          current,

        newData:
          data,
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
        "แก้ไขสูตรการคำนวณเงินเดือนเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH_PAYROLL_FORMULA_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(
  req,
  {
    params,
  }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_formulas",
        "delete",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      id,
    } =
      await params;

    const currentResult =
      await loadRecord(id);

    if (currentResult.error) {
      throw currentResult.error;
    }

    const current =
      currentResult.data;

    if (!current) {
      return jsonError(
        "ไม่พบสูตรการคำนวณเงินเดือน",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        current.company_id,
        "คุณไม่มีสิทธิ์ลบสูตรของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    if (current.is_system === true) {
      return jsonError(
        "สูตรระบบไม่สามารถลบได้",
        400
      );
    }

    const {
      error,
    } =
      await supabaseAdmin
        .from(TABLE_NAME)
        .delete()
        .eq("id", id);

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "payroll_formulas",

        actionType:
          "DELETE",

        referenceTable:
          TABLE_NAME,

        referenceId:
          id,

        description:
          `ลบสูตรคำนวณเงินเดือน ${current.formula_code} - ${current.formula_name}`,

        oldData:
          current,

        newData:
          null,
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
        "ลบสูตรการคำนวณเงินเดือนเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE_PAYROLL_FORMULA_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
