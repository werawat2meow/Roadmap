import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   GET: list roles
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    let query = supabaseAdmin
      .from("roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        [
          `role_code.ilike.%${search}%`,
          `role_name.ilike.%${search}%`,
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
    console.error("GET_ROLES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูล Role ได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create role
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const role_code = body?.role_code?.trim()?.toUpperCase();
    const role_name = body?.role_name?.trim();
    const description = body?.description?.trim() || null;
    const is_active = body?.is_active ?? true;
    const is_system = body?.is_system ?? false;

    if (!role_code) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Role Code" },
        { status: 400 }
      );
    }

    if (!role_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Role Name" },
        { status: 400 }
      );
    }

    const { data: existingRole } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("role_code", role_code)
      .maybeSingle();

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: "Role Code นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("roles")
      .insert([
        {
          role_code,
          role_name,
          description,
          is_active,
          is_system,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "roles",
      action_type: "create",
      reference_table: "roles",
      reference_id: data.id,
      description: `เพิ่ม Role ${data.role_code} - ${data.role_name}`,
      new_data: {
        role_code: data.role_code,
        role_name: data.role_name,
        description: data.description,
        is_active: data.is_active,
        is_system: data.is_system,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Role สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("CREATE_ROLE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถเพิ่ม Role ได้",
      },
      { status: 500 }
    );
  }
}