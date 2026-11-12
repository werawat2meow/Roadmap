import { NextResponse } from "next/server";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { loadEmployeeListImportMasters } from "@/lib/imports/employeeListImport";
import { buildEmployeeListTemplate } from "@/lib/imports/employeeListWorkbook";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireScopedAccess("ems.employees", "create");
  if (!guard.ok) return guard.response;
  try {
    const workbook = await buildEmployeeListTemplate(await loadEmployeeListImportMasters(guard));
    return new Response(workbook, { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="employee_import_template.xlsx"',
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    console.error("Employee list template failed", error);
    return NextResponse.json({ success: false, error: "ดาวน์โหลด Template ไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 500 });
  }
}
