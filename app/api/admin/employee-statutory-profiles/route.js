import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const MODULE = "ems.employee_statutory_profiles";
const TABLE = "employee_statutory_profiles";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const SCOPE_BATCH_SIZE = 1000;
const NO_ACCESS_UUID = "00000000-0000-0000-0000-000000000000";

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

function normalizeStatus(value) {
  const status = cleanText(value).toLowerCase() || "active";
  return ALLOWED_STATUSES.includes(status) ? status : "active";
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
      return "พนักงานรายนี้มีข้อมูลภาษีและประกันสังคมที่ใช้งานอยู่แล้ว กรุณาแก้ไขรายการเดิมหรือปิดใช้งานก่อน";
    }
    return "ข้อมูลซ้ำในระบบ";
  }

  if (error.code === "23503") {
    return "ไม่พบพนักงานหรือบริษัทที่อ้างอิง";
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

async function getCompanyById(companyId) {
  if (!companyId) return { data: null, error: null };

  return supabaseAdmin
    .from("companies")
    .select("id, company_code, company_name_th, company_name_en, tax_id, status")
    .eq("id", companyId)
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
  if (!ids.length) return query.eq("employee_id", NO_ACCESS_UUID);
  return query.in("employee_id", ids);
}

async function findScopedEmployeeIdsBySearch(guard, search) {
  const keyword = cleanText(search);
  if (!keyword) return null;

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
    .or(
      [
        `employee_code.ilike.%${keyword}%`,
        `first_name_th.ilike.%${keyword}%`,
        `last_name_th.ilike.%${keyword}%`,
        `first_name_en.ilike.%${keyword}%`,
        `last_name_en.ilike.%${keyword}%`,
        `citizen_id.ilike.%${keyword}%`,
        `passport_no.ilike.%${keyword}%`,
      ].join(",")
    )
    .limit(500);

  query = guard.applyEmployeeScope(query);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => item.id);
}

function resolveTaxIdentity(payload, employee) {
  const type = payload.tax_identity_type;

  if (type === "citizen_id") {
    return cleanNullableText(employee?.citizen_id);
  }

  if (type === "passport") {
    return cleanNullableText(employee?.passport_no);
  }

  return cleanNullableText(payload.tax_identification_no);
}

function normalizePayload(body = {}) {
  const identityType = cleanText(body.tax_identity_type).toLowerCase() || "citizen_id";
  const residentStatus = cleanText(body.tax_resident_status).toLowerCase() || "resident";
  const insuredType = cleanText(body.insured_type).toLowerCase();
  const registered = cleanBoolean(body.social_security_registered, false);
  const status = normalizeStatus(body.status);

  return {
    employee_id: cleanNullableText(body.employee_id),
    tax_identity_type: ALLOWED_IDENTITY_TYPES.includes(identityType)
      ? identityType
      : "citizen_id",
    tax_identification_no: cleanNullableText(body.tax_identification_no),
    tax_filing_form_code: normalizeTaxForm(body.tax_filing_form_code),
    tax_withholding_company_id: cleanNullableText(body.tax_withholding_company_id),
    tax_resident_status: ALLOWED_TAX_RESIDENT.includes(residentStatus)
      ? residentStatus
      : "resident",
    social_security_registered: registered,
    social_security_no: registered
      ? cleanNullableText(body.social_security_no)
      : null,
    insured_type:
      registered && ALLOWED_INSURED_TYPES.includes(insuredType)
        ? insuredType
        : registered && insuredType
          ? "custom"
          : null,
    social_security_company_id: registered
      ? cleanNullableText(body.social_security_company_id)
      : null,
    effective_from: cleanDate(body.effective_from) || new Date().toISOString().slice(0, 10),
    effective_to: cleanDate(body.effective_to),
    status,
    remark: cleanNullableText(body.remark),
  };
}

