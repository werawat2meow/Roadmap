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

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(user, "benefit.category.view")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFIT_CATEGORIES_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลดหมวดหมู่สวัสดิการไม่สำเร็จ" },
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

    if (!hasPermission(user, "benefit.category.create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const category_code = body?.category_code?.trim().toUpperCase();
    const category_name = body?.category_name?.trim();
    const description = body?.description?.trim() || null;
    const sort_order = Number(body?.sort_order || 0);
    const is_active = body?.is_active !== false;

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
      .insert({
        category_code,
        category_name,
        description,
        sort_order,
        is_active,
      })
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
      message: "เพิ่มหมวดหมู่สวัสดิการเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("BENEFIT_CATEGORIES_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เพิ่มหมวดหมู่สวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}