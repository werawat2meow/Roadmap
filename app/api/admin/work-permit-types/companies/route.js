import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

/* =========================================================
   GET /api/admin/work-permit-types/companies

   ใช้ Permission ของ Work Permit Types โดยตรง
   เพื่อไม่บังคับให้ User ต้องมี ems.companies.view เพิ่ม

   Scope:
   company
========================================================= */

export async function GET() {
  try {
    const guard =
      await requireScopedAccess(
        "ems.work_permit_types",
        "view",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    let query = supabaseAdmin
      .from("companies")
      .select(
        `
          id,
          company_code,
          company_name_th,
          company_name_en,
          status,
          sort_order
        `
      )
      .eq("status", "active");

    query = guard.applyScope(
      query,
      "id"
    );

    const { data, error } =
      await query
        .order("sort_order", {
          ascending: true,
        })
        .order("company_code", {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        scope_type: "company",
      },
    });
  } catch (error) {
    console.error(
      "GET_WORK_PERMIT_TYPE_COMPANIES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดบริษัทตาม Scope ได้",
      },
      { status: 500 }
    );
  }
}
