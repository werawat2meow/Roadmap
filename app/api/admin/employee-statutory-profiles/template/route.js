import { NextResponse } from "next/server";

import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const MODULE = "ems.employee_statutory_profiles";

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const guard = await requireScopedAccess(MODULE, "import", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const headers = [
      "employee_code",
      "tax_identity_type",
      "tax_identification_no",
      "tax_filing_form_code",
      "tax_withholding_company_code",
      "tax_resident_status",
      "social_security_registered",
      "social_security_no",
      "insured_type",
      "social_security_company_code",
      "effective_from",
      "effective_to",
      "status",
      "remark",
    ];

    const sample = [
      "EMP00001",
      "citizen_id",
      "",
      "PND91",
      "COMP001",
      "resident",
      "true",
      "1234567890123",
      "section_33",
      "COMP002",
      new Date().toISOString().slice(0, 10),
      "",
      "active",
      "ตัวอย่าง: บริษัทภาษีและประกันสังคมสามารถเป็นคนละนิติบุคคล",
    ];

    const csv = `\uFEFF${headers.map(csvCell).join(",")}\r\n${sample
      .map(csvCell)
      .join(",")}\r\n`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="employee-statutory-profiles-template.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("EMPLOYEE_STATUTORY_TEMPLATE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถดาวน์โหลด Template ได้",
      },
      { status: 500 }
    );
  }
}
