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

export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!hasPermission(user, "benefit.master.edit")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;
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
      .update({
        category_id: body?.category_id || null,
        benefit_code,
        benefit_name,
        description: body?.description?.trim() || null,
        benefit_type: body?.benefit_type || "general",
        active_period: body?.active_period || null,
        is_active: body?.is_active !== false,
        sort_order: Number(body?.sort_order || 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
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
      message: "อัปเดตรายการสวัสดิการเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error("BENEFITS_MASTER_PATCH_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "อัปเดตรายการสวัสดิการไม่สำเร็จ" },
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

    if (!hasPermission(user, "benefit.master.delete")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const { count: ruleCount, error: ruleCountError } = await supabaseAdmin
      .from("benefit_rules")
      .select("id", { count: "exact", head: true })
      .eq("benefit_id", id);

    if (ruleCountError) throw ruleCountError;

    if ((ruleCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบได้ เพราะรายการนี้ถูกใช้งานใน Benefit Rules",
        },
        { status: 400 }
      );
    }

    const { count: requestCount, error: requestCountError } = await supabaseAdmin
      .from("benefit_requests")
      .select("id", { count: "exact", head: true })
      .eq("benefit_id", id);

    if (requestCountError) throw requestCountError;

    if ((requestCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบได้ เพราะมีคำขอใช้สิทธิ์ที่อ้างอิงรายการนี้",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefits")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบรายการสวัสดิการเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("BENEFITS_MASTER_DELETE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ลบรายการสวัสดิการไม่สำเร็จ" },
      { status: 500 }
    );
  }
}