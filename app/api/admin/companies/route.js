import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";



import {
  requirePermission,
} from "@/lib/auth/requirePortalAccess";

import {
  applyCompanyScope,
  hasAllAccessScope,
} from "@/lib/auth/applyAccessScope";


export async function GET(req) {
  try {


     /* =====================================================
       1. Permission
    ===================================================== */

    const guard = await requirePermission("ems.companies.view");

    if (!guard.ok) {
      return guard.response;
    }

    
    /* =====================================================
       end Permission
    ===================================================== */


    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    let query = supabaseAdmin
      .from("companies")
      .select(`
        id,
        company_code,
        company_name_th,
        company_name_en,
        tax_id,
        branch_no,

        address,

        country_code,
        province_code,
        province,

        district_code,
        district,

        subdistrict_code,
        subdistrict,

        postcode,

        phone,
        email,
        website,

        logo_url,
        logo_path,

        status,
        sort_order,
        created_at,
        updated_at
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });


    /* =====================================================
       4. Apply Access Scope
          SUPER_ADMIN / all → เห็นทั้งหมด
          company scope
          → เห็นเฉพาะ company ที่ได้รับ
          ไม่มี company scope → []
    ===================================================== */
    query =
      applyCompanyScope(
        query,
        guard.access,
        "id"  
      );
    /* ====================================================
      end Access Scope
    ====================================================== */  

    if (search) {
      query = query.or(
        [
          `company_code.ilike.%${search}%`,
          `company_name_th.ilike.%${search}%`,
          `company_name_en.ilike.%${search}%`,
          `tax_id.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `website.ilike.%${search}%`,
          `address.ilike.%${search}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("GET_COMPANIES_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลบริษัทได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {

    /* =====================================================
       1. Permission
    ===================================================== */

    const guard = await requirePermission("ems.companies.create");
    if (!guard.ok) {
      return guard.response;
    }

    /* =====================================================
       2. Scope
       Create Company เป็นระดับ Root
       จึงต้องมี all scope
    ===================================================== */

    if (!hasAllAccessScope(guard.access)) {
      return NextResponse.json(
        {
          success: false,
          error:"คุณไม่มีขอบเขตสิทธิ์ในการเพิ่มบริษัทใหม่",
        },
        {
          status: 403,
        }
      );
    }
    /* ======================================================
      End Scope
    ======================================================= */


    const body = await req.json();

    const company_code = body?.company_code?.trim();
    const company_name_th = body?.company_name_th?.trim();
    const company_name_en = body?.company_name_en?.trim() || null;
    const tax_id = body?.tax_id?.trim() || null;
    const phone = body?.phone?.trim() || null;
    const email = body?.email?.trim() || null;
    const status = body?.status || "active";
    const branch_no = body?.branch_no?.trim() || null;
    const address = body?.address?.trim() || null;
    const country_code = body?.country_code?.trim() || "TH";
    const province_code = body?.province_code?.trim() || null;
    const province = body?.province?.trim() || null;
    const district_code = body?.district_code?.trim() || null;
    const district = body?.district?.trim() || null;
    const subdistrict_code = body?.subdistrict_code?.trim() || null;
    const subdistrict = body?.subdistrict?.trim() || null;
    const postcode = body?.postcode?.trim() || null;
    const website = body?.website?.trim() || null;
    const logo_url = body?.logo_url?.trim() || null;
    const logo_path = body?.logo_path?.trim() || null;
    const sort_order = Number(body?.sort_order || 0);

    if (!company_code || !company_name_th) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสบริษัทและชื่อบริษัท" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("companies")
      .insert([
        {
          company_code,
          company_name_th,
          company_name_en,
          tax_id,
          branch_no,
          address,
          country_code,
          province_code,
          province,
          district_code,
          district,
          subdistrict_code,
          subdistrict,
          postcode,
          phone,
          email,
          website,
          logo_url,
          logo_path,
          status,
          sort_order,
        },
      ])
      .select(`
        id,
        company_code,
        company_name_th,
        company_name_en,
        tax_id,
        branch_no,
        address,
        country_code,
        province_code,
        province,
        district_code,
        district,
        subdistrict_code,
        subdistrict,
        postcode,
        phone,
        email,
        website,
        logo_url,
        logo_path,
        status,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "รหัสบริษัทนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }
      throw error;
    }

    
    await writeActivityLog({
      module_name: "companies",
      action_type: "create",
      reference_table: "",
      reference_id: data.id,
      description: `เพิ่ม companies ${data.company_code} - ${data.company_name_th}`,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลบริษัทสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("CREATE_COMPANY_ERROR:", error);
    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลบริษัทได้" },
      { status: 500 }
    );
  }
}