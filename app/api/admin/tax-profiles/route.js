import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
 * GET
 * ========================================================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const all =
      searchParams.get("all") === "true";

    const page =
      Number(searchParams.get("page")) || 1;

    const pageSize =
      Number(searchParams.get("pageSize")) || 20;

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status")?.trim() || "";

    const companyId =
      searchParams.get("company_id")?.trim() || "";

    const taxYear =
      searchParams.get("tax_year")?.trim() || "";

    /* ===========================================
       Summary
    =========================================== */

    const { count: totalCount } =
      await supabaseAdmin
        .from("tax_profiles")
        .select("*", {
          count: "exact",
          head: true,
        });

    const { count: activeCount } =
      await supabaseAdmin
        .from("tax_profiles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "active");

    const { count: inactiveCount } =
      await supabaseAdmin
        .from("tax_profiles")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "inactive");

    const summary = {
      total: totalCount || 0,
      active: activeCount || 0,
      inactive: inactiveCount || 0,
    };

    /* ===========================================
       Query
    =========================================== */

    let query = supabaseAdmin
      .from("tax_profiles")
      .select(
        `
        *,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `,
        {
          count: "exact",
        }
      );

    /* ===========================================
       Search
    =========================================== */

    if (search) {
      query = query.or(
        [
          `tax_profile_code.ilike.%${search}%`,
          `tax_profile_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* ===========================================
       Filters
    =========================================== */

    if (status) {
      query = query.eq("status", status);
    }

    if (companyId) {
      query = query.eq(
        "company_id",
        companyId
      );
    }

    if (taxYear) {
      query = query.eq(
        "tax_year",
        Number(taxYear)
      );
    }

    /* ===========================================
       Sort
    =========================================== */

    query = query
      .order("sort_order", {
        ascending: true,
      })
      .order("tax_year", {
        ascending: false,
      })
      .order("tax_profile_code", {
        ascending: true,
      });

    /* ===========================================
       all=true
    =========================================== */

    if (all) {
      const {
        data,
        error,
      } = await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        summary,
      });
    }

    /* ===========================================
       Pagination
    =========================================== */

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    const {
      data,
      error,
      count,
    } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,

      data,

      summary,

      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil(
          (count || 0) / pageSize
        ),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to fetch tax profiles",
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================================================
 * POST
 * ========================================================= */
export async function POST(req) {
  try {
    const body = await req.json();

    /* ===========================================
       Payload
    =========================================== */

    const payload = {
      tax_profile_code:
        body?.tax_profile_code?.trim()?.toUpperCase(),

      tax_profile_name:
        body?.tax_profile_name?.trim(),

      description:
        body?.description?.trim() || null,

      tax_year:
        Number(body?.tax_year),

      company_id:
        body?.company_id || null,

      calculation_method:
        body?.calculation_method || "progressive",

      personal_allowance:
        Number(body?.personal_allowance || 60000),

      spouse_allowance:
        Number(body?.spouse_allowance || 0),

      child_allowance:
        Number(body?.child_allowance || 0),

      parent_allowance:
        Number(body?.parent_allowance || 0),

      social_security_max:
        Number(body?.social_security_max || 9000),

      provident_fund_max:
        Number(body?.provident_fund_max || 500000),

      effective_from:
        body?.effective_from || null,

      effective_to:
        body?.effective_to || null,

      status:
        body?.status || "active",

      sort_order:
        Number(body?.sort_order || 0),
    };

    /* ===========================================
       Validation
    =========================================== */

    if (!payload.tax_profile_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสโปรไฟล์ภาษี",
        },
        { status: 400 }
      );
    }

    if (!payload.tax_profile_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อโปรไฟล์ภาษี",
        },
        { status: 400 }
      );
    }

    if (!payload.tax_year) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุปีภาษี",
        },
        { status: 400 }
      );
    }

    /* ===========================================
       Duplicate Code
    =========================================== */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("tax_profiles")
      .select("id")
      .eq(
        "tax_profile_code",
        payload.tax_profile_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสโปรไฟล์ภาษีนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ===========================================
       Duplicate Name
    =========================================== */

    const {
      data: duplicateName,
    } = await supabaseAdmin
      .from("tax_profiles")
      .select("id")
      .ilike(
        "tax_profile_name",
        payload.tax_profile_name
      )
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อโปรไฟล์ภาษีนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ===========================================
       Insert
    =========================================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("tax_profiles")
      .insert(payload)
      .select(
        `
        *,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `
      )
      .single();

    if (error) throw error;

    /* ===========================================
       Activity Log
    =========================================== */

    try {
      await writeActivityLog({
        module_name: "Tax Profiles",
        action_type: "CREATE",

        reference_table: "tax_profiles",

        reference_id: data.id,

        description: `สร้างโปรไฟล์ภาษี ${data.tax_profile_code} : ${data.tax_profile_name}`,

        old_data: null,

        new_data: data,
      });
    } catch (logError) {
      console.error(
        "Activity Log Error:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "เพิ่มโปรไฟล์ภาษีเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to create tax profile",
      },
      {
        status: 500,
      }
    );
  }
}
