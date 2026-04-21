/*
  ข้อมูล master data สังกัด / บริษัท / สาขา

ใช้เป็น Master Data กลางสำหรับดึงข้อมูลสังกัด / บริษัท / สาขา
  - ระบบอื่นสามารถเรียกไปทำ dropdown เลือกสังกัดได้
  - ใช้เฉพาะ GET
  - ต้องส่ง x-api-key มาใน header ด้วย


  URL: GET http://localhost:3000/api/master/branches
*/
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { validateApiKey } from "@/lib/validateApiKey";

export async function GET(req) {
  const auth = validateApiKey(req);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("branches")
      .select(`
        id,
        branch_code,
        branch_name,
        company_id,
        phone,
        status,
        created_at,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((item) => ({
        id: item.id,
        branch_code: item.branch_code,
        branch_name: item.branch_name,
        company_id: item.company_id,
        company_code: item.companies?.company_code || "",
        company_name:
          item.companies?.company_name_th ||
          item.companies?.company_name_en ||
          "-",
        phone: item.phone,
        status: item.status,
        created_at: item.created_at,
      })),
    });
  } catch (error) {
    console.error("MASTER_BRANCHES_API_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลสังกัดได้",
      },
      { status: 500 }
    );
  }
}