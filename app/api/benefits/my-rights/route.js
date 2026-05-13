import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "dev-secret-key"
  );

  const userId = decoded?.user_id;
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      employee_id,
      username,
      is_active,
      roles (
        role_code,
        role_name
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  return data;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!user.employee_id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลพนักงานของผู้ใช้งานนี้" },
        { status: 400 }
      );
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        hire_date,
        employment_type,
        employee_status_id,
        positions (
          id,
          position_name,
          position_level
        ),
        employee_statuses (
          id,
          status_code,
          status_name,
          color
        )
      `)
      .eq("id", user.employee_id)
      .maybeSingle();

    if (employeeError) {
      return NextResponse.json(
        { success: false, error: "โหลดข้อมูลพนักงานไม่สำเร็จ" },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูลพนักงาน" },
        { status: 404 }
      );
    }

    const positionLevel = employee.positions?.position_level || null;
    const employeeStatusId = employee.employee_status_id || null;

    let query = supabaseAdmin
      .from("benefit_rules")
      .select(`
        id,
        benefit_id,
        position_level,
        min_service_months,
        max_service_months,
        quota_amount,
        quota_unit,
        quota_frequency,
        discount_percent,
        is_unlimited,
        rule_note,
        benefits (
          id,
          benefit_code,
          benefit_name,
          description,
          benefit_type,
          active_period,
          benefit_categories (
            category_code,
            category_name
          )
        )
      `)
      .eq("is_active", true);

    if (positionLevel) {
      query = query.or(`position_level.eq.${positionLevel},position_level.is.null`);
    }

    if (employeeStatusId) {
      query = query.or(
        `employee_status_id.eq.${employeeStatusId},employee_status_id.is.null`
      );
    }

    const { data: rules, error: rulesError } = await query;

    if (rulesError) {
      console.error("BENEFIT_MY_RIGHTS_RULES_ERROR:", rulesError);

      return NextResponse.json(
        { success: false, error: "โหลดสิทธิ์สวัสดิการไม่สำเร็จ" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        employee,
        rights: rules || [],
      },
    });
  } catch (error) {
    console.error("BENEFIT_MY_RIGHTS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดในการโหลดสิทธิ์สวัสดิการ" },
      { status: 500 }
    );
  }
}