import { renderToBuffer } from "@react-pdf/renderer";

import {
  EmploymentContractDocument,
  fetchImageAsDataUri,
} from "@/app/recruitment/components/pdf/employment-contract/EmploymentContractDocument";
import { isEmployerSignatureType } from "@/app/recruitment/components/pdf/employment-contract/types";
import {
  buildEmploymentContractData,
  ensureContractNumberForApplication,
  getContractSigners,
} from "@/app/recruitment/lib/contracts";
import {
  authorizeContractAccess,
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

function sanitizeFilenamePart(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+|[.-]+$/g, "")
    .slice(0, 80);
}

function createDownloadFilename(
  employeeName: string,
  contractNo: string | null,
): string {
  const safeEmployeeName = sanitizeFilenamePart(employeeName) || "employee";
  const safeContractNo = sanitizeFilenamePart(contractNo) || "draft";
  return `employment-contract-${safeEmployeeName}-${safeContractNo}.pdf`;
}

async function readRequestBody(request: Request): Promise<ExportRequestBody | null> {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return null;
    return body as ExportRequestBody;
  } catch {
    return null;
  }
}

export async function POST(
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
    const authorization = await authorizeContractAccess(id);
    if (!authorization.ok) return authorization.response;

    // The client supplies only the ID. All signer data is loaded again here.
    const allowedSigners = await getContractSigners(id);
    const signer = allowedSigners.find((item) => item.id === body.signerId);

    if (!signer) {
      return contractErrorResponse(
        "INVALID_SIGNER",
        "ผู้ลงนามที่เลือกไม่มีสิทธิ์ลงนามในสัญญานี้",
        403,
      );
    }

    await ensureContractNumberForApplication(id);
    const contractData = await buildEmploymentContractData(
      id,
      signer,
      request.url,
    );
    const logoDataUri = await fetchImageAsDataUri(contractData.company.logo);
    const document = EmploymentContractDocument({
      data: contractData,
      logoDataUri,
      employerSignatureType: body.employerSignatureType,
    });
    const pdfBuffer = await renderToBuffer(document);

    const employeeName = [
      contractData.employee.firstNameTH,
      contractData.employee.lastNameTH,
    ]
      .filter(Boolean)
      .join(" ");
    const filename = createDownloadFilename(
      employeeName,
      contractData.contract.contractNo,
    );

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          `attachment; filename="employment-contract.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
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
