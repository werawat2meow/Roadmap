import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
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
        phone,
        email,
        status,
        sort_order,
        created_at,
        updated_at
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        [
          `company_code.ilike.%${search}%`,
          `company_name_th.ilike.%${search}%`,
          `company_name_en.ilike.%${search}%`,
          `tax_id.ilike.%${search}%`,
          `email.ilike.%${search}%`,
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
    const body = await req.json();

    const company_code = body?.company_code?.trim();
    const company_name_th = body?.company_name_th?.trim();
    const company_name_en = body?.company_name_en?.trim() || null;
    const tax_id = body?.tax_id?.trim() || null;
    const phone = body?.phone?.trim() || null;
    const email = body?.email?.trim() || null;
    const status = body?.status || "active";

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
          phone,
          email,
          status,
        },
      ])
      .select(`
        id,
        company_code,
        company_name_th,
        company_name_en,
        tax_id,
        phone,
        email,
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