function validatePayload(payload, employee) {
  if (!payload.employee_id) return "กรุณาเลือกพนักงาน";

  const identityNo = resolveTaxIdentity(payload, employee);
  if (!identityNo) {
    if (payload.tax_identity_type === "citizen_id") {
      return "พนักงานรายนี้ยังไม่มีเลขบัตรประชาชน กรุณาเพิ่มใน Employee Master หรือเปลี่ยน Tax Identity";
    }
    if (payload.tax_identity_type === "passport") {
      return "พนักงานรายนี้ยังไม่มีเลข Passport กรุณาเพิ่มใน Employee Master หรือเปลี่ยน Tax Identity";
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

async function loadMasters(
  guard,
  search,
  {
    employeePage = 1,
    employeePageSize = 20,
    includeCompanies = true,
  } = {}
) {
  const keyword = cleanText(search);
  const page = Math.max(Number(employeePage) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(employeePageSize) || 20, 1),
    50
  );

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let employeeQuery = supabaseAdmin
    .from("employees")
    .select(
      `
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
    `,
      { count: "exact" }
    )
    .order("employee_code", { ascending: true });

  employeeQuery = guard.applyEmployeeScope(employeeQuery);

  if (keyword) {
    const safeKeyword = keyword.replaceAll(",", " ").trim();

    employeeQuery = employeeQuery.or(
      [
        `employee_code.ilike.%${safeKeyword}%`,
        `first_name_th.ilike.%${safeKeyword}%`,
        `last_name_th.ilike.%${safeKeyword}%`,
        `first_name_en.ilike.%${safeKeyword}%`,
        `last_name_en.ilike.%${safeKeyword}%`,
        `citizen_id.ilike.%${safeKeyword}%`,
        `passport_no.ilike.%${safeKeyword}%`,
      ].join(",")
    );
  }

  employeeQuery = employeeQuery.range(from, to);

  const companiesPromise = includeCompanies
    ? supabaseAdmin
        .from("companies")
        .select(
          "id, company_code, company_name_th, company_name_en, tax_id, status, sort_order"
        )
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("company_code", { ascending: true })
        .limit(500)
    : Promise.resolve({ data: [], error: null });

  const [employeesResult, companiesResult] = await Promise.all([
    employeeQuery,
    companiesPromise,
  ]);

  if (employeesResult.error) throw employeesResult.error;
  if (companiesResult.error) throw companiesResult.error;

  const total = Number(employeesResult.count || 0);

  return {
    employees: employeesResult.data || [],
    employeePagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
      hasMore: to + 1 < total,
    },
    companies: companiesResult.data || [],
  };
}

async function buildSummary(scopedEmployeeIds) {
  let query = supabaseAdmin
    .from(TABLE)
    .select(`
      id,
      employee_id,
      status,
      tax_identification_no,
      tax_withholding_company_id,
      social_security_registered,
      social_security_no,
      social_security_company_id
    `)
    .limit(5000);

  query = applyScopedEmployeeIds(query, scopedEmployeeIds);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data || [];

  return {
    total: rows.length,
    active: rows.filter((item) => item.status === "active").length,
    taxConfigured: rows.filter(
      (item) => item.tax_identification_no && item.tax_withholding_company_id
    ).length,
    socialSecurityConfigured: rows.filter(
      (item) =>
        item.social_security_registered &&
        item.social_security_no &&
        item.social_security_company_id
    ).length,
  };
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(MODULE, "view", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);

    const masters = searchParams.get("masters") === "true";
    if (masters) {
      const masterData = await loadMasters(
        guard,
        searchParams.get("employee_search"),
        {
          employeePage: searchParams.get("employee_page"),
          employeePageSize: searchParams.get("employee_page_size"),
          includeCompanies:
            searchParams.get("include_companies") !== "false",
        }
      );

      return NextResponse.json({
        success: true,
        data: masterData,
      });
    }

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );
    const all = searchParams.get("all") === "true";
    const includeSummary = searchParams.get("include_summary") === "true";
    const search = cleanText(searchParams.get("search"));
    const status = cleanText(searchParams.get("status")).toLowerCase();
    const identityType = cleanText(searchParams.get("tax_identity_type")).toLowerCase();
    const taxFormCode = normalizeTaxForm(searchParams.get("tax_filing_form_code"));
    const taxCompanyId = cleanText(searchParams.get("tax_withholding_company_id"));
    const ssoCompanyId = cleanText(searchParams.get("social_security_company_id"));
    const socialRegistered = searchParams.get("social_security_registered");

    const scopedEmployeeIds = await getScopedEmployeeIds(guard);
    const searchedEmployeeIds = search
      ? await findScopedEmployeeIdsBySearch(guard, search)
      : null;

    if (search && Array.isArray(searchedEmployeeIds) && !searchedEmployeeIds.length) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
        ...(includeSummary ? { summary: await buildSummary(scopedEmployeeIds) } : {}),
      });
    }

    let query = supabaseAdmin
      .from(TABLE)
      .select(SELECT_FIELDS, {
        count: all ? undefined : "exact",
      });

    query = applyScopedEmployeeIds(query, scopedEmployeeIds);

    if (Array.isArray(searchedEmployeeIds)) {
      query = query.in("employee_id", searchedEmployeeIds);
    }

    if (status && ALLOWED_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    if (identityType && ALLOWED_IDENTITY_TYPES.includes(identityType)) {
      query = query.eq("tax_identity_type", identityType);
    }

    if (taxFormCode) query = query.eq("tax_filing_form_code", taxFormCode);
    if (taxCompanyId) query = query.eq("tax_withholding_company_id", taxCompanyId);
    if (ssoCompanyId) query = query.eq("social_security_company_id", ssoCompanyId);

    if (socialRegistered === "true") {
      query = query.eq("social_security_registered", true);
    } else if (socialRegistered === "false") {
      query = query.eq("social_security_registered", false);
    }

    query = query
      .order("status", { ascending: true })
      .order("effective_from", { ascending: false })
      .order("created_at", { ascending: false });

    if (all) {
      query = query.limit(5000);
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
        totalPages: total ? Math.ceil(total / pageSize) : 0,
      },
      ...(includeSummary ? { summary: await buildSummary(scopedEmployeeIds) } : {}),
    });
  } catch (error) {
    console.error("GET_EMPLOYEE_STATUTORY_PROFILES_ERROR:", error);

    return jsonError(
      "ไม่สามารถโหลดข้อมูลภาษีและประกันสังคมพนักงานได้",
      getErrorStatus(error),
      mapDatabaseError(error)
    );
  }
}

