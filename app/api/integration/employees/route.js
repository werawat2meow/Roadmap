/*
endpoint สำหรับเชื่อมระบบอื่นโดยเฉพาะ

ใช้สำหรับให้ระบบอื่นเชื่อมข้อมูลพนักงานโดยตรง
  - รองรับ filter เช่น
  - employee_code
  - status
  - branch_id
จะได้ข้อมูลเชิงลึกครบทั้ง
  - สังกัด
  - แผนก
  - ฝ่าย
  - หน่วย
  - ตำแหน่ง
  - สถานะพนักงาน
เหมาะกับระบบ Benefit, HRM, Time Attendance, Payroll
ต้องส่ง x-api-key ที่สร้างจากระบบ Admin มาใน header ด้วย เพื่อยืนยันตัวตนและสิทธิ์การเข้าถึงข้อมูลพนักงาน

Header:
  x-api-key: Value
    GET http://localhost:3000/api/integration/employees
    GET http://localhost:3000/api/integration/employees?employee_code=
    GET http://localhost:3000/api/integration/employees?status=
    GET http://localhost:3000/api/integration/employees?branch_id=

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

    const employee_code = searchParams.get("employee_code")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const branch_id = searchParams.get("branch_id")?.trim() || "";

    let query = supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        nick_name,
        gender,
        phone,
        email,
        employee_photo_url,
        hire_date,
        employment_type,
        nationality,
        status,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        employee_status_id,
        branches (
          branch_code,
          branch_name
        ),
        departments (
          department_code,
          department_name
        ),
        divisions (
          division_code,
          division_name
        ),
        units (
          unit_code,
          unit_name
        ),
        positions (
          position_code,
          position_name,
          position_group,
          position_level
        ),
        employee_statuses (
          status_code,
          status_name,
          color
        )
      `)
      .order("created_at", { ascending: false });

    if (employee_code) {
      query = query.eq("employee_code", employee_code);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (branch_id) {
      query = query.eq("branch_id", branch_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((item) => ({
        id: item.id,
        employee_code: item.employee_code,
        first_name_th: item.first_name_th,
        last_name_th: item.last_name_th,
        first_name_en: item.first_name_en,
        last_name_en: item.last_name_en,
        nick_name: item.nick_name,
        gender: item.gender,
        phone: item.phone,
        email: item.email,
        employee_photo_url: item.employee_photo_url || "",
        nationality: item.nationality,
        hire_date: item.hire_date,
        employment_type: item.employment_type,
        status: item.status,

        branch: {
          id: item.branch_id,
          code: item.branches?.branch_code || null,
          name: item.branches?.branch_name || null,
        },

        department: {
          id: item.department_id,
          code: item.departments?.department_code || null,
          name: item.departments?.department_name || null,
        },

        division: {
          id: item.division_id,
          code: item.divisions?.division_code || null,
          name: item.divisions?.division_name || null,
        },

        unit: {
          id: item.unit_id,
          code: item.units?.unit_code || null,
          name: item.units?.unit_name || null,
        },

        position: {
          id: item.position_id,
          code: item.positions?.position_code || null,
          name: item.positions?.position_name || null,
          group: item.positions?.position_group || null,
          level: item.positions?.position_level || null,
        },

        employee_status: {
          id: item.employee_status_id,
          code: item.employee_statuses?.status_code || null,
          name: item.employee_statuses?.status_name || null,
          color: item.employee_statuses?.color || null,
        },
      })),
    });
  } catch (error) {
    console.error("INTEGRATION_EMPLOYEES_API_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}