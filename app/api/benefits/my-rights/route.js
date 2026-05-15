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

  if (error || !data || !data.is_active) {
    return null;
  }

  return data;
}

function getServiceMonths(hireDate) {
  if (!hireDate) return 0;

  const start = new Date(hireDate);
  const now = new Date();

  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  if (now.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

function filterByServiceMonths(rules, serviceMonths) {
  return (rules || []).filter((rule) => {
    const min = rule.min_service_months;
    const max = rule.max_service_months;

    if (
      min !== null &&
      min !== undefined &&
      serviceMonths < Number(min)
    ) {
      return false;
    }

    if (
      max !== null &&
      max !== undefined &&
      serviceMonths > Number(max)
    ) {
      return false;
    }

    return true;
  });
}

function pickBestRulePerBenefit(rules, employee) {
  const map = new Map();

  const positionLevel =
    employee?.positions?.position_level || null;

  const employeeStatusId =
    employee?.employee_status_id || null;

  for (const rule of rules || []) {
    const benefitId =
      rule.benefit_id || rule.benefits?.id;

    if (!benefitId) continue;

    const score =
      (rule.position_level === positionLevel ? 10 : 0) +
      (rule.employee_status_id === employeeStatusId ? 10 : 0) +
      Number(rule.min_service_months || 0);

    const current = map.get(benefitId);

    const currentScore = current
      ? (current.position_level === positionLevel ? 10 : 0) +
        (current.employee_status_id === employeeStatusId ? 10 : 0) +
        Number(current.min_service_months || 0)
      : -1;

    if (!current || score > currentScore) {
      map.set(benefitId, rule);
    }
  }

  return Array.from(map.values());
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (!user.employee_id) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลพนักงานของผู้ใช้งานนี้",
        },
        { status: 400 }
      );
    }

    const { data: employee, error: employeeError } =
      await supabaseAdmin
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
      console.error(
        "BENEFIT_MY_RIGHTS_EMPLOYEE_ERROR:",
        employeeError
      );

      return NextResponse.json(
        {
          success: false,
          error: "โหลดข้อมูลพนักงานไม่สำเร็จ",
        },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลพนักงาน",
        },
        { status: 404 }
      );
    }

    const currentYear = new Date().getFullYear();

    const serviceMonths = getServiceMonths(
      employee.hire_date
    );

    const positionLevel =
      employee.positions?.position_level || null;

    const employeeStatusId =
      employee.employee_status_id || null;

    let query = supabaseAdmin
      .from("benefit_rules")
      .select(`
        id,
        benefit_id,
        employee_status_id,
        employment_type_id,
        position_level,
        min_service_months,
        max_service_months,
        quota_amount,
        quota_unit,
        quota_frequency,
        discount_percent,
        is_unlimited,
        rule_note,
        rule_year,
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
      .eq("is_active", true)
      .eq("rule_year", currentYear);

    if (positionLevel) {
      query = query.or(
        `position_level.eq.${positionLevel},position_level.is.null`
      );
    }

    if (employeeStatusId) {
      query = query.or(
        `employee_status_id.eq.${employeeStatusId},employee_status_id.is.null`
      );
    }

    const { data: rules, error: rulesError } =
      await query;

    if (rulesError) {
      console.error(
        "BENEFIT_MY_RIGHTS_RULES_ERROR:",
        rulesError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            rulesError.message ||
            "โหลดสิทธิ์สวัสดิการไม่สำเร็จ",
        },
        { status: 500 }
      );
    }

    const serviceMatchedRules =
      filterByServiceMonths(
        rules || [],
        serviceMonths
      );

    const uniqueRights =
      pickBestRulePerBenefit(
        serviceMatchedRules,
        employee
      );

    return NextResponse.json({
      success: true,
      data: {
        employee,
        year: currentYear,
        serviceMonths,
        rights: uniqueRights,
      },
    });
  } catch (error) {
    console.error(
      "BENEFIT_MY_RIGHTS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "เกิดข้อผิดพลาดในการโหลดสิทธิ์สวัสดิการ",
      },
      { status: 500 }
    );
  }
}