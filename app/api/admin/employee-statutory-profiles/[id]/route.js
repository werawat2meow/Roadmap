import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const MODULE = "ems.employee_statutory_profiles";
const TABLE = "employee_statutory_profiles";

const ALLOWED_STATUSES = ["active", "inactive"];
const ALLOWED_IDENTITY_TYPES = ["citizen_id", "passport", "tax_id"];
const ALLOWED_TAX_RESIDENT = ["resident", "non_resident"];
const ALLOWED_INSURED_TYPES = ["section_33", "section_39", "section_40", "custom"];

const SELECT_FIELDS = `
  id,
  employee_id,
  tax_identity_type,
  tax_identification_no,
  tax_filing_form_code,
  tax_withholding_company_id,
  tax_resident_status,
  social_security_registered,
  social_security_no,
  insured_type,
  social_security_company_id,
  effective_from,
  effective_to,
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
    first_name_en,
    middle_name_en,
    last_name_en,
    citizen_id,
    passport_no,
    social_security_no,
    payroll_company_id,
    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,
    status,
    companies (
      id,
      company_code,
      company_name_th,
      company_name_en
    ),
    payroll_companies:payroll_company_id (
      id,
      payroll_company_code,
      payroll_company_name,
      company_id
    )
  ),
  tax_withholding_company:companies!employee_statutory_profiles_tax_withholding_company_id_fkey (
    id,
    company_code,
    company_name_th,
    company_name_en,
    tax_id
  ),
  social_security_company:companies!employee_statutory_profiles_social_security_company_id_fkey (
    id,
    company_code,
    company_name_th,
    company_name_en,
    tax_id
  )
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
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return fallback;
}

function cleanDate(value) {
  const text = cleanText(value);
  if (!text) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeTaxForm(value) {
  const text = cleanText(value).toUpperCase();
  return text || null;
}

function getEmployeeName(employee) {
  const thai = [
    employee?.first_name_th,
    employee?.middle_name_th,
    employee?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (thai) return thai;

  return [
    employee?.first_name_en,
    employee?.middle_name_en,
    employee?.last_name_en,
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
    if (message.includes("uq_employee_statutory_profiles_active")) {
      return "พนักงานรายนี้มีข้อมูลภาษีและประกันสังคมที่ใช้งานอยู่แล้ว";
    }
    return "ข้อมูลซ้ำในระบบ";
  }

  if (error.code === "23503") return "ไม่พบพนักงานหรือบริษัทที่อ้างอิง";
  if (error.code === "23514") return "ข้อมูลไม่ผ่านเงื่อนไขของระบบ";
  if (error.code === "23502") return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  if (error.code === "22P02") return "รูปแบบ UUID ไม่ถูกต้อง";

  return error.message || "เกิดข้อผิดพลาดในฐานข้อมูล";
}

async function getById(id) {
  return supabaseAdmin.from(TABLE).select(SELECT_FIELDS).eq("id", id).maybeSingle();
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
      first_name_en,
      middle_name_en,
      last_name_en,
      citizen_id,
      passport_no,
      social_security_no,
      payroll_company_id,
      company_id,
      branch_group_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      status,
      companies (
        id,
        company_code,
        company_name_th,
        company_name_en
      ),
      payroll_companies:payroll_company_id (
        id,
        payroll_company_code,
        payroll_company_name,
        company_id
      )
    `)
    .eq("id", employeeId)
    .maybeSingle();
}

