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

    if (!hasPermission(user, "benefit.master.view")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefits")
      .select(`
        *,
        benefit_categories (
          id,
          category_code,
          category_name
        )
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("BENEFITS_MASTER_GET_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "โหลดรายการสวัสดิการไม่สำเร็จ" },
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

    if (!hasPermission(user, "benefit.master.create")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();

    const benefit_code = body?.benefit_code?.trim().toUpperCase();
    const benefit_name = body?.benefit_name?.trim();

    if (!benefit_code) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Benefit Code" },
        { status: 400 }
      );
    }

    if (!benefit_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Benefit Name" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefits")
      .insert({
        category_id: body?.category_id || null,
        benefit_code,
        benefit_name,
        description: body?.description?.trim() || null,
        benefit_type: body?.benefit_type || "general",
        active_period: body?.active_period || null,
        is_active: body?.is_active !== false,
        sort_order: Number(body?.sort_order || 0),
      })
      .select(`
        *,
        benefit_categories (
          id,
          category_code,
          category_name
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Benefit Code นี้มีอยู่แล้ว" },
          { status: 409 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "เพิ่มรายการสวัสดิการเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("BENEFITS_MASTER_POST_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เพิ่มรายการสวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}