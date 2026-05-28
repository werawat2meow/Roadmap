import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret-key");
  const userId = decoded?.user_id;

  if (!userId) return null;

  const { data } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      role_id,
      is_active,
      roles (
        role_code,
        role_name
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (!data || !data.is_active) return null;

  let permissions = [];

  if (data.role_id) {
    const { data: permissionRows } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        permissions (
          permission_code,
          is_active
        )
      `)
      .eq("role_id", data.role_id);

    permissions =
      permissionRows
        ?.map((row) => row.permissions)
        ?.filter((perm) => perm?.is_active)
        ?.map((perm) => perm.permission_code) || [];
  }

  return { ...data, permissions };
}

function hasPermission(user, permission) {
  if (user?.roles?.role_code === "SUPER_ADMIN") return true;
  return user?.permissions?.includes(permission) || false;
}

function getLevelNumber(level) {
  const value = String(level || "").toUpperCase().replace("P", "");
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
}

function isEmployeeMatchedRule(employee, rule) {
  const employeeLevel = getLevelNumber(employee?.positions?.position_level);
  const ruleLevel = getLevelNumber(rule?.position_level);

  if (ruleLevel > 0 && employeeLevel < ruleLevel) return false;

  if (
    rule.employee_status_id &&
    employee.employee_status_id !== rule.employee_status_id
  ) {
    return false;
  }

  if (
    rule.employment_type &&
    employee.employment_type !== rule.employment_type
  ) {
    return false;
  }

  return true;
}

function buildEntitlementRow({ employee, rule, entitlementYear, month }) {
  return {
    employee_id: employee.id,
    benefit_id: rule.benefit_id,
    benefit_rule_id: rule.id,
    entitlement_year: entitlementYear,
    entitlement_month: month,
    quota_amount: rule.is_unlimited ? null : rule.quota_amount,
    used_amount: 0,
    remaining_amount: rule.is_unlimited ? null : rule.quota_amount,
    quota_unit: rule.quota_unit,
    status: "active",
    updated_at: new Date().toISOString(),
  };
}

export async function POST(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const canGenerate = hasPermission(user, "benefit.entitlement.generate") || hasPermission(user, "benefit.entitlement.manage");

    if (!canGenerate) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ Generate Entitlements" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const entitlementYear = Number(body?.year || new Date().getFullYear());

    if (Number.isNaN(entitlementYear) || entitlementYear < 2000) {
      return NextResponse.json(
        { success: false, error: "ปีไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const { data: employees, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        employee_status_id,
        employment_type,
        positions (
          position_level
        )
      `);

    if (employeeError) {
      return NextResponse.json(
        { success: false, error: employeeError.message },
        { status: 500 }
      );
    }

    const { data: rules, error: ruleError } = await supabaseAdmin
      .from("benefit_rules")
      .select(`
        id,
        benefit_id,
        position_level,
        quota_amount,
        quota_unit,
        quota_frequency,
        entitlement_period,
        is_unlimited,
        employee_status_id,
        is_active,
        benefits (
          id,
          benefit_code,
          benefit_name
        )
      `)
      .eq("rule_year", entitlementYear);

    if (ruleError) {
      return NextResponse.json(
        { success: false, error: ruleError.message },
        { status: 500 }
      );
    }

    const rows = [];

    for (const employee of employees || []) {
      for (const rule of rules || []) {
        if (!isEmployeeMatchedRule(employee, rule)) continue;

        const period = rule.entitlement_period || "yearly";

        if (period === "monthly") {
          for (let month = 1; month <= 12; month += 1) {
            rows.push(
              buildEntitlementRow({
                employee,
                rule,
                entitlementYear,
                month,
              })
            );
          }
        } else {
          rows.push(
            buildEntitlementRow({
              employee,
              rule,
              entitlementYear,
              month: 0,
            })
          );
        }
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "ไม่พบสิทธิ์ที่ต้อง Generate",
        inserted: 0,
        data: [],
      });
    }

    const uniqueMap = new Map();

    for (const row of rows) {
      const key = [
        row.employee_id,
        row.benefit_id,
        row.entitlement_year,
        row.entitlement_month ?? 0,
      ].join("|");

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, row);
      }
    }

    const uniqueRows = Array.from(uniqueMap.values());

    const { data, error } = await supabaseAdmin
      .from("benefit_entitlements")
      .upsert(uniqueRows, {
        onConflict:
          "employee_id,benefit_id,entitlement_year,entitlement_month",
      })
      .select();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Generate Entitlements สำเร็จ",
      year: entitlementYear,
      total_employees: employees?.length || 0,
      total_rules: rules?.length || 0,
      prepared: rows.length || 0,
      deduplicated: uniqueRows.length || 0,
      generated: data?.length || 0,
      data,
    });
  } catch (error) {
    console.error("GENERATE_ENTITLEMENTS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Generate Entitlements ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}
