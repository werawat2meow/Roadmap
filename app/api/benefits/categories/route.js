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

  const { data, error } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      employee_id,
      role_id,
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

  if (error || !data || !data.is_active) return null;

  let permissions = [];

  if (data.role_id) {
    const { data: permissionRows } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        permission_id,
        permissions (
          id,
          permission_code,
          permission_name,
          module_code,
          action_code,
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

  return {
    ...data,
    permissions,
  };
}

function hasPermission(user, permission) {
  const roleCode = user?.roles?.role_code || user?.role_code;

  if (roleCode === "SUPER_ADMIN") return true;

  return user?.permissions?.includes(permission) || false;
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

    if (
      !hasPermission(user, "benefit.category.view") &&
      !hasPermission(user, "benefit.category.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูข้อมูลหมวดหมู่สวัสดิการ" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_categories")
      .select(`
        id,
        category_code,
        category_name,
        description,
        sort_order,
        is_active,
        created_at,
        updated_at
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BENEFIT_CATEGORY_GET_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFIT_CATEGORY_GET_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "โหลดข้อมูลหมวดหมู่สวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
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

    if (
      !hasPermission(user, "benefit.category.create") &&
      !hasPermission(user, "benefit.category.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์เพิ่มหมวดหมู่สวัสดิการ" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const payload = {
      category_code: body.category_code,
      category_name: body.category_name,
      description: body.description || null,
      sort_order: Number(body.sort_order || 0),
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (!payload.category_code || !payload.category_name) {
      return NextResponse.json(
        { success: false, error: "กรุณาระบุรหัสและชื่อหมวดหมู่" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_categories")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_CATEGORY_POST_ERROR:", error);

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
    console.error("BENEFIT_CATEGORY_POST_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "เพิ่มหมวดหมู่สวัสดิการไม่สำเร็จ" },
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

    if (
      !hasPermission(user, "benefit.category.update") &&
      !hasPermission(user, "benefit.category.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์แก้ไขหมวดหมู่สวัสดิการ" },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id หมวดหมู่" },
        { status: 400 }
      );
    }

    const payload = {
      category_code: body.category_code,
      category_name: body.category_name,
      description: body.description || null,
      sort_order: Number(body.sort_order || 0),
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("benefit_categories")
      .update(payload)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("BENEFIT_CATEGORY_PUT_ERROR:", error);

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
    console.error("BENEFIT_CATEGORY_PUT_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "แก้ไขหมวดหมู่สวัสดิการไม่สำเร็จ" },
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

    if (
      !hasPermission(user, "benefit.category.delete") &&
      !hasPermission(user, "benefit.category.manage")
    ) {
      return NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ลบหมวดหมู่สวัสดิการ" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ id หมวดหมู่" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("BENEFIT_CATEGORY_DELETE_ERROR:", error);

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("BENEFIT_CATEGORY_DELETE_FATAL:", error);

    return NextResponse.json(
      { success: false, error: "ลบหมวดหมู่สวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}