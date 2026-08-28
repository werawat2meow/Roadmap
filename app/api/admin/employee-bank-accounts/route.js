import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const ALLOWED_STATUSES = ["active", "inactive"];
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const SCOPE_BATCH_SIZE = 1000;

const SELECT_FIELDS = `
  id,
  employee_id,
  bank_id,
  payment_method_id,
  account_no,
  account_name,
  branch_name,
  is_primary,
  effective_date,
  expire_date,
  status,
  remark,
  created_by,
  updated_by,
  created_at,
  updated_at,
  employees:employee_id (
    id,
    employee_code,
    first_name_th,
    middle_name_th,
    last_name_th,
    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,
    status
  ),
  banks:bank_id (*),
  payment_methods:payment_method_id (*)
`;

function jsonError(error, status = 500, detail = null) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(detail ? { detail } : {}),
    },
    { status }
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === true || value === "true" || value === "1" || value === 1) {
    return true;
  }
  if (value === false || value === "false" || value === "0" || value === 0) {
    return false;
  }
  return fallback;
}

function maskAccountNo(value) {
  const text = cleanText(value);
  if (!text) return "";
  if (text.length <= 4) return "*".repeat(text.length);
  return `${"*".repeat(Math.max(text.length - 4, 4))}${text.slice(-4)}`;
}

function getEmployeeName(employee) {
  return [
    employee?.first_name_th,
    employee?.middle_name_th,
    employee?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function normalizePayload(body = {}) {
  const status = cleanText(body.status) || "active";

  return {
    employee_id: cleanNullableText(body.employee_id),
    bank_id: cleanNullableText(body.bank_id),
    payment_method_id: cleanNullableText(body.payment_method_id),
    account_no: normalizeAccountNo(body.account_no),
    account_name: cleanText(body.account_name),
    branch_name: cleanNullableText(body.branch_name),
    is_primary: cleanBoolean(body.is_primary, false),
    effective_date:
      cleanNullableText(body.effective_date) ||
      new Date().toISOString().slice(0, 10),
    expire_date: cleanNullableText(body.expire_date),
    status: ALLOWED_STATUSES.includes(status) ? status : "active",
    remark: cleanNullableText(body.remark),
  };
}

function validatePayload(payload) {
  if (!payload.employee_id) {
    return "กรุณาเลือกพนักงาน";
  }

  if (!payload.bank_id) {
    return "กรุณาเลือกธนาคาร";
  }

  if (!payload.account_no) {
    return "กรุณากรอกเลขที่บัญชี";
  }

  if (!/^\d{10}$/.test(payload.account_no)) {
    return "เลขบัญชีธนาคารต้องเป็นตัวเลข 10 หลัก";
  }

  if (!payload.account_name) {
    return "กรุณากรอกชื่อบัญชี";
  }

  if (payload.expire_date && payload.effective_date && payload.expire_date <payload.effective_date) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้งาน";
  }

  return null;
}

function getErrorStatus(error) {
  if (error?.code === "23505") return 409;
  if (["23503", "23514", "23502", "22P02"].includes(error?.code)) {
    return 400;
  }
  return 500;
}

function mapDatabaseError(error) {
  if (!error) return "เกิดข้อผิดพลาดในฐานข้อมูล";

  if (error.code === "23505") {
    const message = String(error.message || "");

    if (message.includes("uq_employee_bank_accounts_primary_active")) {
      return "พนักงานมีบัญชีหลักที่กำลังใช้งานอยู่แล้ว";
    }

    if (message.includes("uq_employee_bank_accounts_bank_account")) {
      return "เลขบัญชีนี้มีอยู่ในธนาคารแล้ว";
    }

    return "ข้อมูลบัญชีธนาคารซ้ำในระบบ";
  }

  if (error.code === "23503") {
    return "ไม่พบพนักงาน ธนาคาร หรือวิธีการจ่ายเงินที่อ้างอิง";
  }

  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  if (error.code === "23502") {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  if (error.code === "22P02") {
    return "รูปแบบ UUID ไม่ถูกต้อง";
  }

  return error.message || "เกิดข้อผิดพลาดในฐานข้อมูล";
}

async function getEmployeeById(employeeId) {
  return supabaseAdmin
    .from("employees")
    .select(`
      id,
      employee_code,
      first_name_th,
      middle_name_th,
      last_name_th,
      company_id,
      branch_group_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      status
    `)
    .eq("id", employeeId)
    .maybeSingle();
}

async function getScopedEmployeeIds(guard) {
  if (guard?.hasAllScope) return null;

  const ids = [];
  let batch = 0;

  while (true) {
    const from = batch * SCOPE_BATCH_SIZE;
    const to = from + SCOPE_BATCH_SIZE - 1;

    let query = supabaseAdmin
      .from("employees")
      .select(`
        id,
        company_id,
        branch_group_id,
        branch_id,
        department_id,
        division_id,
        unit_id
      `)
      .order("id", { ascending: true })
      .range(from, to);

    query = guard.applyEmployeeScope(query);

    const { data, error } = await query;
    if (error) throw error;

    const rows = data || [];
    ids.push(...rows.map((item) => item.id));

    if (rows.length < SCOPE_BATCH_SIZE) break;
    batch += 1;
  }

  return [...new Set(ids)];
}

function applyScopedEmployeeIds(query, ids) {
  if (ids === null) return query;

  if (!ids.length) {
    return query.eq(
      "employee_id",
      "00000000-0000-0000-0000-000000000000"
    );
  }

  return query.in("employee_id", ids);
}

async function clearPrimaryAccount(employeeId, actorId) {
  const { error } = await supabaseAdmin
    .from("employee_bank_accounts")
    .update({
      is_primary: false,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq("employee_id", employeeId)
    .eq("is_primary", true);

  if (error) throw error;
}


function normalizeAccountNo(
  value
) {
  return String(
    value || ""
  )
    .replace(/\D/g, "")
    .trim();
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.employee_bank_accounts",
      "view"
    );

    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );

    const all = searchParams.get("all") === "true";
    const search = cleanText(searchParams.get("search"));
    const employeeId = cleanText(searchParams.get("employee_id"));
    const bankId = cleanText(searchParams.get("bank_id"));
    const paymentMethodId = cleanText(
      searchParams.get("payment_method_id")
    );
    const status = cleanText(searchParams.get("status"));
    const isPrimary = searchParams.get("is_primary");

    if (employeeId) {
      const { data: employee, error } = await getEmployeeById(employeeId);
      if (error) throw error;
      if (!employee) return jsonError("ไม่พบพนักงาน", 404);

      if (!guard.canAccessEmployee(employee)) {
        return jsonError(
          "คุณไม่มีสิทธิ์ดูบัญชีธนาคารของพนักงานรายนี้",
          403
        );
      }
    }

    const scopedEmployeeIds = await getScopedEmployeeIds(guard);

    if (Array.isArray(scopedEmployeeIds) && !scopedEmployeeIds.length) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
      });
    }

    let query = supabaseAdmin
      .from("employee_bank_accounts")
      .select(SELECT_FIELDS, {
        count: all ? undefined : "exact",
      });

    query = applyScopedEmployeeIds(query, scopedEmployeeIds);

    if (employeeId) query = query.eq("employee_id", employeeId);
    if (bankId) query = query.eq("bank_id", bankId);
    if (paymentMethodId) {
      query = query.eq("payment_method_id", paymentMethodId);
    }
    if (status && ALLOWED_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }
    if (isPrimary === "true") query = query.eq("is_primary", true);
    if (isPrimary === "false") query = query.eq("is_primary", false);

    if (search) {
      query = query.or(
        [
          `account_no.ilike.%${search}%`,
          `account_name.ilike.%${search}%`,
          `branch_name.ilike.%${search}%`,
          `remark.ilike.%${search}%`,
        ].join(",")
      );
    }

    query = query
      .order("is_primary", { ascending: false })
      .order("status", { ascending: true })
      .order("created_at", { ascending: false });

    if (all) {
      query = query.limit(1000);
    } else {
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    if (all) {
      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    const total = Number(count || 0);

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
    });
  } catch (error) {
    console.error("GET_EMPLOYEE_BANK_ACCOUNTS_ERROR:", error);

    return jsonError(
      "ไม่สามารถโหลดบัญชีธนาคารพนักงานได้",
      getErrorStatus(error),
      mapDatabaseError(error)
    );
  }
}

