import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   GET
   /api/admin/employees/statutory-companies

   ใช้เฉพาะ Employee Wizard:
   - บริษัทที่ขึ้นทะเบียน / นำส่งประกันสังคม
   - เลขบัญชีนายจ้าง
   - เลขสาขาประกันสังคม

   Permission:
   ems.employees.view

   IMPORTANT:
   - ไม่ Apply Company Scope
   - เพราะ SSO Company สามารถเป็นบริษัทอื่นได้
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       1. Permission
    ===================================================== */

    const guard =
      await requireScopedAccess(
        "ems.employees",
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    /* =====================================================
       2. Load Company Statutory Settings

       Key:
       company_statutory_settings.company_id
       -> companies.id
    ===================================================== */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "company_statutory_settings"
        )
        .select(`
          id,
          company_id,

          sso_employer_account_no,
          sso_branch_no,
          wcf_registration_no,

          effective_from,
          effective_to,

          status,
          remark,

          created_at,
          updated_at,

          companies:companies!company_statutory_settings_company_id_fkey (
            id,
            company_code,
            company_name_th,
            company_name_en,
            tax_id,
            branch_no,
            status
          )
        `)
        .eq(
          "status",
          "active"
        )
        .order(
          "effective_from",
          {
            ascending: false,
          }
        );

    if (error) {
      throw error;
    }

    /* =====================================================
       3. Normalize ให้ Frontend ใช้ง่าย

       company_id = คีย์จริงของ Company
       id         = id ของ statutory setting
    ===================================================== */

    const rows =
      (data || [])
        .filter(
          (item) =>
            item?.companies?.id
        )
        .map(
          (item) => ({
            id:
              item.id,

            company_id:
              item.company_id,

            company_code:
              item.companies
                ?.company_code ||
              "",

            company_name_th:
              item.companies
                ?.company_name_th ||
              "",

            company_name_en:
              item.companies
                ?.company_name_en ||
              "",

            company_status:
              item.companies
                ?.status ||
              null,

            tax_id:
              item.companies
                ?.tax_id ||
              null,

            branch_no:
              item.companies
                ?.branch_no ||
              null,

            sso_employer_account_no:
              item
                .sso_employer_account_no ||
              null,

            sso_branch_no:
              item.sso_branch_no ||
              null,

            wcf_registration_no:
              item
                .wcf_registration_no ||
              null,

            effective_from:
              item.effective_from,

            effective_to:
              item.effective_to,

            status:
              item.status,

            remark:
              item.remark ||
              null,

            created_at:
              item.created_at,

            updated_at:
              item.updated_at,
          })
        );

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(
      "GET_EMPLOYEE_STATUTORY_COMPANIES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดข้อมูลบริษัทประกันสังคมได้",
      },
      {
        status: 500,
      }
    );
  }
}