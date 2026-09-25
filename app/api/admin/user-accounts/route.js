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

  employees:employees!user_accounts_employee_id_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    company_id,
    branch_group_id,
    branch_id,
    department_id,
    division_id,
    unit_id,
    position_id,
    status,
    is_deleted
  ),

  roles:roles!user_accounts_role_id_fkey (
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
    {
      status,
    }
  );
}

function cleanText(value) {
  return String(value || "")
    .trim();
}

function fullName(employee) {
  return [
    employee?.first_name_th,
    employee?.last_name_th,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function mapUserAccountRow(item) {
  return {
    id: item?.id || null,
    auth_user_id:
      item?.auth_user_id || null,
    employee_id:
      item?.employee_id || null,
    role_id:
      item?.role_id || null,
    username:
      item?.username || "",
    is_active:
      Boolean(item?.is_active),
    last_login_at:
      item?.last_login_at || null,
    created_at:
      item?.created_at || null,
    updated_at:
      item?.updated_at || null,

    employee_code:
      item?.employees?.employee_code || "-",
    employee_name:
      fullName(item?.employees) || "-",

    company_id:
      item?.employees?.company_id || null,
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
    position_id:
      item?.employees?.position_id || null,
    employee_status:
      item?.employees?.status || null,
    employee_is_deleted:
      Boolean(item?.employees?.is_deleted),

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

async function getScopedEmployeeIds(
  guard
) {
  if (guard?.hasAllScope) {
    return null;
  }

  const ids = [];
  const pageSize = 500;
  let page = 0;

  while (true) {
    const from =
      page * pageSize;
    const to =
      from + pageSize - 1;

    let query =
      supabaseAdmin
        .from("employees")
        .select(`
          id,
          company_id,
          branch_group_id,
          branch_id,
          department_id,
          division_id,
          unit_id
        `)
        .eq("is_deleted", false)
        .order(
          "id",
          {
            ascending: true,
          }
        )
        .range(
          from,
          to
        );

    query =
      guard.applyEmployeeScope(
        query
      );

    const {
      data,
      error,
    } =
      await query;

    if (error) {
      throw error;
    }

    const rows =
      data || [];

    ids.push(
      ...rows
        .map(
          (item) =>
            item?.id
        )
        .filter(Boolean)
    );

    if (
      rows.length <
      pageSize
    ) {
      break;
    }

    page += 1;
  }

  return [
    ...new Set(ids),
  ];
}

async function loadEmployeeForScope(
  employeeId
) {
  if (!employeeId) {
    return null;
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        company_id,
        branch_group_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        status,
        is_deleted
      `)
      .eq(
        "id",
        employeeId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function validateRole(
  roleId
) {
  if (!roleId) {
    return {
      ok: true,
      role: null,
    };
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("roles")
      .select(
        "id, role_code, role_name, is_active, is_system"
      )
      .eq(
        "id",
        roleId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      ok: false,
      response:
        jsonError(
          "ไม่พบ Role ที่เลือก",
          400
        ),
    };
  }

  if (
    data.is_active ===
    false
  ) {
    return {
      ok: false,
      response:
        jsonError(
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

   Collection route:
   - ไม่มี params.id
   - ใช้ Permission access.user_accounts.view
   - จำกัดข้อมูลตาม Employee Scope
========================================================= */
export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "access.user_accounts",
        "view",
        {
          scopeType:
            "employee",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(req.url);

    const search =
      cleanText(
        searchParams.get(
          "search"
        )
      ).toLowerCase();

    const page =
      Math.max(
        Number(
          searchParams.get(
            "page"
          )
        ) || 1,
        1
      );

    const pageSize =
      Math.min(
        Math.max(
          Number(
            searchParams.get(
              "pageSize"
            )
          ) || 20,
          1
        ),
        100
      );

    const scopedEmployeeIds =
      await getScopedEmployeeIds(
        guard
      );

    if (
      Array.isArray(
        scopedEmployeeIds
      ) &&
      scopedEmployeeIds.length ===
        0
    ) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
      });
    }

    let query =
      supabaseAdmin
        .from(
          "user_accounts"
        )
        .select(
          USER_ACCOUNT_SELECT
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (
      Array.isArray(
        scopedEmployeeIds
      )
    ) {
      query =
        query.in(
          "employee_id",
          scopedEmployeeIds
        );
    }

    const {
      data,
      error,
    } =
      await query;

    if (error) {
      throw error;
    }

    let mapped =
      (data || [])
        .map(
          mapUserAccountRow
        );

    /*
     * Soft-deleted Employee
     * ไม่ควรนำกลับมาให้เลือกกำหนด Scope ใหม่
     *
     * สำหรับ account ที่ไม่ได้ผูก employee:
     * - แสดงได้เฉพาะผู้มี all scope
     */
    mapped =
      mapped.filter(
        (item) => {
          if (
            item.employee_id &&
            item.employee_is_deleted
          ) {
            return false;
          }

          if (
            !guard?.hasAllScope &&
            !item.employee_id
          ) {
            return false;
          }

          return true;
        }
      );

    if (search) {
      mapped =
        mapped.filter(
          (item) => {
            const haystack = [
              item.username,
              item.employee_code,
              item.employee_name,
              item.role_code,
              item.role_name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return haystack.includes(
              search
            );
          }
        );
    }

    const total =
      mapped.length;

    const from =
      (page - 1) *
      pageSize;

    const to =
      from +
      pageSize;

    const paginatedData =
      mapped.slice(
        from,
        to
      );

    return NextResponse.json({
      success: true,
      data:
        paginatedData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages:
          Math.ceil(
            total /
              pageSize
          ),
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
   employee ที่ผูกกับ account ต้องอยู่ใน Scope
========================================================= */
export async function POST(req) {
  let createdAuthUserId =
    null;

  try {
    const guard =
      await requireScopedAccess(
        "access.user_accounts",
        "create",
        {
          scopeType:
            "employee",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const body =
      await req.json();

    const employee_id =
      body?.employee_id ||
      null;

    const role_id =
      body?.role_id ||
      null;

    const username =
      cleanText(
        body?.username
      );

    const password =
      cleanText(
        body?.password
      );

    const is_active =
      body?.is_active ??
      true;

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

    if (
      password.length < 6
    ) {
      return jsonError(
        "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
        400
      );
    }

    if (employee_id) {
      const employee =
        await loadEmployeeForScope(
          employee_id
        );

      if (!employee) {
        return jsonError(
          "ไม่พบพนักงานที่เลือก",
          404
        );
      }

      if (
        employee.is_deleted ===
        true
      ) {
        return jsonError(
          "ไม่สามารถสร้างบัญชีให้พนักงานที่ถูกลบออกจากระบบแล้ว",
          400
        );
      }

      if (
        !guard?.hasAllScope &&
        !guard.canAccessEmployee(
          employee
        )
      ) {
        return jsonError(
          "พนักงานที่เลือกอยู่นอกขอบเขตสิทธิ์ของคุณ",
          403
        );
      }
    } else if (
      !guard?.hasAllScope
    ) {
      return jsonError(
        "บัญชีผู้ใช้งานต้องผูกกับพนักงานที่อยู่ในขอบเขตสิทธิ์ของคุณ",
        403
      );
    }

    const roleResult =
      await validateRole(
        role_id
      );

    if (
      !roleResult.ok
    ) {
      return roleResult.response;
    }

    const {
      data:
        existingUser,
      error:
        existingUserError,
    } =
      await supabaseAdmin
        .from(
          "user_accounts"
        )
        .select("id")
        .eq(
          "username",
          username
        )
        .maybeSingle();

    if (
      existingUserError
    ) {
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
        data:
          existingEmployee,
        error:
          existingEmployeeError,
      } =
        await supabaseAdmin
          .from(
            "user_accounts"
          )
          .select("id")
          .eq(
            "employee_id",
            employee_id
          )
          .maybeSingle();

      if (
        existingEmployeeError
      ) {
        throw existingEmployeeError;
      }

      if (
        existingEmployee
      ) {
        return jsonError(
          "พนักงานคนนี้มีบัญชีผู้ใช้งานแล้ว",
          400
        );
      }
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const fakeEmail =
      `${username
        .toLowerCase()
        .replace(
          /[^a-z0-9._-]/g,
          "_"
        )}_${Date.now()}@local.user`;

    const {
      data:
        createdAuthUser,
      error:
        authError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .createUser({
          email:
            fakeEmail,
          password,
          email_confirm:
            true,
          user_metadata: {
            username,
          },
        });

    if (authError) {
      throw authError;
    }

    createdAuthUserId =
      createdAuthUser
        ?.user
        ?.id ||
      null;

    if (
      !createdAuthUserId
    ) {
      throw new Error(
        "ไม่สามารถสร้าง auth user ได้"
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "user_accounts"
        )
        .insert({
          auth_user_id:
            createdAuthUserId,
          employee_id,
          role_id,
          username,
          is_active,
          password_hash:
            hashedPassword,
        })
        .select(
          USER_ACCOUNT_SELECT
        )
        .single();

    if (error) {
      throw error;
    }

    const mapped =
      mapUserAccountRow(
        data
      );

    await writeActivityLog({
      module_name:
        "user_accounts",
      action_type:
        "create",
      reference_table:
        "user_accounts",
      reference_id:
        mapped.id,
      description:
        `เพิ่มผู้ใช้งานระบบ ${mapped.username}`,
      new_data: {
        auth_user_id:
          mapped.auth_user_id,
        employee_id:
          mapped.employee_id,
        role_id:
          mapped.role_id,
        username:
          mapped.username,
        is_active:
          mapped.is_active,
        employee_code:
          mapped.employee_code,
        employee_name:
          mapped.employee_name,
        role_code:
          mapped.role_code,
        role_name:
          mapped.role_name,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มผู้ใช้งานระบบสำเร็จ",
      data:
        mapped,
    });
  } catch (error) {
    if (
      createdAuthUserId
    ) {
      try {
        await supabaseAdmin
          .auth
          .admin
          .deleteUser(
            createdAuthUserId
          );
      } catch (
        cleanupError
      ) {
        console.error(
          "CREATE_USER_ACCOUNT_AUTH_CLEANUP_ERROR:",
          cleanupError
        );
      }
    }

    console.error(
      "CREATE_USER_ACCOUNT_ERROR:",
      error
    );

    return jsonError(
      error?.message ||
        "ไม่สามารถบันทึกข้อมูลผู้ใช้งานระบบได้"
    );
  }
}
