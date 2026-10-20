import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { withActivity } from "@/app/recruitment/lib/activity/server";
import { isEmployerSignatureType } from "@/app/recruitment/components/pdf/employment-contract/types";

import { getContractSigners } from "@/app/recruitment/lib/contracts";
import {
  authorizeContractAccess,
  contractDataErrorResponse,
  contractErrorResponse,
  isValidContractIdentifier,
} from "@/app/recruitment/lib/contracts/contractApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePATCH(request: Request, { params }: SignersRouteContext) {
  const { id } = await params;
  if (!isValidContractIdentifier(id)) return contractErrorResponse("INVALID_CONTRACT_ID", "รหัสสัญญาไม่ถูกต้อง", 400);
  try {
    const authorization = await authorizeContractAccess(id, "edit");
    if (!authorization.ok) return authorization.response;
    let body;
    try { body = await request.json(); } catch { return contractErrorResponse("INVALID_REQUEST_BODY", "รูปแบบข้อมูลไม่ถูกต้อง", 400); }
    if (!isValidContractIdentifier(body?.signerId) || !isEmployerSignatureType(body?.employerSignatureType)) {
      return contractErrorResponse("INVALID_REQUEST_BODY", "กรุณาเลือกผู้ลงนามและประเภทผู้ลงนามให้ถูกต้อง", 400);
    }
    const signers = await getContractSigners(id);
    if (!signers.some(signer => signer.id === body.signerId)) {
      return contractErrorResponse("INVALID_SIGNER", "ผู้ลงนามนี้ไม่พร้อมใช้งาน กรุณาเลือกใหม่", 403);
    }
    let query = supabaseAdmin.from("recruit_job_applications").update({
      contract_signer_id: body.signerId,
      employer_signature_type: body.employerSignatureType,
    }).eq("id", id).in("status", [15, 17]);
    // Do not save if the application's authorized organizational scope changed.
    for (const field of ["company_id", "branch_id", "department_id", "division_id", "unit_id"] as const) {
      const value = authorization.scope[field];
      query = value == null ? query.is(field, null) : query.eq(field, value);
    }
    const { data, error } = await query.select("id").maybeSingle();
    if (error) return contractErrorResponse("DATABASE_ERROR", "บันทึกผู้ลงนามไม่สำเร็จ กรุณาลองใหม่", 500);
    if (!data) return contractErrorResponse("CONTRACT_NOT_ELIGIBLE", "ข้อมูลใบสมัครเปลี่ยนแล้ว กรุณาโหลดใหม่", 409);
    return NextResponse.json({ success: true, signerId: body.signerId, employerSignatureType: body.employerSignatureType }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return contractDataErrorResponse(error, "DATABASE_ERROR", "บันทึกผู้ลงนามไม่สำเร็จ");
  }
}

export const PATCH = withActivity(handlePATCH, { page_path: "/recruitment/report/approve_emp", action: "UPDATE", resource_type: "employment_contract", idField: "id" });

interface SignersRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: Request,
  { params }: SignersRouteContext,
) {
  const { id } = await params;

  if (!isValidContractIdentifier(id)) {
    return contractErrorResponse(
      "INVALID_CONTRACT_ID",
      "รหัสสัญญาไม่ถูกต้อง",
      400,
    );
  }

  try {
    const authorization = await authorizeContractAccess(id);
    if (!authorization.ok) return authorization.response;

    const signers = await getContractSigners(id);

    return NextResponse.json(
      { data: signers },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("GET_CONTRACT_SIGNERS_ERROR", { contractId: id, error });
    return contractDataErrorResponse(
      error,
      "DATABASE_ERROR",
      "ไม่สามารถอ่านข้อมูลผู้ลงนามได้",
    );
  }
}

