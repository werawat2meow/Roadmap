import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   PATCH: update user account
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const employee_id = body?.employee_id || null;
    const role_id = body?.role_id || null;
    const username = body?.username?.trim();
    const password = body?.password?.trim() || null;
    const is_active = body?.is_active ?? true;

    if (!username) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Username" },
        { status: 400 }
      );
    }

    if (password && password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        },
        { status: 400 }
      );
    }

    const { data: oldUser, error: oldUserError } = await supabaseAdmin
      .from("user_accounts")
      .select("id, auth_user_id, username")
      .eq("id", id)
      .single();

    if (oldUserError) throw oldUserError;

    if (oldUser.username?.toLowerCase() === "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถแก้ไขผู้ใช้งาน admin ได้",
        },
        { status: 400 }
      );
    }

    const { data: existingUser, error: existingUserError } =
      await supabaseAdmin
        .from("user_accounts")
        .select("id")
        .eq("username", username)
        .neq("id", id)
        .maybeSingle();

    if (existingUserError) throw existingUserError;

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Username นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    if (employee_id) {
      const { data: existingEmployee, error: existingEmployeeError } =
        await supabaseAdmin
          .from("user_accounts")
          .select("id")
          .eq("employee_id", employee_id)
          .neq("id", id)
          .maybeSingle();

      if (existingEmployeeError) throw existingEmployeeError;

      if (existingEmployee) {
        return NextResponse.json(
          { success: false, error: "พนักงานคนนี้มีบัญชีผู้ใช้งานแล้ว" },
          { status: 400 }
        );
      }
    }

    const updateAuthPayload = {
      user_metadata: {
        username,
      },
      ban_duration: is_active ? "none" : "876000h",
    };

    if (password) {
      updateAuthPayload.password = password;
    }

    if (oldUser.auth_user_id) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(
          oldUser.auth_user_id,
          updateAuthPayload
        );

      if (authUpdateError) throw authUpdateError;
    }

    const updatePayload = {
      employee_id,
      role_id,
      username,
      is_active,
      updated_at: new Date().toISOString(),
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updatePayload.password_hash = hashedPassword;
    }

    const { error: updateError } = await supabaseAdmin
      .from("user_accounts")
      .update(updatePayload)
      .eq("id", id);

    if (updateError) throw updateError;

    const { data, error } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        auth_user_id,
        employee_id,
        role_id,
        username,
        is_active,
        last_login_at,
        created_at,
        employees (
          employee_code,
          first_name_th,
          last_name_th
        ),
        roles (
          role_code,
          role_name
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "user_accounts",
      action_type: "update",
      reference_table: "user_accounts",
      reference_id: data.id,
      description: `แก้ไขผู้ใช้งานระบบ ${data.username}`,
      old_data: {
        id: oldUser.id,
        auth_user_id: oldUser.auth_user_id,
        username: oldUser.username,
      },
      new_data: {
        auth_user_id: data.auth_user_id,
        employee_id: data.employee_id,
        role_id: data.role_id,
        username: data.username,
        is_active: data.is_active,
        employee_code: data.employees?.employee_code || "",
        employee_name:
          `${data.employees?.first_name_th || ""} ${data.employees?.last_name_th || ""}`.trim(),
        role_code: data.roles?.role_code || "",
        role_name: data.roles?.role_name || "",
        password_changed: !!password,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทผู้ใช้งานระบบสำเร็จ",
      data: {
        id: data.id,
        auth_user_id: data.auth_user_id,
        employee_id: data.employee_id || "",
        role_id: data.role_id || "",
        role_code: data.roles?.role_code || "",
        role_name: data.roles?.role_name || "-",
        username: data.username,
        is_active: data.is_active,
        last_login_at: data.last_login_at,
        created_at: data.created_at,
        employee_code: data.employees?.employee_code || "-",
        employee_name:
          `${data.employees?.first_name_th || ""} ${data.employees?.last_name_th || ""}`.trim() || "-",
      },
    });
  } catch (error) {
    console.error("UPDATE_USER_ACCOUNT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถอัพเดทข้อมูลผู้ใช้งานระบบได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE: delete user account
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldUser, error: oldUserError } = await supabaseAdmin
      .from("user_accounts")
      .select("id, auth_user_id, username")
      .eq("id", id)
      .single();

    if (oldUserError) throw oldUserError;

    await writeActivityLog({
      module_name: "user_accounts",
      action_type: "delete",
      reference_table: "user_accounts",
      reference_id: oldUser.id,
      description: `ลบผู้ใช้งานระบบ ${oldUser.username}`,
      old_data: {
        id: oldUser.id,
        auth_user_id: oldUser.auth_user_id,
        username: oldUser.username,
      },
    });

    if (oldUser.username?.toLowerCase() === "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถลบผู้ใช้งาน admin ได้",
        },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseAdmin
      .from("user_accounts")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    if (oldUser.auth_user_id) {
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(oldUser.auth_user_id);

      if (authDeleteError) throw authDeleteError;
    }

    return NextResponse.json({
      success: true,
      message: "ลบผู้ใช้งานระบบสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_USER_ACCOUNT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบข้อมูลผู้ใช้งานระบบได้",
      },
      { status: 500 }
    );
  }
}