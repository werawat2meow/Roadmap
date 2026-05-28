import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

const ALLOWED_STATUSES = [
  "draft",
  "pending",
  "in_review",
  "approved",
  "rejected",
  "cancelled",
  "paid",
];

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
      employee_id,
      role_id,
      username,
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

async function findSearchIds(search) {
  if (!search) {
    return { employeeIds: [], benefitIds: [] };
  }

  const [employeeResult, benefitResult] = await Promise.all([
    supabaseAdmin
      .from("employees")
      .select("id")
      .or(
        `employee_code.ilike.%${search}%,first_name_th.ilike.%${search}%,last_name_th.ilike.%${search}%`
      )
      .limit(100),

    supabaseAdmin
      .from("benefits")
      .select("id")
      .or(`benefit_code.ilike.%${search}%,benefit_name.ilike.%${search}%`)
      .limit(100),
  ]);

  return {
    employeeIds: employeeResult.data?.map((item) => item.id) || [],
    benefitIds: benefitResult.data?.map((item) => item.id) || [],
  };
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
      hasPermission(user, "benefit.request.view") ||
      hasPermission(user, "benefit.request.approve");

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูรายการอนุมัติ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const status = (searchParams.get("status") || "").trim().toLowerCase();
    const search = (searchParams.get("search") || "").trim();

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `สถานะไม่ถูกต้อง: ${status}` },
        { status: 400 }
      );
    }

    const { employeeIds, benefitIds } = await findSearchIds(search);

    let query = supabaseAdmin
      .from("benefit_requests")
      .select(`
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
          benefit_name
        )
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const orFilters = [
        `request_no.ilike.%${search}%`,
        `remark.ilike.%${search}%`,
        `reject_reason.ilike.%${search}%`,
      ];

      if (employeeIds.length > 0) {
        orFilters.push(`employee_id.in.(${employeeIds.join(",")})`);
      }

      if (benefitIds.length > 0) {
        orFilters.push(`benefit_id.in.(${benefitIds.join(",")})`);
      }

      query = query.or(orFilters.join(","));
    }

    const { data, error } = await query;

    if (error) {
      console.error("BENEFIT_APPROVALS_GET_QUERY_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      filters: {
        status,
        search,
      },
    });
  } catch (error) {
    console.error("BENEFIT_APPROVALS_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลดข้อมูลอนุมัติไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const requestId = body?.request_id;
    const status = body?.status?.trim()?.toLowerCase();

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ request_id" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "สถานะไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (status === "approved" && !hasPermission(user, "benefit.request.approve")) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์อนุมัติ" },
        { status: 403 }
      );
    }

    if (status === "rejected" && !hasPermission(user, "benefit.request.reject")) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ปฏิเสธคำขอ" },
        { status: 403 }
      );
    }

    const payload = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
      payload.approved_by = user.id;
      payload.approved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_requests")
      .update(payload)
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_APPROVALS_PUT_QUERY_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("BENEFIT_APPROVALS_PUT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "อัปเดตสถานะไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(user, "benefit.request.delete")) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบคำขอ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_requests")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("BENEFIT_APPROVALS_DELETE_QUERY_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("BENEFIT_APPROVALS_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}