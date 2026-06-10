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

async function createAuditLog({req,user,actionType,refId = null,description,oldData = null,newData = null,}) {
  try {
    await supabaseAdmin.from("benefit_audit_logs").insert({
      module_name: "entitlement",
      action_type: actionType,
      ref_table: "benefit_entitlements",
      ref_id: refId,
      description,
      old_data: oldData,
      new_data: newData,
      created_by: user?.id || null,
      created_by_name: user?.username || null,
      ip_address:
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        null,
      user_agent: req.headers.get("user-agent") || null,
    });
  } catch (error) {
    console.error("CREATE_ENTITLEMENT_AUDIT_LOG_ERROR:", error);
  }
}

function getLevelNumber(level) {
  const value = String(level || "").toUpperCase().replace("P", "");
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
}

function getServiceMonths(hireDate) {
  if (!hireDate) return 0;

  const start = new Date(hireDate);
  const now = new Date();

  return (
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  );
}

function getAgeYears(birthDate) {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
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

function isEmployeeMatchedPolicy(employee, policy) {
  const employeeLevel = getLevelNumber(employee?.positions?.position_level);
  const policyLevel = getLevelNumber(policy?.position_level);

  if (policyLevel > 0 && employeeLevel < policyLevel) return false;

  if (policy.branch_id && employee.branch_id !== policy.branch_id) return false;
  if (policy.department_id && employee.department_id !== policy.department_id)
    return false;
  if (policy.division_id && employee.division_id !== policy.division_id)
    return false;
  if (policy.unit_id && employee.unit_id !== policy.unit_id) return false;

  if (
    policy.employee_status_id &&
    employee.employee_status_id !== policy.employee_status_id
  ) {
    return false;
  }

  if (
    policy.employment_type_id &&
    employee.employment_type_id !== policy.employment_type_id
  ) {
    return false;
  }

  const serviceMonths = getServiceMonths(employee.hire_date);

  if (
    policy.min_service_months !== null &&
    policy.min_service_months !== undefined &&
    serviceMonths < Number(policy.min_service_months)
  ) {
    return false;
  }

  if (
    policy.max_service_months !== null &&
    policy.max_service_months !== undefined &&
    serviceMonths > Number(policy.max_service_months)
  ) {
    return false;
  }

  const age = getAgeYears(employee.birth_date);

  if (
    age !== null &&
    policy.min_age !== null &&
    policy.min_age !== undefined &&
    age < Number(policy.min_age)
  ) {
    return false;
  }

  if (
    age !== null &&
    policy.max_age !== null &&
    policy.max_age !== undefined &&
    age > Number(policy.max_age)
  ) {
    return false;
  }

  return true;
}

function buildEntitlementRow({employee,rule,entitlementYear,month,sourceType = "rule",}) {
  return {
    employee_id: employee.id,
    benefit_id: rule.benefit_id,
    benefit_rule_id: rule.benefit_rule_id || rule.id || null,
    entitlement_year: entitlementYear,
    entitlement_month: month,
    quota_amount: rule.is_unlimited ? null : rule.quota_amount,
    used_amount: 0,
    remaining_amount: rule.is_unlimited ? null : rule.quota_amount,
    quota_unit: rule.quota_unit,
    status: "active",
    updated_at: new Date().toISOString(),

    source_type: sourceType,
    priority: rule.priority || 100,
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

    const canGenerate =
      hasPermission(user, "benefit.entitlement.generate") ||
      hasPermission(user, "benefit.entitlement.manage");

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
        hire_date,
        birth_date,
        branch_id,
        department_id,
        division_id,
        unit_id,
        employee_status_id,
        employment_type,
        positions (
          position_level
        )
      `)
      .eq("status", "active");

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
      .eq("rule_year", entitlementYear)
      .eq("is_active", true);

    if (ruleError) {
      return NextResponse.json(
        { success: false, error: ruleError.message },
        { status: 500 }
      );
    }

    const { data: policies, error: policyError } = await supabaseAdmin
      .from("benefit_policy_rules")
      .select(`
        id,
        benefit_id,
        policy_name,
        policy_code,
        rule_year,
        position_level,
        employee_status_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        min_service_months,
        max_service_months,
        min_age,
        max_age,
        quota_amount,
        quota_unit,
        quota_frequency,
        is_unlimited,
        priority,
        is_active,
        benefits (
          id,
          benefit_code,
          benefit_name
        )
      `)
      .eq("rule_year", entitlementYear)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    if (policyError) {
      return NextResponse.json(
        { success: false, error: policyError.message },
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
                sourceType: "rule",
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
              sourceType: "rule",
            })
          );
        }
      }
    }

    for (const employee of employees || []) {
      for (const policy of policies || []) {
        if (!isEmployeeMatchedPolicy(employee, policy)) continue;

        const period = policy.quota_frequency || "yearly";

        const policyRule = {
          ...policy,
          id: null,
          entitlement_period: period === "monthly" ? "monthly" : "yearly",
        };

        if (period === "monthly") {
          for (let month = 1; month <= 12; month += 1) {
            rows.push(
              buildEntitlementRow({
                employee,
                rule: policyRule,
                entitlementYear,
                month,
                sourceType: "policy",
              })
            );
          }
        } else {
          rows.push(
            buildEntitlementRow({
              employee,
              rule: policyRule,
              entitlementYear,
              month: 0,
              sourceType: "policy",
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

    rows.sort((a, b) => {
      const sourceA = a.source_type === "policy" ? 0 : 1;
      const sourceB = b.source_type === "policy" ? 0 : 1;

      if (sourceA !== sourceB) return sourceA - sourceB;

      return Number(a.priority || 100) - Number(b.priority || 100);
    });

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

    const uniqueRows = Array.from(uniqueMap.values()).map(
      ({ source_type, priority, ...row }) => row
    );

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

    await createAuditLog({
      req,
      user,
      actionType: "generate",
      description: `Generate Entitlements ปี ${entitlementYear}`,
      oldData: null,
      newData: {
        year: entitlementYear,
        total_employees: employees?.length || 0,
        total_rules: rules?.length || 0,
        total_policies: policies?.length || 0,
        prepared: rows.length || 0,
        deduplicated: uniqueRows.length || 0,
        generated: data?.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Generate Entitlements สำเร็จ",
      year: entitlementYear,
      total_employees: employees?.length || 0,
      total_rules: rules?.length || 0,
      total_policies: policies?.length || 0,
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