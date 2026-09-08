import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const MODULE = "ems.employee_statutory_profiles";
const TABLE = "employee_statutory_profiles";
const MAX_ROWS = 300;

function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanBoolean(value, fallback = false) {
  const text = cleanText(value).toLowerCase();
  if (["true", "1", "yes", "y", "ใช่"].includes(text)) return true;
  if (["false", "0", "no", "n", "ไม่"].includes(text)) return false;
  return typeof value === "boolean" ? value : fallback;
}

function cleanDate(value) {
  const text = cleanText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function employeeName(employee) {
  return [
    employee?.first_name_th,
    employee?.middle_name_th,
    employee?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function identityFromRow(row, employee) {
  const type = cleanText(row.tax_identity_type).toLowerCase() || "citizen_id";

  if (type === "citizen_id") return cleanNullableText(employee?.citizen_id);
  if (type === "passport") return cleanNullableText(employee?.passport_no);
  return cleanNullableText(row.tax_identification_no);
}

export async function POST(req) {
  try {
    const guard = await requireScopedAccess(MODULE, "import", {
      scopeType: "employee",
    });

    if (!guard.ok) return guard.response;

    const body = await req.json();
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    if (!rows.length) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลสำหรับ Import" },
        { status: 400 }
      );
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        {
          success: false,
          error: `Import ได้สูงสุด ${MAX_ROWS} รายการต่อครั้ง`,
        },
        { status: 400 }
      );
    }

    const employeeCodes = [
      ...new Set(rows.map((row) => cleanText(row.employee_code)).filter(Boolean)),
    ];

    const companyCodes = [
      ...new Set(
        rows
          .flatMap((row) => [
            cleanText(row.tax_withholding_company_code),
            cleanText(row.social_security_company_code),
          ])
          .filter(Boolean)
      ),
    ];

    const [employeesResult, companiesResult] = await Promise.all([
      supabaseAdmin
        .from("employees")
        .select(`
          id,
          employee_code,
          first_name_th,
          middle_name_th,
          last_name_th,
          citizen_id,
          passport_no,
          social_security_no,
          company_id,
          branch_group_id,
          branch_id,
          department_id,
          division_id,
          unit_id
        `)
        .in("employee_code", employeeCodes),
      companyCodes.length
        ? supabaseAdmin
            .from("companies")
            .select("id, company_code")
            .in("company_code", companyCodes)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (employeesResult.error) throw employeesResult.error;
    if (companiesResult.error) throw companiesResult.error;

    const employeeMap = new Map(
      (employeesResult.data || []).map((item) => [item.employee_code, item])
    );
    const companyMap = new Map(
      (companiesResult.data || []).map((item) => [item.company_code, item])
    );

    const targetEmployeeIds = (employeesResult.data || []).map((item) => item.id);

    const activeResult = targetEmployeeIds.length
      ? await supabaseAdmin
          .from(TABLE)
          .select("employee_id")
          .in("employee_id", targetEmployeeIds)
          .eq("status", "active")
      : { data: [], error: null };

    if (activeResult.error) throw activeResult.error;

    const activeEmployeeIds = new Set(
      (activeResult.data || []).map((item) => item.employee_id)
    );

    const result = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    const actorId = guard?.access?.id || null;

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index] || {};
      const rowNo = index + 2;

      try {
        const employeeCode = cleanText(row.employee_code);
        const employee = employeeMap.get(employeeCode);

        if (!employee) throw new Error(`ไม่พบพนักงานรหัส ${employeeCode || "-"}`);

        if (!guard.canAccessEmployee(employee)) {
          throw new Error(`พนักงาน ${employeeCode} อยู่นอก Scope`);
        }

        const status = ["active", "inactive"].includes(
          cleanText(row.status).toLowerCase()
        )
          ? cleanText(row.status).toLowerCase()
          : "active";

        if (status === "active" && activeEmployeeIds.has(employee.id)) {
          throw new Error("มีข้อมูล Active อยู่แล้ว กรุณาแก้ไขรายการเดิม");
        }

        const identityType = ["citizen_id", "passport", "tax_id"].includes(
          cleanText(row.tax_identity_type).toLowerCase()
        )
          ? cleanText(row.tax_identity_type).toLowerCase()
          : "citizen_id";

        const taxIdentificationNo = identityFromRow(
          { ...row, tax_identity_type: identityType },
          employee
        );

        if (!taxIdentificationNo) {
          throw new Error(`ไม่มีข้อมูล Tax Identity สำหรับ ${identityType}`);
        }

        const socialRegistered = cleanBoolean(
          row.social_security_registered,
          false
        );

        const taxCompanyCode = cleanText(row.tax_withholding_company_code);
        const ssoCompanyCode = cleanText(row.social_security_company_code);

        const taxCompany = taxCompanyCode ? companyMap.get(taxCompanyCode) : null;
        const ssoCompany = ssoCompanyCode ? companyMap.get(ssoCompanyCode) : null;

        if (!taxCompanyCode) {
          throw new Error("กรุณาระบุ tax_withholding_company_code");
        }

        if (!taxCompany) {
          throw new Error(`ไม่พบบริษัทนำส่งภาษี ${taxCompanyCode}`);
        }

        if (socialRegistered && !ssoCompany) {
          throw new Error("กรุณาระบุ social_security_company_code ที่ถูกต้อง");
        }

        const socialSecurityNo = socialRegistered
          ? cleanNullableText(row.social_security_no) ||
            cleanNullableText(employee.social_security_no)
          : null;

        if (socialRegistered && !socialSecurityNo) {
          throw new Error("ไม่พบเลขประกันสังคม");
        }

        const rawInsuredType = cleanText(row.insured_type).toLowerCase();
        const insuredType = socialRegistered
          ? ["section_33", "section_39", "section_40", "custom"].includes(
              rawInsuredType
            )
            ? rawInsuredType
            : rawInsuredType
              ? "custom"
              : "section_33"
          : null;

        const payload = {
          employee_id: employee.id,
          tax_identity_type: identityType,
          tax_identification_no: taxIdentificationNo,
          tax_filing_form_code:
            cleanText(row.tax_filing_form_code).toUpperCase() || null,
          tax_withholding_company_id: taxCompany?.id || null,
          tax_resident_status: ["resident", "non_resident"].includes(
            cleanText(row.tax_resident_status).toLowerCase()
          )
            ? cleanText(row.tax_resident_status).toLowerCase()
            : "resident",
          social_security_registered: socialRegistered,
          social_security_no: socialSecurityNo,
          insured_type: socialRegistered ? insuredType : null,
          social_security_company_id: socialRegistered ? ssoCompany?.id || null : null,
          effective_from:
            cleanDate(row.effective_from) || new Date().toISOString().slice(0, 10),
          effective_to: cleanDate(row.effective_to),
          status,
          remark: cleanNullableText(row.remark),
          created_by: actorId,
          updated_by: actorId,
        };

        if (
          payload.effective_to &&
          payload.effective_to < payload.effective_from
        ) {
          throw new Error("effective_to ต้องไม่น้อยกว่า effective_from");
        }

        const { error } = await supabaseAdmin.from(TABLE).insert(payload);
        if (error) throw error;

        if (status === "active") activeEmployeeIds.add(employee.id);
        result.success += 1;
      } catch (rowError) {
        result.failed += 1;
        result.errors.push({
          row: rowNo,
          employee_code: cleanText(row.employee_code),
          error: rowError?.message || "Import ไม่สำเร็จ",
        });
      }
    }

    try {
      await writeActivityLog({
        module_name: "employee_statutory_profiles",
        action_type: "import",
        reference_table: TABLE,
        reference_id: null,
        description: `Import ข้อมูลภาษีและประกันสังคมพนักงาน สำเร็จ ${result.success} / ${result.total} รายการ`,
        new_data: {
          total: result.total,
          success: result.success,
          failed: result.failed,
        },
      });
    } catch (logError) {
      console.error("IMPORT_EMPLOYEE_STATUTORY_PROFILE_LOG_ERROR:", logError);
    }

    return NextResponse.json({
      success: result.failed === 0,
      message:
        result.failed === 0
          ? `Import สำเร็จ ${result.success} รายการ`
          : `Import สำเร็จ ${result.success} รายการ ไม่สำเร็จ ${result.failed} รายการ`,
      data: result,
    });
  } catch (error) {
    console.error("IMPORT_EMPLOYEE_STATUTORY_PROFILES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถ Import ข้อมูลได้",
      },
      { status: 500 }
    );
  }
}
