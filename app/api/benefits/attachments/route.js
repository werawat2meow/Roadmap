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
      is_active,
      roles (
        role_code
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
      hasPermission(user, "benefit.attachment.view") ||
      hasPermission(user, "benefit.attachment.manage");

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูไฟล์แนบ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.min(
      Math.max(Number(searchParams.get("pageSize") || 10), 1),
      100
    );
    const search = searchParams.get("search")?.trim() || "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let requestIds = [];

    if (search) {
      const { data: requests } = await supabaseAdmin
        .from("benefit_requests")
        .select("id")
        .ilike("request_no", `%${search}%`)
        .limit(100);

      requestIds = requests?.map((item) => item.id) || [];
    }

    let query = supabaseAdmin
      .from("benefit_request_attachments")
      .select(
        `
        id,
        benefit_request_id,
        file_name,
        file_path,
        file_url,
        file_type,
        file_size,
        uploaded_by,
        uploaded_at,
        benefit_requests (
          id,
          request_no,
          employee_id,
          employees (
            id,
            employee_code,
            first_name_th,
            last_name_th
          )
        )
      `,
        { count: "exact" }
      );

    if (search) {
      const orFilters = [`file_name.ilike.%${search}%`];

      if (requestIds.length > 0) {
        orFilters.push(`benefit_request_id.in.(${requestIds.join(",")})`);
      }

      query = query.or(orFilters.join(","));
    }

    const { data, error, count } = await query
      .order("uploaded_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("BENEFIT_ATTACHMENTS_GET_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("BENEFIT_ATTACHMENTS_GET_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "โหลดไฟล์แนบไม่สำเร็จ" },
      { status: 500 }
    );
  }
}