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

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const canView =
      hasPermission(user, "benefit.dashboard.view") ||
      hasPermission(user, "benefit.dashboard.manage");

    if (!canView) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่มีสิทธิ์ดู Dashboard",
        },
        {
          status: 403,
        }
      );
    }

    const [
      totalRequestsResult,
      pendingResult,
      approvedResult,
      rejectedResult,
      totalUsageResult,
      recentRequestsResult,
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
        .eq("status", "approved"),

      supabaseAdmin
        .from("benefit_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected"),

      supabaseAdmin
        .from("benefit_usages")
        .select("used_amount"),

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
    ]);

    const totalUsage =
      totalUsageResult.data?.reduce(
        (sum, item) => sum + Number(item.used_amount || 0),
        0
      ) || 0;

    return NextResponse.json({
      success: true,

      summary: {
        total_requests: totalRequestsResult.count || 0,
        pending_requests: pendingResult.count || 0,
        approved_requests: approvedResult.count || 0,
        rejected_requests: rejectedResult.count || 0,
        total_usage_amount: totalUsage,
      },

      recent_requests: recentRequestsResult.data || [],
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