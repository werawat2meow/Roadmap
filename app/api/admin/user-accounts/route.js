import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const NO_ACCESS_UUID =
  "00000000-0000-0000-0000-000000000000";

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

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
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

function matchesSearch(item, search) {
  if (!search) {
    return true;
  }

  const values = [
    item?.username,
    item?.employee_code,
    item?.employee_name,
    item?.role_code,
    item?.role_name,
  ];

  return values.some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(search)
  );
}

async function resolveScopedEmployeeIds(guard) {
  if (guard?.hasAllScope) {
    return null;
  }

  let query = supabaseAdmin
    .from("employees")
    .select("id");

  query = guard.applyEmployeeScope(query);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || [])
    .map((item) => item?.id)
    .filter(Boolean)
    .map(String);
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
   GET /api/admin/user-accounts

   Permission:
   access.user_accounts.view

   Scope:
   ใช้ requireScopedAccess ของกลางจาก Login
   แล้ว Scope ผ่าน employee ของ user account
========================================================= */
export async function GET(req) {
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

    const { searchParams } = new URL(req.url);

    const search = normalizeSearch(
      searchParams.get("search")
    );

    const status = String(
      searchParams.get("status") || ""
    ).trim();

    const page = Math.max(
      Number(searchParams.get("page") || 1),
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(
          searchParams.get("pageSize") || 20
        ),
        1
      ),
      100
    );

    const scopedEmployeeIds =
      await resolveScopedEmployeeIds(guard);

    let query = supabaseAdmin
      .from("user_accounts")
      .select(USER_ACCOUNT_SELECT)
      .order("created_at", {
        ascending: false,
      });

    if (scopedEmployeeIds !== null) {
      if (!scopedEmployeeIds.length) {
        query = query.eq(
          "employee_id",
          NO_ACCESS_UUID
        );
      } else {
        query = query.in(
          "employee_id",
          scopedEmployeeIds
        );
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const scopedRows = (data || []).map(
      mapUserAccountRow
    );

    const summary = {
      total: scopedRows.length,
      active: scopedRows.filter(
        (item) => item.is_active
      ).length,
      inactive: scopedRows.filter(
        (item) => !item.is_active
      ).length,
      never_login: scopedRows.filter(
        (item) => !item.last_login_at
      ).length,
    };

    const filteredRows = scopedRows.filter(
      (item) => {
        if (
          status === "active" &&
          !item.is_active
        ) {
          return false;
        }

        if (
          status === "inactive" &&
          item.is_active
        ) {
          return false;
        }

        return matchesSearch(item, search);
      }
    );

    const total = filteredRows.length;
    const from = (page - 1) * pageSize;
    const to = from + pageSize;

    return NextResponse.json({
      success: true,
      data: filteredRows.slice(from, to),
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(
          Math.ceil(total / pageSize),
          1
        ),
      },
      scope: {
        unrestricted:
          scopedEmployeeIds === null,
      },
    });
  } catch (error) {
    console.error(
      "GET_USER_ACCOUNTS_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถดึงข้อมูลผู้ใช้งานระบบได้"
    );
  }
}

/* =========================================================
   POST /api/admin/user-accounts

   Permission:
   access.user_accounts.create

   Scope:
   employee_id ที่เลือกต้องผ่าน Scope ของ Login User
========================================================= */
export async function POST(req) {
  let createdAuthUserId = null;
  let userAccountPersisted = false;

  try {
    const guard = await requireScopedAccess(
      "access.user_accounts",
      "create",
      {
        scopeType: "employee",
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const body = await req.json();

    const employee_id =
      body?.employee_id || null;
    const role_id = body?.role_id || null;
    const username = String(
      body?.username || ""
    ).trim();
    const password = String(
      body?.password || ""
    ).trim();
    const is_active =
      body?.is_active ?? true;

    if (!username) {
      return jsonError(
        "กรุณากรอก Username",
        400
      );
    }

    if (!password) {
      return jsonError(
        "กรุณากรอกรหัสผ่าน",
        400
      );
    }

    if (password.length < 6) {
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

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const fakeEmail = `${username.toLowerCase()}_${Date.now()}@local.user`;

    const {
      data: createdAuthUser,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password,
        email_confirm: true,
        user_metadata: {
          username,
        },
      });

    if (authError) {
      const message = String(
        authError?.message || ""
      ).toLowerCase();

      if (
        message.includes(
          "already been registered"
        )
      ) {
        return jsonError(
          "บัญชี Auth ของ Username นี้มีอยู่แล้ว กรุณาใช้ Username อื่น",
          400
        );
      }

      throw authError;
    }

    createdAuthUserId =
      createdAuthUser?.user?.id || null;

    if (!createdAuthUserId) {
      throw new Error(
        "ไม่สามารถสร้าง Auth User ได้"
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("user_accounts")
        .insert({
          auth_user_id: createdAuthUserId,
          employee_id,
          role_id,
          username,
          is_active,
          password_hash: hashedPassword,
        })
        .select(USER_ACCOUNT_SELECT)
        .single();

    if (error) {
      throw error;
    }

    userAccountPersisted = true;

    const mapped = mapUserAccountRow(data);

    await writeActivityLog({
      module_name: "user_accounts",
      action_type: "create",
      reference_table: "user_accounts",
      reference_id: mapped.id,
      description: `เพิ่มผู้ใช้งานระบบ ${mapped.username}`,
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
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มผู้ใช้งานระบบสำเร็จ",
      data: mapped,
    });
  } catch (error) {
    console.error(
      "CREATE_USER_ACCOUNT_ERROR:",
      error
    );

    if (
      createdAuthUserId &&
      !userAccountPersisted
    ) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(
          createdAuthUserId
        );
      } catch (rollbackError) {
        console.error(
          "ROLLBACK_AUTH_USER_ERROR:",
          rollbackError
        );
      }
    }

    return jsonError(
      error?.message ||
        "ไม่สามารถบันทึกข้อมูลผู้ใช้งานระบบได้"
    );
  }
}
