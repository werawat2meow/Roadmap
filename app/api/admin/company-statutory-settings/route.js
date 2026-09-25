import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { writeActivityLog } from "@/lib/activityLogger";

const MODULE_CODE = "ems.company_statutory_settings";
const ALLOWED_STATUSES = ["active", "inactive"];

function cleanText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function cleanNullableText(value) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

function jsonError(message, status = 500, extra = {}) {
  return NextResponse.json(
    { success: false, error: message, ...extra },
    { status }
  );
}

function normalizePayload(body = {}) {
  return {
    company_id: cleanNullableText(body.company_id),
    sso_employer_account_no: cleanNullableText(body.sso_employer_account_no),
    sso_branch_no: cleanNullableText(body.sso_branch_no),
    wcf_registration_no: cleanNullableText(body.wcf_registration_no),
    effective_from: cleanNullableText(body.effective_from),
    effective_to: cleanNullableText(body.effective_to),
    status: cleanText(body.status || "active").toLowerCase(),
    remark: cleanNullableText(body.remark),
  };
}

function validatePayload(payload) {
  if (!payload.company_id) return "กรุณาเลือกบริษัท";
  if (!payload.effective_from) return "กรุณาเลือกวันที่เริ่มมีผล";

  if (payload.effective_to && payload.effective_to < payload.effective_from) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มมีผล";
  }

  if (!ALLOWED_STATUSES.includes(payload.status)) {
    return "สถานะไม่ถูกต้อง";
  }

  if (
    payload.sso_employer_account_no &&
    payload.sso_employer_account_no.length > 50
  ) {
    return "เลขบัญชีนายจ้างประกันสังคมยาวเกินกำหนด";
  }

  if (payload.sso_branch_no && payload.sso_branch_no.length > 30) {
    return "เลขสาขาประกันสังคมยาวเกินกำหนด";
  }

  if (payload.wcf_registration_no && payload.wcf_registration_no.length > 50) {
    return "เลขทะเบียนกองทุนเงินทดแทนยาวเกินกำหนด";
  }

  return null;
}

function rangesOverlap(startA, endA, startB, endB) {
  const maxEnd = "9999-12-31";
  return startA <= (endB || maxEnd) && startB <= (endA || maxEnd);
}

async function assertNoActiveOverlap({
  companyId,
  effectiveFrom,
  effectiveTo,
  excludeId = null,
}) {
  let query = supabaseAdmin
    .from("company_statutory_settings")
    .select("id,effective_from,effective_to,status")
    .eq("company_id", companyId)
    .eq("status", "active");

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const overlap = (data || []).some((item) =>
    rangesOverlap(
      effectiveFrom,
      effectiveTo,
      item.effective_from,
      item.effective_to
    )
  );

  return overlap
    ? "ช่วงวันที่มีผลซ้ำกับทะเบียนที่ใช้งานอยู่ของบริษัทนี้"
    : null;
}

async function getCompany(companyId) {
  return supabaseAdmin
    .from("companies")
    .select(
      "id,company_code,company_name_th,company_name_en,tax_id,branch_no,status"
    )
    .eq("id", companyId)
    .maybeSingle();
}

async function getSummary(guard) {
  let query = supabaseAdmin
    .from("company_statutory_settings")
    .select(
      "id,company_id,status,sso_employer_account_no,wcf_registration_no"
    );

  query = guard.applyScope(query, "company_id");

  const { data, error } = await query;
  if (error) throw error;

  const rows = data || [];

  return {
    total: rows.length,
    active: rows.filter((item) => item.status === "active").length,
    with_sso: rows.filter((item) => Boolean(item.sso_employer_account_no)).length,
    with_wcf: rows.filter((item) => Boolean(item.wcf_registration_no)).length,
  };
}

