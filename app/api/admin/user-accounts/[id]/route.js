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

function fullName(employee) {
  return `${employee?.first_name_th || ""} ${
    employee?.last_name_th || ""
  }`.trim();
}

function mapUserAccountRow(item) {
  return {
    id: item?.id,
    auth_user_id: item?.auth_user_id || null,
    employee_id: item?.employee_id || null,
    role_id: item?.role_id || null,
    username: item?.username || "",
    is_active: Boolean(item?.is_active),
    last_login_at: item?.last_login_at || null,
    created_at: item?.created_at || null,
    updated_at: item?.updated_at || null,

    employee_code:
      item?.employees?.employee_code || "-",
    employee_name:
      fullName(item?.employees) || "-",

    branch_group_id:
      item?.employees?.branch_group_id || null,
    branch_id:
      item?.employees?.branch_id || null,
    department_id:
      item?.employees?.department_id || null,
    division_id:
      item?.employees?.division_id || null,
    unit_id:
      item?.employees?.unit_id || null,

    role_code:
      item?.roles?.role_code || "-",
    role_name:
      item?.roles?.role_name || "-",
    role_is_active:
      item?.roles?.is_active ?? null,
    role_is_system:
      item?.roles?.is_system ?? false,
  };
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

async function assertEmployeeInScope(
  guard,
  employeeId
) {
  if (!employeeId) {
    if (guard?.hasAllScope) {
      return {
        ok: true,
        employee: null,
      };
    }

    return {
      ok: false,
      response: jsonError(
        "บัญชีผู้ใช้งานต้องผูกกับพนักงานที่อยู่ในขอบเขตสิทธิ์ของคุณ",
        403
      ),
    };
  }

  const { data: employee, error } =
    await supabaseAdmin
      .from("employees")
      .select(`
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
      `)
      .eq("id", employeeId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!employee) {
    return {
      ok: false,
      response: jsonError(
        "ไม่พบพนักงานที่เลือก",
        404
      ),
    };
  }

  if (
    !guard?.hasAllScope &&
    !guard.canAccessEmployee(employee)
  ) {
    return {
      ok: false,
      response: jsonError(
        "พนักงานที่เลือกอยู่นอกขอบเขตสิทธิ์ของคุณ",
        403
      ),
    };
  }

  return {
    ok: true,
    employee,
  };
}

async function validateRole(roleId) {
  if (!roleId) {
    return {
      ok: true,
      role: null,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("roles")
    .select(
      "id, role_code, role_name, is_active, is_system"
    )
    .eq("id", roleId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      ok: false,
      response: jsonError(
        "ไม่พบ Role ที่เลือก",
        400
      ),
    };
  }

  if (data.is_active === false) {
    return {
      ok: false,
      response: jsonError(
        "Role ที่เลือกไม่ได้เปิดใช้งาน",
        400
      ),
    };
  }

  return {
    ok: true,
    role: data,
  };
}

/* =========================================================
   GET /api/admin/user-accounts/[id]

   Permission:
   access.user_accounts.view

   Scope:
   account เป้าหมายต้องอยู่ใน Scope ของ Login User
========================================================= */
export async function GET(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "access.user_accounts",
      "view",
      {
        scopeType: "employee",
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;

    const userAccount =
      await loadUserAccountById(id);

    if (!userAccount) {
      return jsonError(
        "ไม่พบผู้ใช้งานระบบ",
        404
      );
    }

    const targetAccess =
      assertUserAccountInScope(
        guard,
        userAccount
      );

    if (!targetAccess.ok) {
      return targetAccess.response;
    }

    return NextResponse.json({
      success: true,
      data: mapUserAccountRow(userAccount),
    });
  } catch (error) {
    console.error(
      "GET_USER_ACCOUNT_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถโหลดข้อมูลผู้ใช้งานระบบได้"
    );
  }
}

/* =========================================================
   PATCH /api/admin/user-accounts/[id]

   Permission:
   access.user_accounts.edit

   Scope:
   - account เดิมต้องอยู่ใน Scope
   - employee ใหม่ต้องอยู่ใน Scope ด้วย
========================================================= */
export async function PATCH(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "access.user_accounts",
      "edit",
      {
        scopeType: "employee",
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } = await params;
    const body = await req.json();

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
        "ไม่สามารถแก้ไขผู้ใช้งาน admin ได้",
        400
      );
    }

    const employee_id =
      body?.employee_id || null;
    const role_id = body?.role_id || null;
    const username = String(
      body?.username || ""
    ).trim();
    const password = String(
      body?.password || ""
    ).trim() || null;
    const is_active =
      body?.is_active ?? true;

    if (!username) {
      return jsonError(
        "กรุณากรอก Username",
        400
      );
    }

    if (password && password.length < 6) {
      return jsonError(
        "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        400
      );
    }

    const employeeAccess =
      await assertEmployeeInScope(
        guard,
        employee_id
      );

    if (!employeeAccess.ok) {
      return employeeAccess.response;
    }

    const roleCheck = await validateRole(
      role_id
    );

    if (!roleCheck.ok) {
      return roleCheck.response;
    }

    const {
      data: existingUser,
      error: existingUserError,
    } = await supabaseAdmin
      .from("user_accounts")
      .select("id")
      .eq("username", username)
      .neq("id", id)
      .maybeSingle();

    if (existingUserError) {
      throw existingUserError;
    }

    if (existingUser) {
      return jsonError(
        "Username นี้มีอยู่แล้ว",
        400
      );
    }

    if (employee_id) {
      const {
        data: existingEmployee,
        error: existingEmployeeError,
      } = await supabaseAdmin
        .from("user_accounts")
        .select("id")
        .eq("employee_id", employee_id)
        .neq("id", id)
        .maybeSingle();

      if (existingEmployeeError) {
        throw existingEmployeeError;
      }

      if (existingEmployee) {
        return jsonError(
          "พนักงานคนนี้มีบัญชีผู้ใช้งานแล้ว",
          400
        );
      }
    }

    const updateAuthPayload = {
      user_metadata: {
        username,
      },
      ban_duration: is_active
        ? "none"
        : "876000h",
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

      if (authUpdateError) {
        throw authUpdateError;
      }
    }

    const updatePayload = {
      employee_id,
      role_id,
      username,
      is_active,
      updated_at: new Date().toISOString(),
    };

    if (password) {
      updatePayload.password_hash =
        await bcrypt.hash(password, 10);
    }

    const { error: updateError } =
      await supabaseAdmin
        .from("user_accounts")
        .update(updatePayload)
        .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    const { data, error } =
      await supabaseAdmin
        .from("user_accounts")
        .select(USER_ACCOUNT_SELECT)
        .eq("id", id)
        .single();

    if (error) {
      throw error;
    }

    const mapped = mapUserAccountRow(data);

    await writeActivityLog({
      module_name: "user_accounts",
      action_type: "update",
      reference_table: "user_accounts",
      reference_id: mapped.id,
      description: `แก้ไขผู้ใช้งานระบบ ${mapped.username}`,
      old_data: {
        employee_id:
          oldUser.employee_id || null,
        role_id: oldUser.role_id || null,
        username: oldUser.username,
        is_active:
          oldUser.is_active ?? true,
      },
      new_data: {
        employee_id: mapped.employee_id,
        role_id: mapped.role_id,
        username: mapped.username,
        is_active: mapped.is_active,
        employee_code:
          mapped.employee_code,
        employee_name:
          mapped.employee_name,
        role_code: mapped.role_code,
        role_name: mapped.role_name,
        password_changed:
          Boolean(password),
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "อัพเดทผู้ใช้งานระบบสำเร็จ",
      data: mapped,
    });
  } catch (error) {
    console.error(
      "UPDATE_USER_ACCOUNT_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถอัพเดทข้อมูลผู้ใช้งานระบบได้"
    );
  }
}

