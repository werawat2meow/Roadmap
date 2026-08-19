import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const USER_ACCOUNT_SELECT = `
  id,
  auth_user_id,
  employee_id,
  role_id,
  username,
  is_active,
  last_login_at,
  created_at,
  updated_at,
  employees (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,
    status
  ),
  roles (
    id,
    role_code,
    role_name,
    is_active,
    is_system
  )
`;

function jsonError(error, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

async function loadUserAccountById(id) {
  const { data, error } = await supabaseAdmin
    .from("user_accounts")
    .select(USER_ACCOUNT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

function assertUserAccountInScope(
  guard,
  userAccount
) {
  if (!userAccount) {
    return {
      ok: false,
      response: jsonError(
        "ไม่พบผู้ใช้งานระบบ",
        404
      ),
    };
  }

  if (guard?.hasAllScope) {
    return { ok: true };
  }

  const employee = userAccount?.employees;

  if (
    !employee ||
    !guard.canAccessEmployee(employee)
  ) {
    return {
      ok: false,
      response: jsonError(
        "ผู้ใช้งานนี้อยู่นอกขอบเขตสิทธิ์ของคุณ",
        403
      ),
    };
  }

  return { ok: true };
}

export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "access.user_accounts",
      "reset_password",
      {
        scopeType: "employee",
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;

    const oldUser =
      await loadUserAccountById(id);

    if (!oldUser) {
      return jsonError(
        "ไม่พบผู้ใช้งานระบบ",
        404
      );
    }

    const targetAccess =
      assertUserAccountInScope(
        guard,
        oldUser
      );

    if (!targetAccess.ok) {
      return targetAccess.response;
    }

    if (
      oldUser.username?.toLowerCase() ===
      "admin"
    ) {
      return jsonError(
        "ไม่สามารถ Reset Password ผู้ใช้งาน admin ได้",
        400
      );
    }

    if (!oldUser.auth_user_id) {
      return jsonError(
        "ผู้ใช้งานนี้ไม่มี auth_user_id",
        400
      );
    }

    const employeeCode = String(
      oldUser?.employees?.employee_code || ""
    ).trim();

    if (!employeeCode) {
      return jsonError(
        "ไม่พบรหัสพนักงาน ไม่สามารถ Reset Password ได้",
        400
      );
    }

    const newPassword = employeeCode;
    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    const { error: authUpdateError } =
      await supabaseAdmin.auth.admin.updateUserById(
        oldUser.auth_user_id,
        {
          password: newPassword,
        }
      );

    if (authUpdateError) {
      throw authUpdateError;
    }

    const {
      data: updatedUser,
      error: updateError,
    } = await supabaseAdmin
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

    if (updateError) {
      throw updateError;
    }

    await writeActivityLog({
      module_name: "user_accounts",
      action_type: "reset_password",
      reference_table: "user_accounts",
      reference_id: updatedUser.id,
      description: `Reset Password ผู้ใช้งานระบบ ${updatedUser.username}`,
      old_data: {
        id: oldUser.id,
        username: oldUser.username,
      },
      new_data: {
        id: updatedUser.id,
        username: updatedUser.username,
        employee_id:
          updatedUser.employee_id,
        employee_code:
          updatedUser.employees
            ?.employee_code || "",
        employee_name:
          `${
            updatedUser.employees
              ?.first_name_th || ""
          } ${
            updatedUser.employees
              ?.last_name_th || ""
          }`.trim(),
        role_code:
          updatedUser.roles?.role_code || "",
        role_name:
          updatedUser.roles?.role_name || "",
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
        employee_code:
          updatedUser.employees
            ?.employee_code || "-",
        employee_name:
          `${
            updatedUser.employees
              ?.first_name_th || ""
          } ${
            updatedUser.employees
              ?.last_name_th || ""
          }`.trim() || "-",
        temporary_password: newPassword,
      },
    });
  } catch (error) {
    console.error(
      "RESET_USER_PASSWORD_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถ Reset Password ได้"
    );
  }
}
