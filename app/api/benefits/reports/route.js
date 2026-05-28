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

export async function GET(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const canView =
      hasPermission(user, "benefit.report.view") ||
      hasPermission(user, "benefit.report.manage");

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูรายงานสวัสดิการ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 20), 1),
      100
    );

    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const benefitId = searchParams.get("benefitId") || "";
    const status = (searchParams.get("status") || "").trim().toLowerCase();

    const allowedStatuses = [
      "draft",
      "pending",
      "in_review",
      "approved",
      "rejected",
      "cancelled",
      "paid",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `สถานะไม่ถูกต้อง: ${status}` },
        { status: 400 }
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("benefit_requests")
      .select(
        `
        id,
        request_no,
        employee_id,
        benefit_id,
        requested_amount,
        approved_amount,
        request_date,
        status,
        remark,
        reject_reason,
        approved_at,
        created_at,
        updated_at,
        employees (
          id,
          employee_code,
          first_name_th,
          last_name_th
        ),
        benefits (
          id,
          benefit_code,
          benefit_name,
          benefit_type
        )
      `,
        { count: "exact" }
      );

    if (dateFrom) {
      query = query.gte("request_date", dateFrom);
    }

    if (dateTo) {
      query = query.lte("request_date", dateTo);
    }

    if (benefitId) {
      query = query.eq("benefit_id", benefitId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query
      .order("request_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("BENEFIT_REPORT_GET_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = data || [];

    const totalRequestedAmount = rows.reduce(
      (sum, item) => sum + Number(item.requested_amount || 0),
      0
    );

    const totalApprovedAmount = rows.reduce(
      (sum, item) => sum + Number(item.approved_amount || 0),
      0
    );

    return NextResponse.json({
      success: true,
      data: rows,
      total: count || 0,
      page,
      pageSize,
      summary: {
        row_count: rows.length,
        total_requested_amount: totalRequestedAmount,
        total_approved_amount: totalApprovedAmount,
      },
      filters: {
        dateFrom,
        dateTo,
        benefitId,
        status,
      },
    });
  } catch (error) {
    console.error("BENEFIT_REPORT_GET_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "โหลดรายงานสวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}