import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    );

    const { data } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        role_id,
        username,
        is_active,
        roles (
          role_code,
          role_name
        )
      `)
      .eq("id", decoded.user_id)
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
  } catch {
    return null;
  }
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
      hasPermission(user, "benefit.audit.view") ||
      hasPermission(user, "benefit.audit.manage");

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดู Audit Logs" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);
    const moduleName = searchParams.get("module_name") || "";
    const actionType = searchParams.get("action_type") || "";
    const search = (searchParams.get("search") || "").trim();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("benefit_audit_logs")
      .select(
        `
          id,
          module_name,
          action_type,
          ref_table,
          ref_id,
          description,
          old_data,
          new_data,
          created_by,
          created_by_name,
          ip_address,
          user_agent,
          created_at
        `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (moduleName) {
      query = query.eq("module_name", moduleName);
    }

    if (actionType) {
      query = query.eq("action_type", actionType);
    }

    if (search) {
      query = query.or(
        `module_name.ilike.%${search}%,action_type.ilike.%${search}%,description.ilike.%${search}%,created_by_name.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFIT_AUDIT_LOG_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลด Audit Logs ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}