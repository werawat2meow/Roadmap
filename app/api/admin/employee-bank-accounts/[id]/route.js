import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const ALLOWED_STATUSES = ["active", "inactive"];

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

function normalizeAccountNo(
  value
) {
  return String(
    value || ""
  )
    .replace(/\D/g, "")
    .trim();
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

async function getById(id) {
  return supabaseAdmin
    .from("employee_bank_accounts")
    .select(SELECT_FIELDS)
    .eq("id", id)
    .maybeSingle();
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

async function clearPrimaryAccount(employeeId, excludeId, actorId) {
  let query = supabaseAdmin
    .from("employee_bank_accounts")
    .update({
      is_primary: false,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq("employee_id", employeeId)
    .eq("is_primary", true);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function GET(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.employee_bank_accounts",
      "view"
    );

    if (!guard.ok) return guard.response;

    const { id } = await params;

    const { data, error } = await getById(id);
    if (error) throw error;

    if (!data) return jsonError("ไม่พบบัญชีธนาคารพนักงาน", 404);

    if (!data.employees || !guard.canAccessEmployee(data.employees)) {
      return jsonError(
        "คุณไม่มีสิทธิ์ดูบัญชีธนาคารของพนักงานรายนี้",
        403
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET_EMPLOYEE_BANK_ACCOUNT_ERROR:", error);

    return jsonError(
      "ไม่สามารถโหลดบัญชีธนาคารพนักงานได้",
      getErrorStatus(error),
      mapDatabaseError(error)
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.employee_bank_accounts",
      "edit"
    );

    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data: current, error: currentError } = await getById(id);

    if (currentError) throw currentError;
    if (!current) return jsonError("ไม่พบบัญชีธนาคารพนักงาน", 404);

    if (!current.employees || !guard.canAccessEmployee(current.employees)) {
      return jsonError(
        "คุณไม่มีสิทธิ์แก้ไขบัญชีธนาคารของพนักงานรายนี้",
        403
      );
    }

    const body = await req.json();

    const payload = {
      employee_id:
        body.employee_id !== undefined
          ? cleanNullableText(body.employee_id)
          : current.employee_id,
      bank_id:
        body.bank_id !== undefined
          ? cleanNullableText(body.bank_id)
          : current.bank_id,
      payment_method_id:
        body.payment_method_id !== undefined
          ? cleanNullableText(body.payment_method_id)
          : current.payment_method_id,
      account_no:
        body.account_no !== undefined
          ? normalizeAccountNo(
              body.account_no
            )
          : normalizeAccountNo(
              current.account_no
            ),
      account_name:
        body.account_name !== undefined
          ? cleanText(body.account_name)
          : current.account_name,
      branch_name:
        body.branch_name !== undefined
          ? cleanNullableText(body.branch_name)
          : current.branch_name,
      is_primary:
        body.is_primary !== undefined
          ? cleanBoolean(body.is_primary, false)
          : Boolean(current.is_primary),
      effective_date:
        body.effective_date !== undefined
          ? cleanNullableText(body.effective_date)
          : current.effective_date,
      expire_date:
        body.expire_date !== undefined
          ? cleanNullableText(body.expire_date)
          : current.expire_date,
      status:
        body.status !== undefined &&
        ALLOWED_STATUSES.includes(cleanText(body.status))
          ? cleanText(body.status)
          : current.status,
      remark:
        body.remark !== undefined
          ? cleanNullableText(body.remark)
          : current.remark,
    };

    if (!payload.employee_id) return jsonError("กรุณาเลือกพนักงาน", 400);
    if (!payload.bank_id) return jsonError("กรุณาเลือกธนาคาร", 400);
    if (!payload.account_no) {
        return jsonError(
          "กรุณากรอกเลขที่บัญชี",
          400
        );
      }

    if (!/^\d{10}$/.test(payload.account_no)) {
      return jsonError(
        "เลขบัญชีธนาคารต้องเป็นตัวเลข 10 หลัก",
        400
      );
    }
    if (!payload.account_name) return jsonError("กรุณากรอกชื่อบัญชี", 400);

    if (
      payload.expire_date &&
      payload.effective_date &&
      payload.expire_date < payload.effective_date
    ) {
      return jsonError(
        "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มใช้งาน",
        400
      );
    }

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

    const targetEmployee = employeeResult.data;

    if (!targetEmployee) return jsonError("ไม่พบพนักงานที่เลือก", 404);
    if (!bankResult.data) return jsonError("ไม่พบธนาคารที่เลือก", 400);
    if (payload.payment_method_id && !paymentMethodResult.data) {
      return jsonError("ไม่พบวิธีการจ่ายเงินที่เลือก", 400);
    }

    if (!guard.canAccessEmployee(targetEmployee)) {
      return jsonError(
        "คุณไม่มีสิทธิ์ย้ายบัญชีธนาคารไปยังพนักงานรายนี้",
        403
      );
    }

    const actorId = guard?.access?.id || null;

    if (payload.status === "inactive") {
      payload.is_primary = false;
    }

    if (payload.is_primary && payload.status === "active") {
      await clearPrimaryAccount(payload.employee_id, id, actorId);
    }

    const { data, error } = await supabaseAdmin
      .from("employee_bank_accounts")
      .update({
        ...payload,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    try {
      await writeActivityLog({
        module_name: "employee_bank_accounts",
        action_type: "update",
        reference_table: "employee_bank_accounts",
        reference_id: id,
        description: `แก้ไขบัญชีธนาคารพนักงาน ${
          targetEmployee.employee_code || ""
        } ${getEmployeeName(targetEmployee)}`.trim(),
        old_data: {
          employee_id: current.employee_id,
          bank_id: current.bank_id,
          account_no: maskAccountNo(current.account_no),
          account_name: current.account_name,
          is_primary: current.is_primary,
          status: current.status,
        },
        new_data: {
          employee_id: payload.employee_id,
          bank_id: payload.bank_id,
          account_no: maskAccountNo(payload.account_no),
          account_name: payload.account_name,
          is_primary: payload.is_primary,
          status: payload.status,
        },
      });
    } catch (logError) {
      console.error("UPDATE_EMPLOYEE_BANK_ACCOUNT_LOG_ERROR:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขบัญชีธนาคารพนักงานเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_BANK_ACCOUNT_ERROR:", error);

    return jsonError(mapDatabaseError(error), getErrorStatus(error));
  }
}

export async function DELETE(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "ems.employee_bank_accounts",
      "delete"
    );

    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data: current, error: currentError } = await getById(id);

    if (currentError) throw currentError;
    if (!current) return jsonError("ไม่พบบัญชีธนาคารพนักงาน", 404);

    if (!current.employees || !guard.canAccessEmployee(current.employees)) {
      return jsonError(
        "คุณไม่มีสิทธิ์ลบบัญชีธนาคารของพนักงานรายนี้",
        403
      );
    }

    const { error } = await supabaseAdmin
      .from("employee_bank_accounts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    try {
      await writeActivityLog({
        module_name: "employee_bank_accounts",
        action_type: "delete",
        reference_table: "employee_bank_accounts",
        reference_id: id,
        description: `ลบบัญชีธนาคารพนักงาน ${
          current.employees?.employee_code || ""
        } ${getEmployeeName(current.employees)}`.trim(),
        old_data: {
          employee_id: current.employee_id,
          bank_id: current.bank_id,
          account_no: maskAccountNo(current.account_no),
          account_name: current.account_name,
          is_primary: current.is_primary,
          status: current.status,
        },
      });
    } catch (logError) {
      console.error("DELETE_EMPLOYEE_BANK_ACCOUNT_LOG_ERROR:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "ลบบัญชีธนาคารพนักงานเรียบร้อยแล้ว",
      data: { id },
    });
  } catch (error) {
    console.error("DELETE_EMPLOYEE_BANK_ACCOUNT_ERROR:", error);

    return jsonError(mapDatabaseError(error), getErrorStatus(error));
  }
}