async function companyExists(companyId) {
  if (!companyId) return true;

  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

function resolveTaxIdentity(payload, employee) {
  if (payload.tax_identity_type === "citizen_id") {
    return cleanNullableText(employee?.citizen_id);
  }

  if (payload.tax_identity_type === "passport") {
    return cleanNullableText(employee?.passport_no);
  }

  return cleanNullableText(payload.tax_identification_no);
}

function normalizePatch(body, current) {
  const identityType =
    body.tax_identity_type !== undefined
      ? cleanText(body.tax_identity_type).toLowerCase()
      : current.tax_identity_type;

  const residentStatus =
    body.tax_resident_status !== undefined
      ? cleanText(body.tax_resident_status).toLowerCase()
      : current.tax_resident_status;

  const socialRegistered =
    body.social_security_registered !== undefined
      ? cleanBoolean(body.social_security_registered, false)
      : Boolean(current.social_security_registered);

  const insuredType =
    body.insured_type !== undefined
      ? cleanText(body.insured_type).toLowerCase()
      : current.insured_type;

  const status =
    body.status !== undefined
      ? cleanText(body.status).toLowerCase()
      : current.status;

  const payload = {
    employee_id:
      body.employee_id !== undefined
        ? cleanNullableText(body.employee_id)
        : current.employee_id,
    tax_identity_type: ALLOWED_IDENTITY_TYPES.includes(identityType)
      ? identityType
      : current.tax_identity_type,
    tax_identification_no:
      body.tax_identification_no !== undefined
        ? cleanNullableText(body.tax_identification_no)
        : current.tax_identification_no,
    tax_filing_form_code:
      body.tax_filing_form_code !== undefined
        ? normalizeTaxForm(body.tax_filing_form_code)
        : current.tax_filing_form_code,
    tax_withholding_company_id:
      body.tax_withholding_company_id !== undefined
        ? cleanNullableText(body.tax_withholding_company_id)
        : current.tax_withholding_company_id,
    tax_resident_status: ALLOWED_TAX_RESIDENT.includes(residentStatus)
      ? residentStatus
      : current.tax_resident_status,
    social_security_registered: socialRegistered,
    social_security_no: socialRegistered
      ? body.social_security_no !== undefined
        ? cleanNullableText(body.social_security_no)
        : current.social_security_no
      : null,
    insured_type: socialRegistered
      ? ALLOWED_INSURED_TYPES.includes(insuredType)
        ? insuredType
        : insuredType
          ? "custom"
          : null
      : null,
    social_security_company_id: socialRegistered
      ? body.social_security_company_id !== undefined
        ? cleanNullableText(body.social_security_company_id)
        : current.social_security_company_id
      : null,
    effective_from:
      body.effective_from !== undefined
        ? cleanDate(body.effective_from) || current.effective_from
        : current.effective_from,
    effective_to:
      body.effective_to !== undefined
        ? cleanDate(body.effective_to)
        : current.effective_to,
    status: ALLOWED_STATUSES.includes(status) ? status : current.status,
    remark:
      body.remark !== undefined ? cleanNullableText(body.remark) : current.remark,
  };

  if (payload.status === "inactive" && !payload.effective_to) {
    const today = new Date().toISOString().slice(0, 10);
    payload.effective_to =
      payload.effective_from && payload.effective_from > today
        ? payload.effective_from
        : today;
  }

  return payload;
}

function validatePayload(payload, employee) {
  if (!payload.employee_id) return "กรุณาเลือกพนักงาน";

  const identity = resolveTaxIdentity(payload, employee);
  if (!identity) {
    if (payload.tax_identity_type === "citizen_id") {
      return "พนักงานรายนี้ยังไม่มีเลขบัตรประชาชน";
    }
    if (payload.tax_identity_type === "passport") {
      return "พนักงานรายนี้ยังไม่มีเลข Passport";
    }
    return "กรุณากรอกเลขประจำตัวผู้เสียภาษี";
  }

  if (!payload.tax_withholding_company_id) {
    return "กรุณาเลือกบริษัทผู้จ่ายเงินได้ / บริษัทนำส่งภาษี";
  }

  if (payload.social_security_registered) {
    if (!payload.social_security_no) return "กรุณากรอกเลขประกันสังคม";
    if (!payload.insured_type) return "กรุณาเลือกประเภทผู้ประกันตน";
    if (!payload.social_security_company_id) {
      return "กรุณาเลือกบริษัทที่ขึ้นทะเบียนประกันสังคม";
    }
  }

  if (
    payload.effective_to &&
    payload.effective_from &&
    payload.effective_to < payload.effective_from
  ) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มมีผล";
  }

  return null;
}

