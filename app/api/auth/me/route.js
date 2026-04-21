import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("employee_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-key"
    );

    const userId = decoded?.user_id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: userAccount, error: userError } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        role_id,
        username,
        is_active,
        roles (
          id,
          role_code,
          role_name
        )
      `)
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      return NextResponse.json(
        { success: false, error: "เกิดข้อผิดพลาดในการค้นหาผู้ใช้งาน" },
        { status: 500 }
      );
    }

    if (!userAccount || !userAccount.is_active) {
      return NextResponse.json(
        { success: false, error: "ไม่พบบัญชีผู้ใช้งานหรือบัญชีถูกปิดการใช้งาน" },
        { status: 401 }
      );
    }

    let employee = null;

    if (userAccount.employee_id) {
      const { data: employeeData, error: employeeError } = await supabaseAdmin
        .from("employees")
        .select(`
          id,
          employee_code,
          first_name_th,
          last_name_th,
          first_name_en,
          last_name_en
        `)
        .eq("id", userAccount.employee_id)
        .maybeSingle();

      if (employeeError) {
        return NextResponse.json(
          { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน" },
          { status: 500 }
        );
      }

      employee = employeeData;
    }

    let permissions = [];

    if (userAccount.role_id) {
      const { data: permissionRows, error: permissionError } =
        await supabaseAdmin
          .from("role_permissions")
          .select(`
            permission_id,
            permissions (
              id,
              permission_code,
              permission_name,
              module_code,
              action_code,
              is_active
            )
          `)
          .eq("role_id", userAccount.role_id);

      if (permissionError) {
        return NextResponse.json(
          { success: false, error: "เกิดข้อผิดพลาดในการดึงสิทธิ์ผู้ใช้งาน" },
          { status: 500 }
        );
      }

      permissions =
        permissionRows
          ?.map((row) => row.permissions)
          ?.filter((perm) => perm && perm.is_active)
          ?.map((perm) => perm.permission_code) || [];
    }

    const fullNameTh = employee
      ? `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim()
      : userAccount.username;

    return NextResponse.json({
      success: true,
      user: {
        id: userAccount.id,
        employee_id: userAccount.employee_id,
        role_id: userAccount.role_id,
        username: userAccount.username,
        role: userAccount.roles?.role_code || null,
        role_code: userAccount.roles?.role_code || null,
        role_name: userAccount.roles?.role_name || null,
        permissions,
        employee_code: employee?.employee_code || null,
        full_name: fullNameTh,
      },
    });
  } catch (error) {
    console.error("GET_ME_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}