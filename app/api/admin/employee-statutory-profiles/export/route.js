import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const MODULE = "ems.employee_statutory_profiles";
const TABLE = "employee_statutory_profiles";
const SCOPE_BATCH_SIZE = 1000;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALLOWED_STATUSES = ["active", "inactive"];
const ALLOWED_IDENTITY_TYPES = ["citizen_id", "passport", "tax_id"];
const NO_ACCESS_UUID = "00000000-0000-0000-0000-000000000000";

function cleanText(value) {
  return String(value ?? "").trim();
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function companyLabel(company) {
  if (!company) return "";
  return [
    company.company_code,
    company.company_name_th || company.company_name_en,
  ]
    .filter(Boolean)
    .join(" - ");
}

function employeeName(employee) {
  return [
    employee?.first_name_th,
    employee?.middle_name_th,
    employee?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
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

function applyScope(query, ids) {
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

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(MODULE, "export", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE, 1),
      MAX_PAGE_SIZE
    );
    const search = cleanText(searchParams.get("search"));
    const status = cleanText(searchParams.get("status")).toLowerCase();
    const identityType = cleanText(
      searchParams.get("tax_identity_type")
    ).toLowerCase();
    const socialRegistered = searchParams.get("social_security_registered");
    const taxCompanyId = cleanText(
      searchParams.get("tax_withholding_company_id")
    );
    const ssoCompanyId = cleanText(
      searchParams.get("social_security_company_id")
    );

    const scopedEmployeeIds = await getScopedEmployeeIds(guard);
    const searchedEmployeeIds = search
      ? await findScopedEmployeeIdsBySearch(guard, search)
      : null;

    let query = supabaseAdmin
      .from(TABLE)
      .select(`
        id,
        employee_id,
        tax_identity_type,
        tax_identification_no,
        tax_filing_form_code,
        tax_resident_status,
        social_security_registered,
        social_security_no,
        insured_type,
        effective_from,
        effective_to,
        status,
        remark,
        employees:employee_id (
          employee_code,
          first_name_th,
          middle_name_th,
          last_name_th,
          companies (
            company_code,
            company_name_th,
            company_name_en
          ),
          payroll_companies:payroll_company_id (
            payroll_company_code,
            payroll_company_name
          )
        ),
        tax_withholding_company:companies!employee_statutory_profiles_tax_withholding_company_id_fkey (
          company_code,
          company_name_th,
          company_name_en
        ),
        social_security_company:companies!employee_statutory_profiles_social_security_company_id_fkey (
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .order("created_at", { ascending: false });

    query = applyScope(query, scopedEmployeeIds);

    if (Array.isArray(searchedEmployeeIds)) {
      if (!searchedEmployeeIds.length) {
        query = query.eq("employee_id", NO_ACCESS_UUID);
      } else {
        query = query.in("employee_id", searchedEmployeeIds);
      }
    }

    if (status && ALLOWED_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    if (identityType && ALLOWED_IDENTITY_TYPES.includes(identityType)) {
      query = query.eq("tax_identity_type", identityType);
    }

    if (taxCompanyId) {
      query = query.eq("tax_withholding_company_id", taxCompanyId);
    }

    if (ssoCompanyId) {
      query = query.eq("social_security_company_id", ssoCompanyId);
    }

    if (socialRegistered === "true") {
      query = query.eq("social_security_registered", true);
    } else if (socialRegistered === "false") {
      query = query.eq("social_security_registered", false);
    }

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error } = await query;
    if (error) throw error;

    const headers = [
      "employee_code",
      "employee_name",
      "organization_company",
      "payroll_company",
      "tax_identity_type",
      "tax_identification_no",
      "tax_filing_form_code",
      "tax_resident_status",
      "tax_withholding_company",
      "social_security_registered",
      "social_security_no",
      "insured_type",
      "social_security_company",
      "effective_from",
      "effective_to",
      "status",
      "remark",
    ];

    const lines = [headers.map(csvCell).join(",")];

    for (const item of data || []) {
      lines.push(
        [
          item.employees?.employee_code,
          employeeName(item.employees),
          companyLabel(item.employees?.companies),
          item.employees?.payroll_companies
            ? [
                item.employees.payroll_companies.payroll_company_code,
                item.employees.payroll_companies.payroll_company_name,
              ]
                .filter(Boolean)
                .join(" - ")
            : "",
          item.tax_identity_type,
          item.tax_identification_no,
          item.tax_filing_form_code,
          item.tax_resident_status,
          companyLabel(item.tax_withholding_company),
          item.social_security_registered ? "true" : "false",
          item.social_security_no,
          item.insured_type,
          companyLabel(item.social_security_company),
          item.effective_from,
          item.effective_to,
          item.status,
          item.remark,
        ]
          .map(csvCell)
          .join(",")
      );
    }

    const csv = `\uFEFF${lines.join("\r\n")}`;
    const fileName = `employee-statutory-profiles-page-${page}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("EXPORT_EMPLOYEE_STATUTORY_PROFILES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถส่งออกข้อมูลได้",
      },
      { status: 500 }
    );
  }
}
