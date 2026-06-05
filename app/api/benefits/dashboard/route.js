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

  const { data } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      employee_id,
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

function sumAmount(rows = [], field = "used_amount") {
  return rows.reduce((sum, item) => sum + Number(item?.[field] || 0), 0);
}

function groupSum(rows = [], keyGetter, amountField = "used_amount") {
  const map = new Map();

  for (const item of rows) {
    const key = keyGetter(item) || "ไม่ระบุ";
    const amount = Number(item?.[amountField] || 0);

    map.set(key, (map.get(key) || 0) + amount);
  }

  return Array.from(map.entries())
    .map(([name, total_amount]) => ({
      name,
      total_amount,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
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

    const canView =
      hasPermission(user, "benefit.dashboard.view") ||
      hasPermission(user, "benefit.dashboard.manage");

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดู Dashboard" },
        { status: 403 }
      );
    }

    const [
      totalRequestsResult,
      pendingResult,
      inReviewResult,
      approvedResult,
      rejectedResult,
      cancelledResult,
      paidResult,
      reversedResult,
      totalUsageResult,
      totalBenefitsResult,
      recentRequestsResult,
      usageWithBenefitResult,
      usageByMonthResult,
      usageWithEmployeeResult,
      usageWithOrgResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),

      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "in_review"),

      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),

      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),

      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "cancelled"),

      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "paid"),

      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "reversed"),

      supabaseAdmin
        .from("benefit_usages")
        .select("used_amount"),

      supabaseAdmin
        .from("benefits")
        .select("*", { count: "exact", head: true }),

      supabaseAdmin
        .from("benefit_requests")
        .select(`
          id,
          request_no,
          requested_amount,
          approved_amount,
          request_date,
          status,
          created_at,
          employees (
            employee_code,
            first_name_th,
            last_name_th
          ),
          benefits (
            benefit_code,
            benefit_name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("benefit_usages")
        .select(`
          used_amount,
          usage_date,
          benefits (
            benefit_code,
            benefit_name
          )
        `),

      supabaseAdmin
        .from("benefit_usages")
        .select(`
          used_amount,
          usage_date
        `),

      supabaseAdmin
        .from("benefit_usages")
        .select(`
          employee_id,
          used_amount,
          employees (
            employee_code,
            first_name_th,
            last_name_th
          )
        `),

      supabaseAdmin
        .from("benefit_usages")
        .select(`
          used_amount,
          employees (
            departments (
              department_name
            ),
            branches (
              branch_name
            )
          )
        `),
    ]);

    const totalUsage = sumAmount(totalUsageResult.data || []);

    const summaryByBenefitMap = new Map();

    for (const item of usageWithBenefitResult.data || []) {
      const benefitName = item?.benefits?.benefit_name || "ไม่ระบุ";
      const benefitCode = item?.benefits?.benefit_code || "-";
      const key = `${benefitCode} - ${benefitName}`;

      summaryByBenefitMap.set(
        key,
        (summaryByBenefitMap.get(key) || 0) + Number(item.used_amount || 0)
      );
    }

    const summary_by_benefit = Array.from(summaryByBenefitMap.entries())
      .map(([benefit_name, total_amount]) => ({
        benefit_name,
        total_amount,
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);

    const usageByMonthMap = new Map();

    for (const item of usageByMonthResult.data || []) {
      if (!item.usage_date) continue;

      const month = String(item.usage_date).slice(0, 7);

      usageByMonthMap.set(
        month,
        (usageByMonthMap.get(month) || 0) + Number(item.used_amount || 0)
      );
    }

    const usage_by_month = Array.from(usageByMonthMap.entries())
      .map(([month, total_amount]) => ({
        month,
        total_amount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const topEmployeeMap = new Map();

    for (const item of usageWithEmployeeResult.data || []) {
      const emp = item?.employees;
      const employeeCode = emp?.employee_code || "-";
      const employeeName =
        `${emp?.first_name_th || ""} ${emp?.last_name_th || ""}`.trim() ||
        "ไม่ระบุ";

      const key = `${employeeCode} - ${employeeName}`;

      topEmployeeMap.set(
        key,
        (topEmployeeMap.get(key) || 0) + Number(item.used_amount || 0)
      );
    }

    const top_employees_usage = Array.from(topEmployeeMap.entries())
      .map(([employee_name, total_amount]) => ({
        employee_name,
        total_amount,
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);

    const usage_by_department = groupSum(
      usageWithOrgResult.data || [],
      (item) => item?.employees?.departments?.department_name
    ).slice(0, 10);

    const usage_by_branch = groupSum(
      usageWithOrgResult.data || [],
      (item) => item?.employees?.branches?.branch_name
    ).slice(0, 10);

    return NextResponse.json({
      success: true,

      summary: {
        total_requests: totalRequestsResult.count || 0,
        pending_requests: pendingResult.count || 0,
        in_review_requests: inReviewResult.count || 0,
        approved_requests: approvedResult.count || 0,
        rejected_requests: rejectedResult.count || 0,
        cancelled_requests: cancelledResult.count || 0,
        paid_requests: paidResult.count || 0,
        reversed_requests: reversedResult.count || 0,
        total_usage_amount: totalUsage,
        total_benefits: totalBenefitsResult.count || 0,
      },

      summary_by_status: [
        { status: "pending", total: pendingResult.count || 0 },
        { status: "in_review", total: inReviewResult.count || 0 },
        { status: "approved", total: approvedResult.count || 0 },
        { status: "rejected", total: rejectedResult.count || 0 },
        { status: "cancelled", total: cancelledResult.count || 0 },
        { status: "paid", total: paidResult.count || 0 },
        { status: "reversed", total: reversedResult.count || 0 },
      ],

      recent_requests: recentRequestsResult.data || [],

      summary_by_benefit,
      usage_by_month,
      top_employees_usage,
      usage_by_department,
      usage_by_branch,
    });
  } catch (error) {
    console.error("BENEFIT_DASHBOARD_GET_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: "โหลด Dashboard ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}