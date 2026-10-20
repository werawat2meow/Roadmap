import { exportContractPdf, pdfDownload } from "@/app/recruitment/lib/contracts/exportContract";
import { withActivity } from "@/app/recruitment/lib/activity/server";
import { isEmployerSignatureType } from "@/app/recruitment/components/pdf/employment-contract/types";
import {
  contractDataErrorResponse,
  contractErrorResponse,
  isValidContractIdentifier,
} from "@/app/recruitment/lib/contracts/contractApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExportRouteContext {
  params: Promise<{ id: string }>;
}

type ExportRequestBody = {
  signerId?: unknown;
  employerSignatureType?: unknown;
};

async function readRequestBody(request: Request): Promise<ExportRequestBody | null> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as ExportRequestBody;
  } catch {
    return null;
  }
}

async function handlePOST(
  request: Request,
  { params }: ExportRouteContext,
) {
  const { id } = await params;

  if (!isValidContractIdentifier(id)) {
    return contractErrorResponse(
      "INVALID_CONTRACT_ID",
      "รหัสสัญญาไม่ถูกต้อง",
      400,
    );
  }

  const body = await readRequestBody(request);
  if (!body) {
    return contractErrorResponse(
      "INVALID_REQUEST_BODY",
      "รูปแบบข้อมูลไม่ถูกต้อง",
      400,
    );
  }

  if (!isValidContractIdentifier(body.signerId)) {
    return contractErrorResponse(
      "INVALID_SIGNER_ID",
      "รหัสผู้ลงนามไม่ถูกต้อง",
      400,
    );
  }

  if (!isEmployerSignatureType(body.employerSignatureType)) {
    return contractErrorResponse(
      "INVALID_EMPLOYER_SIGNATURE_TYPE",
      "ประเภทผู้ลงนามไม่ถูกต้อง",
      400,
    );
  }

  try {
    const result = await exportContractPdf(id, body.signerId, body.employerSignatureType, request.url);
    if (result.error) return result.error;
    return pdfDownload(result.buffer, result.filename);
  } catch (error) {
    console.error("EXPORT_EMPLOYMENT_CONTRACT_ERROR", {
      contractId: id,
      error,
    });
    return contractDataErrorResponse(
      error,
      "PDF_GENERATION_FAILED",
      "ไม่สามารถสร้างไฟล์สัญญาจ้างได้",
    );
  }
}

export const POST = withActivity(handlePOST, {"page_path": "/recruitment/approve_employees", "action": "EXPORT", "resource_type": "employment_contract", "idField": "id"});
