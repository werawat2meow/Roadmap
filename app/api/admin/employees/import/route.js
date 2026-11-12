import { NextResponse } from "next/server";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { createSimpleEmployee } from "@/lib/employee/createSimpleEmployee";
import { loadEmployeeListImportMasters, previewEmployeeListImport, publicEmployeeImportRow } from "@/lib/imports/employeeListImport";

export const runtime = "nodejs";
export const maxDuration = 300;
const fail = (error, status = 400) => NextResponse.json({ success: false, error }, { status });

export async function GET() {
  const guard = await requireScopedAccess("ems.employees", "create");
  if (!guard.ok) return guard.response;
  try {
    const masters = await loadEmployeeListImportMasters(guard);
    return NextResponse.json({ success: true, companies: masters.companies }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Employee import options failed", error);
    return fail("โหลดบริษัทไม่สำเร็จ กรุณาลองอีกครั้ง", 500);
  }
}

export async function POST(request) {
  const guard = await requireScopedAccess("ems.employees", "create");
  if (!guard.ok) return guard.response;
  try {
    const form = await request.formData();
    const mode = form.get("mode");
    if (!["preview", "confirm"].includes(mode)) return fail("ขั้นตอนนำเข้าไม่ถูกต้อง");
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function" || !/\.xlsx$/i.test(file.name)) return fail("กรุณาเลือกไฟล์ Excel .xlsx จาก Template");
    if (file.size > 5 * 1024 * 1024) return fail("ไฟล์ต้องมีขนาดไม่เกิน 5 MB");
    const rows = await previewEmployeeListImport(Buffer.from(await file.arrayBuffer()), String(form.get("company_id") || ""), guard);
    const invalidRows = rows.filter((row) => row.errors.length).length;
    const preview = { rows: rows.map(publicEmployeeImportRow), validRows: rows.length - invalidRows, invalidRows };
    if (mode === "preview") return NextResponse.json({ success: true, ...preview });
    // Always revalidate the original file and current permissions before any write.
    if (invalidRows) return NextResponse.json({ success: false, error: "ข้อมูลยังมีข้อผิดพลาด กรุณาแก้ไขไฟล์และตรวจสอบอีกครั้ง", ...preview }, { status: 400 });
    const results = [];
    for (const row of rows) {
      const response = await createSimpleEmployee(row.body, guard, { allowIncompleteOrganization: true });
      const result = await response.json();
      results.push({ ...publicEmployeeImportRow(row), success: response.ok && result.success,
        employeeCode: result.data?.employee_code, initialLogin: result.data?.initial_login,
        errors: result.success ? [] : [result.error || "บันทึกไม่สำเร็จ"] });
    }
    return NextResponse.json({ success: true, completed: true, rows: results,
      importedRows: results.filter((row) => row.success).length,
      failedRows: results.filter((row) => !row.success).length });
  } catch (error) {
    console.error("Employee list import failed", error);
    return fail(error instanceof Error && !error.code ? error.message : "นำเข้าไม่สำเร็จ กรุณาลองอีกครั้ง");
  }
}
