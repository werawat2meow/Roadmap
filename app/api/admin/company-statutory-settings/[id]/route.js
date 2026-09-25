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

function jsonError(message, status = 500) {
  return NextResponse.json({ success: false, error: message }, { status });
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

  if (!ALLOWED_STATUSES.includes(payload.status)) return "สถานะไม่ถูกต้อง";

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

async function loadById(id) {
  return supabaseAdmin
    .from("company_statutory_settings")
    .select(
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
      `
    )
    .eq("id", id)
    .maybeSingle();
}

async function assertNoActiveOverlap({
  companyId,
  effectiveFrom,
  effectiveTo,
  excludeId,
}) {
  const { data, error } = await supabaseAdmin
    .from("company_statutory_settings")
    .select("id,effective_from,effective_to")
    .eq("company_id", companyId)
    .eq("status", "active")
    .neq("id", excludeId);

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

export async function GET(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE_CODE, "view", {
      scopeType: "company",
    });
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data, error } = await loadById(id);

    if (error) throw error;
    if (!data) return jsonError("ไม่พบทะเบียนบริษัทที่เลือก", 404);

    const scopeResponse = guard.assertAccessId(
      data.company_id,
      "คุณไม่มีสิทธิ์ดูทะเบียนของบริษัทนี้"
    );
    if (scopeResponse) return scopeResponse;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET_COMPANY_STATUTORY_SETTING_ERROR:", error);
    return jsonError(
      error?.message || "ไม่สามารถโหลดรายละเอียดทะเบียนบริษัทได้"
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE_CODE, "edit", {
      scopeType: "company",
    });
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data: current, error: currentError } = await loadById(id);

    if (currentError) throw currentError;
    if (!current) return jsonError("ไม่พบทะเบียนบริษัทที่เลือก", 404);

    const currentScopeResponse = guard.assertAccessId(
      current.company_id,
      "คุณไม่มีสิทธิ์แก้ไขทะเบียนของบริษัทนี้"
    );
    if (currentScopeResponse) return currentScopeResponse;

    let body = null;
    try {
      body = await req.json();
    } catch {
      return jsonError("รูปแบบ Request Body ไม่ถูกต้อง", 400);
    }

    const payload = normalizePayload(body);
    const validationError = validatePayload(payload);
    if (validationError) return jsonError(validationError, 400);

    // Company ของ Record เดิมไม่เปลี่ยนตอน Edit
    payload.company_id = current.company_id;

    if (payload.status === "active") {
      const overlapError = await assertNoActiveOverlap({
        companyId: current.company_id,
        effectiveFrom: payload.effective_from,
        effectiveTo: payload.effective_to,
        excludeId: id,
      });
      if (overlapError) return jsonError(overlapError, 409);
    }

    const actorId = guard?.access?.id || null;

    const { data, error } = await supabaseAdmin
      .from("company_statutory_settings")
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
        action_type: "update",
        reference_table: "company_statutory_settings",
        reference_id: id,
        description: `แก้ไขทะเบียนภาษีและประกันสังคมบริษัท ${
          current.companies?.company_code || ""
        } - ${
          current.companies?.company_name_th ||
          current.companies?.company_name_en ||
          ""
        }`.trim(),
        old_data: current,
        new_data: data,
      });
    } catch (logError) {
      console.error("UPDATE_COMPANY_STATUTORY_SETTING_LOG_ERROR:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขทะเบียนภาษีและประกันสังคมบริษัทเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("PATCH_COMPANY_STATUTORY_SETTING_ERROR:", error);
    return jsonError(error?.message || "ไม่สามารถแก้ไขทะเบียนบริษัทได้");
  }
}

export async function DELETE(req, { params }) {
  try {
    const guard = await requireScopedAccess(MODULE_CODE, "delete", {
      scopeType: "company",
    });
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { data: current, error: currentError } = await loadById(id);

    if (currentError) throw currentError;
    if (!current) return jsonError("ไม่พบทะเบียนบริษัทที่เลือก", 404);

    const scopeResponse = guard.assertAccessId(
      current.company_id,
      "คุณไม่มีสิทธิ์ลบทะเบียนของบริษัทนี้"
    );
    if (scopeResponse) return scopeResponse;

    const { error } = await supabaseAdmin
      .from("company_statutory_settings")
      .delete()
      .eq("id", id);

    if (error) throw error;

    try {
      await writeActivityLog({
        module_name: "company_statutory_settings",
        action_type: "delete",
        reference_table: "company_statutory_settings",
        reference_id: id,
        description: `ลบทะเบียนภาษีและประกันสังคมบริษัท ${
          current.companies?.company_code || ""
        } - ${
          current.companies?.company_name_th ||
          current.companies?.company_name_en ||
          ""
        }`.trim(),
        old_data: current,
      });
    } catch (logError) {
      console.error("DELETE_COMPANY_STATUTORY_SETTING_LOG_ERROR:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "ลบทะเบียนภาษีและประกันสังคมบริษัทเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE_COMPANY_STATUTORY_SETTING_ERROR:", error);

    if (error?.code === "23503") {
      return jsonError(
        "ไม่สามารถลบทะเบียนนี้ได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
        409
      );
    }

    return jsonError(error?.message || "ไม่สามารถลบทะเบียนบริษัทได้");
  }
}
