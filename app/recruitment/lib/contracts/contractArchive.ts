import JSZip from "jszip";

export type ContractExportResult = {
  application_id: string;
  success: boolean;
  filename?: string;
  message?: string;
  code?: string;
};

export async function createContractArchive(files: { filename: string; buffer: Uint8Array }[], results: ContractExportResult[]) {
  const zip = new JSZip();
  for (const file of files) zip.file(file.filename, file.buffer);
  const report = { requested: results.length, succeeded: files.length, failed: results.filter(item => !item.success).length, results };
  zip.file("export-results.json", JSON.stringify(report, null, 2));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