export async function GET(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE, "view", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data, error } = await getById(id);

    if (error) throw error;
    if (!data) return jsonError("ไม่พบข้อมูลภาษีและประกันสังคมพนักงาน", 404);

    if (!data.employees || !guard.canAccessEmployee(data.employees)) {
      return jsonError("คุณไม่มีสิทธิ์ดูข้อมูลของพนักงานรายนี้", 403);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET_EMPLOYEE_STATUTORY_PROFILE_ERROR:", error);
    return jsonError(
      "ไม่สามารถโหลดข้อมูลภาษีและประกันสังคมพนักงานได้",
      getErrorStatus(error),
      mapDatabaseError(error)
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE, "edit", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data: current, error: currentError } = await getById(id);

    if (currentError) throw currentError;
    if (!current) return jsonError("ไม่พบข้อมูลภาษีและประกันสังคมพนักงาน", 404);

    if (!current.employees || !guard.canAccessEmployee(current.employees)) {
      return jsonError("คุณไม่มีสิทธิ์แก้ไขข้อมูลของพนักงานรายนี้", 403);
    }

    const body = await req.json();
    const payload = normalizePatch(body, current);

    const { data: targetEmployee, error: employeeError } = await getEmployeeById(
      payload.employee_id
    );

    if (employeeError) throw employeeError;
    if (!targetEmployee) return jsonError("ไม่พบพนักงานที่เลือก", 404);

    if (!guard.canAccessEmployee(targetEmployee)) {
      return jsonError("พนักงานที่เลือกอยู่นอกขอบเขตสิทธิ์ของคุณ", 403);
    }

    payload.tax_identification_no = resolveTaxIdentity(payload, targetEmployee);

    const validationError = validatePayload(payload, targetEmployee);
    if (validationError) return jsonError(validationError, 400);

    const [taxCompanyOk, socialCompanyOk] = await Promise.all([
      companyExists(payload.tax_withholding_company_id),
      companyExists(payload.social_security_company_id),
    ]);

    if (!taxCompanyOk) return jsonError("ไม่พบบริษัทนำส่งภาษีที่เลือก", 400);
    if (!socialCompanyOk) return jsonError("ไม่พบบริษัทประกันสังคมที่เลือก", 400);

    if (payload.status === "active") {
      const { data: anotherActive, error: activeError } = await supabaseAdmin
        .from(TABLE)
        .select("id")
        .eq("employee_id", payload.employee_id)
        .eq("status", "active")
        .neq("id", id)
        .maybeSingle();

      if (activeError) throw activeError;
      if (anotherActive) {
        return jsonError("พนักงานรายนี้มีข้อมูลที่ใช้งานอยู่อีกหนึ่งรายการแล้ว", 409);
      }
    }

    const actorId = guard?.access?.id || null;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
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
        module_name: "employee_statutory_profiles",
        action_type: "update",
        reference_table: TABLE,
        reference_id: id,
        description: `แก้ไขข้อมูลภาษีและประกันสังคมพนักงาน ${
          targetEmployee.employee_code || ""
        } ${getEmployeeName(targetEmployee)}`.trim(),
        old_data: {
          employee_id: current.employee_id,
          tax_identity_type: current.tax_identity_type,
          tax_filing_form_code: current.tax_filing_form_code,
          tax_withholding_company_id: current.tax_withholding_company_id,
          social_security_registered: current.social_security_registered,
          insured_type: current.insured_type,
          social_security_company_id: current.social_security_company_id,
          status: current.status,
        },
        new_data: {
          employee_id: payload.employee_id,
          tax_identity_type: payload.tax_identity_type,
          tax_filing_form_code: payload.tax_filing_form_code,
          tax_withholding_company_id: payload.tax_withholding_company_id,
          social_security_registered: payload.social_security_registered,
          insured_type: payload.insured_type,
          social_security_company_id: payload.social_security_company_id,
          status: payload.status,
        },
      });
    } catch (logError) {
      console.error("UPDATE_EMPLOYEE_STATUTORY_PROFILE_LOG_ERROR:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลภาษีและประกันสังคมพนักงานเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_STATUTORY_PROFILE_ERROR:", error);
    return jsonError(mapDatabaseError(error), getErrorStatus(error));
  }
}

export async function DELETE(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE, "delete", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data: current, error: currentError } = await getById(id);

    if (currentError) throw currentError;
    if (!current) return jsonError("ไม่พบข้อมูลภาษีและประกันสังคมพนักงาน", 404);

    if (!current.employees || !guard.canAccessEmployee(current.employees)) {
      return jsonError("คุณไม่มีสิทธิ์ปิดใช้งานข้อมูลของพนักงานรายนี้", 403);
    }

    const today = new Date().toISOString().slice(0, 10);
    const closeDate =
      current.effective_to ||
      (current.effective_from && current.effective_from > today
        ? current.effective_from
        : today);
    const actorId = guard?.access?.id || null;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update({
        status: "inactive",
        effective_to: closeDate,
        updated_by: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    try {
      await writeActivityLog({
        module_name: "employee_statutory_profiles",
        action_type: "delete",
        reference_table: TABLE,
        reference_id: id,
        description: `ปิดใช้งานข้อมูลภาษีและประกันสังคมพนักงาน ${
          current.employees?.employee_code || ""
        } ${getEmployeeName(current.employees)}`.trim(),
        old_data: {
          status: current.status,
          effective_to: current.effective_to,
        },
        new_data: {
          status: "inactive",
          effective_to: closeDate,
        },
      });
    } catch (logError) {
      console.error("DELETE_EMPLOYEE_STATUTORY_PROFILE_LOG_ERROR:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "ปิดใช้งานข้อมูลภาษีและประกันสังคมพนักงานเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("DELETE_EMPLOYEE_STATUTORY_PROFILE_ERROR:", error);
    return jsonError(mapDatabaseError(error), getErrorStatus(error));
  }
}
