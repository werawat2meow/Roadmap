import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   GET: list permissions
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim()?.toLowerCase() || "";

    let query = supabaseAdmin
      .from("permissions")
      .select("*")
      .order("module_code", { ascending: true })
      .order("action_code", { ascending: true })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        [
          `module_code.ilike.%${search}%`,
          `action_code.ilike.%${search}%`,
          `permission_code.ilike.%${search}%`,
          `permission_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("GET_PERMISSIONS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูล Permission ได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create permission
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const module_code = body?.module_code?.trim()?.toLowerCase();
    const action_code = body?.action_code?.trim()?.toLowerCase();
    const permission_code = body?.permission_code?.trim()?.toLowerCase();
    const permission_name = body?.permission_name?.trim();
    const description = body?.description?.trim() || null;
    const is_active = body?.is_active ?? true;
    const is_system = body?.is_system ?? false;

    if (!module_code) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Module" },
        { status: 400 }
      );
    }

    if (!action_code) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Action" },
        { status: 400 }
      );
    }

    if (!permission_code) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Permission Code" },
        { status: 400 }
      );
    }

    if (!permission_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Permission Name" },
        { status: 400 }
      );
    }

    const { data: existingPermission, error: existingPermissionError } =
      await supabaseAdmin
        .from("permissions")
        .select("id")
        .eq("permission_code", permission_code)
        .maybeSingle();

    if (existingPermissionError) throw existingPermissionError;

    if (existingPermission) {
      return NextResponse.json(
        { success: false, error: "Permission Code นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("permissions")
      .insert([
        {
          module_code,
          action_code,
          permission_code,
          permission_name,
          description,
          is_active,
          is_system,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Permission สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("CREATE_PERMISSION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถเพิ่ม Permission ได้",
      },
      { status: 500 }
    );
  }
}