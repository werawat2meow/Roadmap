import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================
   PATCH: update permission
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const module_code = body?.module_code?.trim()?.toLowerCase();
    const action_code = body?.action_code?.trim()?.toLowerCase();
    const permission_code = body?.permission_code?.trim()?.toLowerCase();
    const permission_name = body?.permission_name?.trim();
    const description = body?.description?.trim() || null;
    const is_active = body?.is_active ?? true;

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

    const { data: oldPermission, error: oldPermissionError } =
      await supabaseAdmin
        .from("permissions")
        .select("*")
        .eq("id", id)
        .single();

    if (oldPermissionError) throw oldPermissionError;

    const { data: existingPermission, error: existingPermissionError } =
      await supabaseAdmin
        .from("permissions")
        .select("id")
        .eq("permission_code", permission_code)
        .neq("id", id)
        .maybeSingle();

    if (existingPermissionError) throw existingPermissionError;

    if (existingPermission) {
      return NextResponse.json(
        { success: false, error: "Permission Code นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    if (oldPermission.is_system) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถแก้ไข System Permission ได้",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("permissions")
      .update({
        module_code,
        action_code,
        permission_code,
        permission_name,
        description,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "อัพเดท Permission สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("UPDATE_PERMISSION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถอัพเดท Permission ได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE: delete permission
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: permission, error: permissionError } = await supabaseAdmin
      .from("permissions")
      .select("*")
      .eq("id", id)
      .single();

    if (permissionError) throw permissionError;

    if (permission.is_system) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบ System Permission ได้",
        },
        { status: 400 }
      );
    }

    const { data: usedRoles, error: usedRolesError } = await supabaseAdmin
      .from("role_permissions")
      .select("id")
      .eq("permission_id", id)
      .limit(1);

    if (usedRolesError) throw usedRolesError;

    if (usedRoles?.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบได้ เนื่องจากมี Role ใช้งาน Permission นี้อยู่",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("permissions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบ Permission สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_PERMISSION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบ Permission ได้",
      },
      { status: 500 }
    );
  }
}