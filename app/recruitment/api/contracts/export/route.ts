import { withActivity } from "@/app/recruitment/lib/activity/server";
import { isEmployerSignatureType } from "@/app/recruitment/components/pdf/employment-contract/types";
import { isValidContractIdentifier, contractErrorResponse } from "@/app/recruitment/lib/contracts/contractApi";
import { exportContractPdf, pdfDownload } from "@/app/recruitment/lib/contracts/exportContract";
import { createContractArchive, type ContractExportResult } from "@/app/recruitment/lib/contracts/contractArchive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handlePOST(request: Request) {
  let body;
  try { body = await request.json(); } catch { return contractErrorResponse("INVALID_REQUEST_BODY", "รูปแบบข้อมูลไม่ถูกต้อง", 400); }
  const ids = body?.applicationIds;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > 20 || !ids.every(isValidContractIdentifier) ||
    new Set(ids.map((id: string) => id.toLowerCase())).size !== ids.length ||
    !isValidContractIdentifier(body.signerId) || !isEmployerSignatureType(body.employerSignatureType)) {
    return contractErrorResponse("INVALID_REQUEST_BODY", "เลือก 1–20 ใบสมัครที่ไม่ซ้ำ พร้อมผู้ลงนามและประเภทผู้ลงนาม", 400);
  }
  const files: { filename: string; buffer: Uint8Array }[] = [];
  const results: ContractExportResult[] = [];
  let bytes = 0;
  for (const id of ids) {
    const item = await exportContractPdf(id, body.signerId, body.employerSignatureType, request.url);
    if (item.error) {
      const failure = await item.error.json();
      results.push({ application_id: id, success: false, code: failure.error, message: failure.message });
      continue;
    }
    if (bytes + item.buffer.length > 100 * 1024 * 1024) {
      results.push({ application_id: id, success: false, code: "SIZE_LIMIT", message: "ไฟล์รวมเกิน 100 MB กรุณาแบ่งส่งออกชุดเล็กลง" });
      continue;
    }
    bytes += item.buffer.length;
    files.push({ filename: item.filename, buffer: item.buffer });
    results.push({ application_id: id, success: true, filename: item.filename });
  }
  if (!files.length) return Response.json({ message: "ส่งออกไม่สำเร็จทุกรายการ", results }, { status: 422, headers: { "Cache-Control": "no-store" } });
  if (ids.length === 1) return pdfDownload(files[0].buffer, files[0].filename);
  const zip = await createContractArchive(files, results);
  return new Response(new Uint8Array(zip), { headers: {
    "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="employment-contracts.zip"',
    "Cache-Control": "no-store", "X-Contract-Succeeded": String(files.length), "X-Contract-Failed": String(ids.length - files.length),
  } });
}

export const POST = withActivity(handlePOST, { page_path: "/recruitment/approve_employees", action: "EXPORT", resource_type: "employment_contract" });
