import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   PATCH: update role
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const role_code = body?.role_code?.trim()?.toUpperCase();
    const role_name = body?.role_name?.trim();
    const description = body?.description?.trim() || null;
    const is_active = body?.is_active ?? true;

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

    const { data: oldRole, error: oldRoleError } = await supabaseAdmin
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    if (oldRoleError) throw oldRoleError;

    const { data: existingRole } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("role_code", role_code)
      .neq("id", id)
      .maybeSingle();

    if (existingRole) {
      return NextResponse.json(
        { success: false, error: "Role Code นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    if (oldRole.is_system && oldRole.role_code === "SUPER_ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถแก้ไข SUPER_ADMIN ได้",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("roles")
      .update({
        role_code,
        role_name,
        description,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "roles",
      action_type: "update",
      reference_table: "roles",
      reference_id: data.id,
      description: `แก้ไข Role ${data.role_code} - ${data.role_name}`,
      old_data: oldRole,
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
      message: "อัพเดท Role สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("UPDATE_ROLE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถอัพเดท Role ได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE: delete role
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: role, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("*")
      .eq("id", id)
      .single();

    if (roleError) throw roleError;

    if (role.is_system) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบ System Role ได้",
        },
        { status: 400 }
      );
    }

    const { data: usedUsers, error: usedUsersError } = await supabaseAdmin
      .from("user_accounts")
      .select("id")
      .eq("role_id", id)
      .limit(1);

    if (usedUsersError) throw usedUsersError;

    if (usedUsers?.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบได้ เนื่องจากมีผู้ใช้งานผูกกับ Role นี้อยู่",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("roles")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "roles",
      action_type: "delete",
      reference_table: "roles",
      reference_id: role.id,
      description: `ลบ Role ${role.role_code} - ${role.role_name}`,
      old_data: role,
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Role สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_ROLE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบ Role ได้",
      },
      { status: 500 }
    );
  }
}