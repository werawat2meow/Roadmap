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
import { logApiAccess } from "@/lib/logApiAccess";

export async function GET(req) {
  const url = new URL(req.url);

  const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent") || null;
  const requestQuery = Object.fromEntries(url.searchParams.entries());

  const auth = await validateApiKey(req);

  if (!auth.success) {
    await logApiAccess({
      clientId: null,
      tokenId: null,
      method: "GET",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 401,
      isSuccess: false,
      requestQuery,
      errorMessage: "Unauthorized: Invalid or missing API token",
    });

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

    const mappedData = (data || []).map((item) => ({
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
    }));

    await logApiAccess({
      clientId: auth.client.id,
      tokenId: auth.token.id,
      method: "GET",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 200,
      isSuccess: true,
      requestQuery,
      responseBody: {
        success: true,
        count: mappedData.length,
      },
    });

    return NextResponse.json({
      success: true,
      client: {
        id: auth.client.id,
        client_code: auth.client.client_code,
        client_name: auth.client.client_name,
      },
      data: mappedData,
    });
  } catch (error) {
    console.error("MASTER_BRANCHES_API_ERROR:", error);

    await logApiAccess({
      clientId: auth.client?.id || null,
      tokenId: auth.token?.id || null,
      method: "GET",
      endpoint: url.pathname,
      requestIp,
      userAgent,
      statusCode: 500,
      isSuccess: false,
      requestQuery,
      errorMessage: error.message || "ไม่สามารถดึงข้อมูลสังกัดได้",
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลสังกัดได้",
      },
      { status: 500 }
    );
  }
}