/* =========================================================
   DELETE /api/admin/user-accounts/[id]

   Permission:
   access.user_accounts.delete

   Scope:
   account เป้าหมายต้องอยู่ใน Scope
========================================================= */
export async function DELETE(req, { params }) {
  try {
    const guard = await requireScopedAccess(
      "access.user_accounts",
      "delete",
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
        "ไม่สามารถลบผู้ใช้งาน admin ได้",
        400
      );
    }

    if (
      String(guard?.access?.id || "") ===
      String(id)
    ) {
      return jsonError(
        "ไม่สามารถลบบัญชีผู้ใช้งานที่กำลังใช้งานอยู่ได้",
        400
      );
    }

    const { error: deleteError } =
      await supabaseAdmin
        .from("user_accounts")
        .delete()
        .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    if (oldUser.auth_user_id) {
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(
          oldUser.auth_user_id
        );

      if (authDeleteError) {
        throw authDeleteError;
      }
    }

    await writeActivityLog({
      module_name: "user_accounts",
      action_type: "delete",
      reference_table: "user_accounts",
      reference_id: oldUser.id,
      description: `ลบผู้ใช้งานระบบ ${oldUser.username}`,
      old_data: {
        employee_id:
          oldUser.employee_id || null,
        role_id: oldUser.role_id || null,
        username: oldUser.username,
        is_active:
          oldUser.is_active ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบผู้ใช้งานระบบสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_USER_ACCOUNT_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถลบข้อมูลผู้ใช้งานระบบได้"
    );
  }
}
