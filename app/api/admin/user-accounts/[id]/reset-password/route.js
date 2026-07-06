import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldUser, error: oldUserError } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        auth_user_id,
        employee_id,
        username,
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

    if (oldUserError) throw oldUserError;

    if (!oldUser) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้ใช้งานระบบ" },
        { status: 404 }
      );
    }

    if (oldUser.username?.toLowerCase() === "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถ Reset Password ผู้ใช้งาน admin ได้",
        },
        { status: 400 }
      );
    }

    if (!oldUser.auth_user_id) {
      return NextResponse.json(
        {
          success: false,
          error: "ผู้ใช้งานนี้ไม่มี auth_user_id",
        },
        { status: 400 }
      );
    }

    const employeeCode = oldUser.employees?.employee_code?.trim();

    if (!employeeCode) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบรหัสพนักงาน ไม่สามารถ Reset Password ได้",
        },
        { status: 400 }
      );
    }

    const newPassword = employeeCode;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(oldUser.auth_user_id, {
        password: newPassword,
      });

    if (authUpdateError) throw authUpdateError;

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from("user_accounts")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        auth_user_id,
        employee_id,
        username,
        is_active,
        updated_at,
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
      .single();

    if (updateError) throw updateError;

    await writeActivityLog({
      module_name: "user_accounts",
      action_type: "reset_password",
      reference_table: "user_accounts",
      reference_id: updatedUser.id,
      description: `Reset Password ผู้ใช้งานระบบ ${updatedUser.username}`,
      old_data: {
        id: oldUser.id,
        auth_user_id: oldUser.auth_user_id,
        username: oldUser.username,
      },
      new_data: {
        id: updatedUser.id,
        auth_user_id: updatedUser.auth_user_id,
        username: updatedUser.username,
        employee_id: updatedUser.employee_id,
        employee_code: updatedUser.employees?.employee_code || "",
        employee_name:
          `${updatedUser.employees?.first_name_th || ""} ${
            updatedUser.employees?.last_name_th || ""
          }`.trim(),
        role_code: updatedUser.roles?.role_code || "",
        role_name: updatedUser.roles?.role_name || "",
        password_reset: true,
        reset_to_employee_code: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Reset Password สำเร็จ",
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        employee_code: updatedUser.employees?.employee_code || "-",
        employee_name:
          `${updatedUser.employees?.first_name_th || ""} ${
            updatedUser.employees?.last_name_th || ""
          }`.trim() || "-",
        temporary_password: newPassword,
      },
    });
  } catch (error) {
    console.error("RESET_USER_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถ Reset Password ได้",
      },
      { status: 500 }
    );
  }
}