async function findMatchingCompanyIds(search, guard) {
  if (!search) return [];

  let query = supabaseAdmin
    .from("companies")
    .select("id")
    .or(
      [
        `company_code.ilike.%${search}%`,
        `company_name_th.ilike.%${search}%`,
        `company_name_en.ilike.%${search}%`,
        `tax_id.ilike.%${search}%`,
      ].join(",")
    );

  query = guard.applyScope(query, "id");

  const { data, error } = await query.limit(200);
  if (error) throw error;

  return (data || []).map((item) => item.id);
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const scopeContext = cleanText(searchParams.get("scope_context"));
    const isEmployeeContext = scopeContext === "ems.employees";

    const guard = isEmployeeContext
      ? await requireScopedAccess("ems.employees", "view", {
          scopeType: "company",
        })
      : await requireScopedAccess(MODULE_CODE, "view", {
          scopeType: "company",
        });

    if (!guard.ok) return guard.response;

    const search = cleanText(searchParams.get("search"));
    const companyId = cleanText(searchParams.get("company_id"));
    const status = cleanText(searchParams.get("status")).toLowerCase();
    const effectiveOn = cleanNullableText(searchParams.get("effective_on"));
    const all = searchParams.get("all") === "true";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 20), 1),
      100
    );

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return jsonError("สถานะไม่ถูกต้อง", 400);
    }

    if (companyId) {
      const scopeResponse = guard.assertAccessId(
        companyId,
        isEmployeeContext
          ? "คุณไม่มีสิทธิ์เข้าถึงข้อมูลทะเบียนของบริษัทนี้"
          : "คุณไม่มีสิทธิ์เข้าถึงทะเบียนภาษีและประกันสังคมของบริษัทนี้"
      );

      if (scopeResponse) return scopeResponse;
    }

    let query = supabaseAdmin.from("company_statutory_settings").select(
      `
        id,
        company_id,
        sso_employer_account_no,
        sso_branch_no,
        wcf_registration_no,
        effective_from,
        effective_to,
        status,
        remark,
        created_by,
        updated_by,
        created_at,
        updated_at,
        companies:company_id (
          id,
          company_code,
          company_name_th,
          company_name_en,
          tax_id,
          branch_no,
          status
        )
      `,
      { count: all ? undefined : "exact" }
    );

    query = guard.applyScope(query, "company_id");

    if (companyId) query = query.eq("company_id", companyId);
    if (status) query = query.eq("status", status);

    if (effectiveOn) {
      query = query
        .lte("effective_from", effectiveOn)
        .or(`effective_to.is.null,effective_to.gte.${effectiveOn}`);
    }

    if (search) {
      const companyIds = await findMatchingCompanyIds(search, guard);
      const filters = [
        `sso_employer_account_no.ilike.%${search}%`,
        `sso_branch_no.ilike.%${search}%`,
        `wcf_registration_no.ilike.%${search}%`,
        `remark.ilike.%${search}%`,
      ];

      if (companyIds.length > 0) {
        filters.push(`company_id.in.(${companyIds.join(",")})`);
      }

      query = query.or(filters.join(","));
    }

    query = query
      .order("effective_from", { ascending: false })
      .order("created_at", { ascending: false });

    if (all) {
      query = query.limit(1000);
    } else {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const [listResult, summary] = await Promise.all([query, getSummary(guard)]);

    if (listResult.error) throw listResult.error;

    if (all) {
      return NextResponse.json({
        success: true,
        data: listResult.data || [],
        total: listResult.data?.length || 0,
        meta: {
          scope_context: scopeContext || null,
          permission_context: isEmployeeContext
            ? "ems.employees.view"
            : "ems.company_statutory_settings.view",
        },
      });
    }

    const total = Number(listResult.count || 0);

    return NextResponse.json({
      success: true,
      data: listResult.data || [],
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(Math.ceil(total / pageSize), 1),
      },
      meta: {
        scope_context: scopeContext || null,
        permission_context: isEmployeeContext
          ? "ems.employees.view"
          : "ems.company_statutory_settings.view",
      },
    });
  } catch (error) {
    console.error("GET_COMPANY_STATUTORY_SETTINGS_ERROR:", error);
    return jsonError(
      error?.message || "ไม่สามารถโหลดทะเบียนภาษีและประกันสังคมบริษัทได้"
    );
  }
}

export async function POST(req) {
  try {
    const guard = await requireScopedAccess(MODULE_CODE, "create", {
      scopeType: "company",
    });

    if (!guard.ok) return guard.response;

    let body = null;
    try {
      body = await req.json();
    } catch {
      return jsonError("รูปแบบ Request Body ไม่ถูกต้อง", 400);
    }

    const payload = normalizePayload(body);
    const validationError = validatePayload(payload);
    if (validationError) return jsonError(validationError, 400);

    const companyScopeResponse = guard.assertAccessId(
      payload.company_id,
      "คุณไม่มีสิทธิ์เพิ่มทะเบียนให้บริษัทนี้"
    );
    if (companyScopeResponse) return companyScopeResponse;

    const { data: company, error: companyError } = await getCompany(
      payload.company_id
    );
    if (companyError) throw companyError;
    if (!company) return jsonError("ไม่พบบริษัทที่เลือก", 400);
    if (company.status !== "active") {
      return jsonError("บริษัทที่เลือกไม่ได้เปิดใช้งาน", 400);
    }

    if (payload.status === "active") {
      const overlapError = await assertNoActiveOverlap({
        companyId: payload.company_id,
        effectiveFrom: payload.effective_from,
        effectiveTo: payload.effective_to,
      });
      if (overlapError) return jsonError(overlapError, 409);
    }

    const actorId = guard?.access?.id || null;

    const { data, error } = await supabaseAdmin
      .from("company_statutory_settings")
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
            company_name_en,
            tax_id,
            branch_no,
            status
          )
        `
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return jsonError(
          "บริษัทนี้มีทะเบียนที่เริ่มมีผลในวันที่เดียวกันแล้ว",
          409
        );
      }
      throw error;
    }

    try {
      await writeActivityLog({
        module_name: "company_statutory_settings",
        action_type: "create",
        reference_table: "company_statutory_settings",
        reference_id: data.id,
        description: `เพิ่มทะเบียนภาษีและประกันสังคมบริษัท ${
          company.company_code || ""
        } - ${company.company_name_th || company.company_name_en || ""}`.trim(),
        new_data: data,
      });
    } catch (logError) {
      console.error("CREATE_COMPANY_STATUTORY_SETTING_LOG_ERROR:", logError);
    }

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มทะเบียนภาษีและประกันสังคมบริษัทเรียบร้อยแล้ว",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST_COMPANY_STATUTORY_SETTING_ERROR:", error);
    return jsonError(error?.message || "ไม่สามารถเพิ่มทะเบียนบริษัทได้");
  }
}