export async function POST(req) {
  try {
    const guard = await requireScopedAccess(MODULE, "create", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const payload = normalizePayload(await req.json());

    const { data: employee, error: employeeError } = await getEmployeeById(
      payload.employee_id
    );

    if (employeeError) throw employeeError;
    if (!employee) return jsonError("ไม่พบพนักงานที่เลือก", 404);

    if (!guard.canAccessEmployee(employee)) {
      return jsonError("พนักงานที่เลือกอยู่นอกขอบเขตสิทธิ์ของคุณ", 403);
    }

    payload.tax_identification_no = resolveTaxIdentity(payload, employee);

    const validationError = validatePayload(payload, employee);
    if (validationError) return jsonError(validationError, 400);

    const [taxCompanyResult, socialCompanyResult, activeResult] = await Promise.all([
      getCompanyById(payload.tax_withholding_company_id),
      getCompanyById(payload.social_security_company_id),
      supabaseAdmin
        .from(TABLE)
        .select("id")
        .eq("employee_id", payload.employee_id)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    if (taxCompanyResult.error) throw taxCompanyResult.error;
    if (socialCompanyResult.error) throw socialCompanyResult.error;
    if (activeResult.error) throw activeResult.error;

    if (payload.tax_withholding_company_id && !taxCompanyResult.data) {
      return jsonError("ไม่พบบริษัทนำส่งภาษีที่เลือก", 400);
    }

    if (payload.social_security_company_id && !socialCompanyResult.data) {
      return jsonError("ไม่พบบริษัทประกันสังคมที่เลือก", 400);
    }

    if (payload.status === "active" && activeResult.data) {
      return jsonError(
        "พนักงานรายนี้มีข้อมูลที่ใช้งานอยู่แล้ว กรุณาแก้ไขรายการเดิมหรือปิดใช้งานก่อน",
        409
      );
    }

    const actorId = guard?.access?.id || null;

    const { data, error } = await supabaseAdmin
      .from(TABLE)
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
        module_name: "employee_statutory_profiles",
        action_type: "create",
        reference_table: TABLE,
        reference_id: data.id,
        description: `เพิ่มข้อมูลภาษีและประกันสังคมพนักงาน ${
          employee.employee_code || ""
        } ${getEmployeeName(employee)}`.trim(),
        new_data: {
          employee_id: payload.employee_id,
          tax_identity_type: payload.tax_identity_type,
          tax_filing_form_code: payload.tax_filing_form_code,
          tax_withholding_company_id: payload.tax_withholding_company_id,
          social_security_registered: payload.social_security_registered,
          insured_type: payload.insured_type,
          social_security_company_id: payload.social_security_company_id,
          effective_from: payload.effective_from,
          status: payload.status,
        },
      });
    } catch (logError) {
      console.error("CREATE_EMPLOYEE_STATUTORY_PROFILE_LOG_ERROR:", logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มข้อมูลภาษีและประกันสังคมพนักงานเรียบร้อยแล้ว",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE_EMPLOYEE_STATUTORY_PROFILE_ERROR:", error);
    return jsonError(mapDatabaseError(error), getErrorStatus(error));
  }
}