export async function POST(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.employee_bank_accounts",
      "create"
    );

    if (!guard.ok) return guard.response;

    const payload = normalizePayload(await req.json());
    const validationError = validatePayload(payload);

    if (validationError) return jsonError(validationError, 400);

    const [employeeResult, bankResult, paymentMethodResult] =
      await Promise.all([
        getEmployeeById(payload.employee_id),
        supabaseAdmin
          .from("banks")
          .select("id")
          .eq("id", payload.bank_id)
          .maybeSingle(),
        payload.payment_method_id
          ? supabaseAdmin
              .from("payment_methods")
              .select("id")
              .eq("id", payload.payment_method_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

    if (employeeResult.error) throw employeeResult.error;
    if (bankResult.error) throw bankResult.error;
    if (paymentMethodResult.error) throw paymentMethodResult.error;

    const employee = employeeResult.data;

    if (!employee) return jsonError("ไม่พบพนักงานที่เลือก", 404);
    if (!bankResult.data) return jsonError("ไม่พบธนาคารที่เลือก", 400);
    if (payload.payment_method_id && !paymentMethodResult.data) {
      return jsonError("ไม่พบวิธีการจ่ายเงินที่เลือก", 400);
    }

    if (!guard.canAccessEmployee(employee)) {
      return jsonError(
        "คุณไม่มีสิทธิ์เพิ่มบัญชีธนาคารให้พนักงานรายนี้",
        403
      );
    }

    const actorId = guard?.access?.id || null;

    if (payload.status === "inactive") {
      payload.is_primary = false;
    }

    if (payload.is_primary && payload.status === "active") {
      await clearPrimaryAccount(payload.employee_id, actorId);
    }

    const { data, error } = await supabaseAdmin
      .from("employee_bank_accounts")
      .insert({
        ...payload,
        created_by: actorId,
        updated_by: actorId,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    try {
      await writeActivityLog({
        module_name: "employee_bank_accounts",
        action_type: "create",
        reference_table: "employee_bank_accounts",
        reference_id: data.id,
        description: `เพิ่มบัญชีธนาคารพนักงาน ${
          employee.employee_code || ""
        } ${getEmployeeName(employee)}`.trim(),
        new_data: {
          employee_id: payload.employee_id,
          bank_id: payload.bank_id,
          payment_method_id: payload.payment_method_id,
          account_no: maskAccountNo(payload.account_no),
          account_name: payload.account_name,
          is_primary: payload.is_primary,
          status: payload.status,
        },
      });
    } catch (logError) {
      console.error("CREATE_EMPLOYEE_BANK_ACCOUNT_LOG_ERROR:", logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มบัญชีธนาคารพนักงานเรียบร้อยแล้ว",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_EMPLOYEE_BANK_ACCOUNT_ERROR:", error);

    return jsonError(mapDatabaseError(error), getErrorStatus(error));
  }
}
