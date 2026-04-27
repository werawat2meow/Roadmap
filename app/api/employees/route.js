/*
  ข้อมูลพนักงานทั่วไป
  ใช้ดึงข้อมูลพนักงานแบบแบ่งหน้า รองรับ page, pageSize, search
    - เหมาะกับหน้า Table, Dashboard, Popup เลือกพนักงาน
    - รองรับโหลดทีละ 20 รายการ
    - ต้องส่ง x-api-key มาใน header ด้วย เพื่อยืนยันว่าเป็น request จากระบบเราเอง
  
  Header: 
    x-api-key: Value
    URL Params: http://localhost:3000/api/employees?page=1&pageSize=20
    URL Params: http://localhost:3000/api/employees?search=เทส

*/
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { validateApiKey } from "@/lib/validateApiKey";
import { logApiAccess } from "@/lib/logApiAccess";

export async function GET(req) {
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const requestIp =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    null;

  const userAgent = req.headers.get("user-agent") || null;

  const requestQuery = Object.fromEntries(searchParams.entries());

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
    const search = searchParams.get("search")?.trim() || "";

    const rawPage = Number(searchParams.get("page") || 1);
    const rawPageSize = Number(searchParams.get("pageSize") || 20);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const pageSize =
      Number.isFinite(rawPageSize) && rawPageSize > 0
        ? Math.min(Math.floor(rawPageSize), 100)
        : 20;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("employees")
      .select(
        `
          id,
          employee_code,
          first_name_th,
          last_name_th,
          first_name_en,
          last_name_en,
          nick_name,
          phone,
          email,
          employee_photo_url,
          status,
          hire_date,
          employment_type,
          branch_id,
          department_id,
          division_id,
          unit_id,
          position_id,
          branches (
            branch_name
          ),
          departments (
            department_name
          ),
          divisions (
            division_name
          ),
          units (
            unit_name
          ),
          positions (
            position_name,
            position_level
          )
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        [
          `employee_code.ilike.%${search}%`,
          `first_name_th.ilike.%${search}%`,
          `last_name_th.ilike.%${search}%`,
          `first_name_en.ilike.%${search}%`,
          `last_name_en.ilike.%${search}%`,
          `nick_name.ilike.%${search}%`,
          `email.ilike.%${search}%`,
        ].join(",")
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw error;
    }

    const mappedData = (data || []).map((item) => ({
      id: item.id,
      employee_code: item.employee_code,
      full_name_th: `${item.first_name_th || ""} ${item.last_name_th || ""}`.trim(),
      full_name_en: `${item.first_name_en || ""} ${item.last_name_en || ""}`.trim(),
      nick_name: item.nick_name,
      phone: item.phone,
      email: item.email,
      employee_photo_url: item.employee_photo_url || "",
      status: item.status,
      hire_date: item.hire_date,
      employment_type: item.employment_type,
      branch_id: item.branch_id,
      branch_name: item.branches?.branch_name || "-",
      department_id: item.department_id,
      department_name: item.departments?.department_name || "-",
      division_id: item.division_id,
      division_name: item.divisions?.division_name || "-",
      unit_id: item.unit_id,
      unit_name: item.units?.unit_name || "-",
      position_id: item.position_id,
      position_name: item.positions?.position_name || "-",
      position_level: item.positions?.position_level || null,
    }));

    const responseBody = {
      success: true,
      client: {
        id: auth.client.id,
        client_code: auth.client.client_code,
        client_name: auth.client.client_name,
      },
      data: mappedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };

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
        total: count || 0,
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("EMPLOYEES_API_ERROR:", error);

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
      errorMessage: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}