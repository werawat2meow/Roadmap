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

  const { data, error } = await supabaseAdmin
    .from("user_accounts")
    .select(`
      id,
      is_active,
      role_permissions (
        permissions (
          permission_code
        )
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  const permissions =
    data.role_permissions
      ?.map((item) => item.permissions?.permission_code)
      ?.filter(Boolean) || [];

  return { ...data, permissions };
}

function hasPermission(user, permission) {
  return user?.permissions?.includes(permission);
}

export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(user, "benefit.category.edit")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const category_code = body?.category_code?.trim().toUpperCase();
    const category_name = body?.category_name?.trim();

    if (!category_code) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Category Code" },
        { status: 400 }
      );
    }

    if (!category_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Category Name" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_categories")
      .update({
        category_code,
        category_name,
        description: body?.description?.trim() || null,
        sort_order: Number(body?.sort_order || 0),
        is_active: body?.is_active !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Category Code นี้มีอยู่แล้ว" },
          { status: 409 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "อัปเดตหมวดหมู่สวัสดิการเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("BENEFIT_CATEGORY_PATCH_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "อัปเดตหมวดหมู่สวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(user, "benefit.category.delete")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const { count: usedCount, error: countError } = await supabaseAdmin
      .from("benefits")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (countError) throw countError;

    if ((usedCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบได้ เพราะหมวดหมู่นี้ถูกใช้งานในรายการสวัสดิการ",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบหมวดหมู่สวัสดิการเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("BENEFIT_CATEGORY_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบหมวดหมู่สวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}