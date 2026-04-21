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

export async function GET(req) {
  const auth = validateApiKey(req);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);

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

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((item) => ({
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
      })),
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("EMPLOYEES_API_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}