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

export async function GET(req, { params }) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const canViewAll =
      hasPermission(user, "benefit.request.view") ||
      hasPermission(user, "benefit.request.approve");

    const canViewOwn =
      hasPermission(user, "benefit.request.create") ||
      hasPermission(user, "benefit.request.view_own");

    if (!canViewAll && !canViewOwn) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูคำขอนี้" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_requests")
      .select(`
        id,
        request_no,
        employee_id,
        benefit_id,
        benefit_rule_id,
        requested_amount,
        approved_amount,
        request_date,
        status,
        remark,
        reject_reason,
        created_by,
        approved_by,
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
          description,
          benefit_type
        ),
        benefit_request_attachments (
          id,
          file_name,
          file_path,
          file_url,
          file_type,
          file_size,
          uploaded_by,
          uploaded_at
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "ไม่พบคำขอสวัสดิการ" },
        { status: 404 }
      );
    }

    if (!canViewAll && data.employee_id !== user.employee_id) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูคำขอนี้" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        attachments: data.benefit_request_attachments || [],
      },
    });
  } catch (error) {
    console.error("BENEFIT_REQUEST_DETAIL_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลดรายละเอียดคำขอไม่สำเร็จ" },
      { status: 500 }
    );
  }
}