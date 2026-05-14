import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

function calcServiceMonths(hireDateValue) {
  if (!hireDateValue) return 0;

  const hireDate = new Date(hireDateValue);
  const today = new Date();

  let months =
    (today.getFullYear() - hireDate.getFullYear()) * 12 +
    (today.getMonth() - hireDate.getMonth());

  if (today.getDate() < hireDate.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
}

function calcServiceYears(serviceMonths) {
  return Math.floor(serviceMonths / 12);
}

function getPositionLevel(employee) {
  return employee?.positions?.position_level || null;
}

function isProbationEmployee(employee) {
  const statusCode =
    employee?.employee_statuses?.status_code?.toLowerCase() || "";
  const statusName =
    employee?.employee_statuses?.status_name?.toLowerCase() || "";

  return (
    statusCode.includes("probation") ||
    statusName.includes("ทดลองงาน") ||
    statusName.includes("probation")
  );
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("employee_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    );

    const userId = decoded?.user_id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: userAccount, error: userError } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        username,
        is_active,
        roles (
          id,
          role_code,
          role_name
        )
      `)
      .eq("id", userId)
      .maybeSingle();

    if (userError) throw userError;

    if (!userAccount || !userAccount.is_active) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!userAccount.employee_id) {
      return NextResponse.json({
        success: true,
        profile: {
          employee_id: null,
          employee_code: null,
          full_name: userAccount.username,
          hire_date: null,
          years_of_service: 0,
          months_of_service: 0,
          position_level: null,
          employee_status: null,
          employment_type: null,
          role_code: userAccount.roles?.role_code || null,
          role_name: userAccount.roles?.role_name || null,
        },
        summary: {
          totalBenefits: 0,
          positionLevel: null,
          yearsOfService: 0,
          monthsOfService: 0,
          probation: false,
          isAdminWithoutEmployee: true,
        },
        benefits: [],
        message:
          "บัญชีนี้ไม่มี employee_id จึงแสดงเฉพาะเมนูจัดการระบบตาม Permission",
      });
    }

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        hire_date,
        employee_status_id,
        employment_type,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,

        positions (
          id,
          position_name,
          position_level
        ),

        employee_statuses (
          id,
          status_code,
          status_name
        )
      `)
      .eq("id", userAccount.employee_id)
      .maybeSingle();

    if (employeeError) throw employeeError;

    if (!employee) {
      return NextResponse.json({
        success: true,
        profile: {
          employee_id: userAccount.employee_id,
          employee_code: null,
          full_name: userAccount.username,
          hire_date: null,
          years_of_service: 0,
          months_of_service: 0,
          position_level: null,
          employee_status: null,
          employment_type: null,
          role_code: userAccount.roles?.role_code || null,
          role_name: userAccount.roles?.role_name || null,
        },
        summary: {
          totalBenefits: 0,
          positionLevel: null,
          yearsOfService: 0,
          monthsOfService: 0,
          probation: false,
          employeeNotFound: true,
        },
        benefits: [],
        message:
          "ไม่พบข้อมูลพนักงานที่ผูกกับบัญชีนี้",
      });
    }

    const serviceMonths = calcServiceMonths(employee.hire_date);
    const yearsOfService = calcServiceYears(serviceMonths);
    const positionLevel = getPositionLevel(employee);
    const isProbation = isProbationEmployee(employee);

    const { data: rules, error: ruleError } = await supabaseAdmin
      .from("benefit_rules")
      .select(`
        id,
        benefit_id,
        position_level,
        employee_status_id,
        employment_type_id,
        min_service_months,
        max_service_months,
        quota_amount,
        quota_unit,
        quota_frequency,
        discount_percent,
        is_unlimited,
        rule_note,
        is_active,

        benefits (
          id,
          benefit_code,
          benefit_name,
          description,
          is_active,
          benefit_categories (
            id,
            category_code,
            category_name
          )
        ),

        employee_statuses (
          id,
          status_code,
          status_name
        ),

        employment_types (
          id,
          type_code,
          type_name
        )
      `)
      .eq("is_active", true);

    if (ruleError) throw ruleError;

    const eligibleBenefits = (rules || []).filter((rule) => {
      if (!rule?.benefits?.is_active) return false;

      const levelMatch =
        !rule.position_level || rule.position_level === positionLevel;

      const statusMatch =
        !rule.employee_status_id ||
        rule.employee_status_id === employee.employee_status_id;

      const employmentTypeMatch =
        !rule.employment_types?.type_code ||
        rule.employment_types.type_code === employee.employment_type;

      const minServiceMatch =
        rule.min_service_months == null ||
        serviceMonths >= Number(rule.min_service_months);

      const maxServiceMatch =
        rule.max_service_months == null ||
        serviceMonths <= Number(rule.max_service_months);

      return (
        levelMatch &&
        statusMatch &&
        employmentTypeMatch &&
        minServiceMatch &&
        maxServiceMatch
      );
    });

    const summary = {
      totalBenefits: eligibleBenefits.length,
      positionLevel,
      yearsOfService,
      monthsOfService: serviceMonths,
      probation: isProbation,
    };

    return NextResponse.json({
      success: true,
      profile: {
        employee_id: employee.id,
        employee_code: employee.employee_code,
        full_name:
          `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim(),
        hire_date: employee.hire_date,
        years_of_service: yearsOfService,
        months_of_service: serviceMonths,
        position_level: positionLevel,
        employee_status: employee.employee_statuses?.status_name || null,
        employment_type: employee.employment_type || null,
        role_code: userAccount.roles?.role_code || null,
        role_name: userAccount.roles?.role_name || null,
      },
      summary,
      benefits: eligibleBenefits,
    });
  } catch (error) {
    console.error("GET_MY_BENEFITS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถโหลดข้อมูลสิทธิ์สวัสดิการได้",
      },
      { status: 500 }
    );
  }
}