import { renderToBuffer } from "@react-pdf/renderer";
import { EmploymentContractDocument, fetchImageAsDataUri } from "@/app/recruitment/components/pdf/employment-contract/EmploymentContractDocument";
import type { EmployerSignatureType } from "@/app/recruitment/components/pdf/employment-contract/types";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { buildEmploymentContractData, getContractSigners } from "./contractData";
import { ensureContractNumberForApplication } from "./contractNumber";
import { persistContractExportChoice } from "./contractExportChoice.mjs";
import { authorizeContractAccess, contractDataErrorResponse, contractErrorResponse } from "./contractApi";
import { filenamePart } from "./contractFilename";

export async function exportContractPdf(id: string, signerId: string, signatureType: EmployerSignatureType, requestUrl: string) {
  try {
    const authorization = await authorizeContractAccess(id);
    if (!authorization.ok) return { error: authorization.response };
    const signers = await getContractSigners(id);
    const signer = signers.find(item => item.id === signerId);
    if (!signer) return { error: contractErrorResponse("INVALID_SIGNER", "ผู้ลงนามไม่มีสิทธิ์ลงนามในสัญญานี้", 403) };
    const data = await buildEmploymentContractData(id, signer, requestUrl);
    // Validate all contract data before allocating a number. Every subsequent call,
    // including 17 -> 15 approval, reuses the stored number through the same RPC.
    const latestAuthorization = await authorizeContractAccess(id);
    if (!latestAuthorization.ok) return { error: latestAuthorization.response };
    data.contract.contractNo = await ensureContractNumberForApplication(id);
    const logoDataUri = await fetchImageAsDataUri(data.company.logo);
    const buffer = await renderToBuffer(EmploymentContractDocument({ data, logoDataUri, employerSignatureType: signatureType }));
    await persistContractExportChoice(supabaseAdmin, id, signer.id, signatureType);
    const name = filenamePart(`${data.employee.firstNameTH} ${data.employee.lastNameTH}`) || "employee";
    const number = filenamePart(data.contract.contractNo) || "contract";
    // Full application ID disambiguates identical names/numbers across companies.
    const filename = `Contract_${number}.pdf`;
    return { buffer, filename };
  } catch (error) {
    return { error: contractDataErrorResponse(error, "PDF_GENERATION_FAILED", "ไม่สามารถสร้างไฟล์สัญญาจ้างได้") };
  }
}

export function pdfDownload(buffer: Uint8Array, filename: string) {
  return new Response(new Uint8Array(buffer), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="employment-contract.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "no-store",
  } });
}
