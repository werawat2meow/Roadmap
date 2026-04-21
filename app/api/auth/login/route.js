import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const body = await req.json();
    const username = body?.username?.trim();
    const password = body?.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: "กรุณากรอก username และ password" },
        { status: 400 }
      );
    }

    // =========================
    // 1) หา user account จาก username
    // =========================
    const { data: userAccount, error: userError } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        role_id,
        username,
        password_hash,
        is_active,
        roles (
          id,
          role_code,
          role_name
        )
      `)
      .eq("username", username)
      .maybeSingle();

    if (userError) {
      console.error("USER_QUERY_ERROR:", userError);
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการค้นหาผู้ใช้งาน" },
        { status: 500 }
      );
    }

    if (!userAccount) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (!userAccount.is_active) {
      return NextResponse.json(
        { error: "บัญชีนี้ถูกปิดการใช้งาน" },
        { status: 403 }
      );
    }

    if (!userAccount.password_hash) {
      return NextResponse.json(
        { error: "บัญชีนี้ยังไม่มีรหัสผ่านในระบบ" },
        { status: 400 }
      );
    }

    // =========================
    // 2) ตรวจสอบรหัสผ่าน
    // =========================
    const isPasswordValid = await bcrypt.compare(
      password,
      userAccount.password_hash
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // =========================
    // 3) ดึงข้อมูล employee
    // =========================
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
        console.error("EMPLOYEE_QUERY_ERROR:", employeeError);
        return NextResponse.json(
          { error: "เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน" },
          { status: 500 }
        );
      }

      employee = employeeData;
    }

    // =========================
    // 4) ดึง permissions จาก role_permissions
    // =========================
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
        console.error("PERMISSION_QUERY_ERROR:", permissionError);
        return NextResponse.json(
          { error: "เกิดข้อผิดพลาดในการดึงสิทธิ์ผู้ใช้งาน" },
          { status: 500 }
        );
      }

      permissions =
        permissionRows
          ?.map((row) => row.permissions)
          ?.filter((perm) => perm && perm.is_active)
          ?.map((perm) => perm.permission_code) || [];
    }

    const primaryRole = userAccount.roles?.role_code || null;
    const primaryRoleName = userAccount.roles?.role_name || null;

    const fullNameTh = employee
      ? `${employee.first_name_th || ""} ${employee.last_name_th || ""}`.trim()
      : userAccount.username;

    // =========================
    // 5) update last login
    // =========================
    await supabaseAdmin
      .from("user_accounts")
      .update({
        last_login_at: new Date().toISOString(),
      })
      .eq("id", userAccount.id);

    // =========================
    // 6) สร้าง JWT
    // =========================
    const token = jwt.sign(
      {
        user_id: userAccount.id,
        employee_id: userAccount.employee_id,
        role_id: userAccount.role_id,
        username: userAccount.username,
        role: primaryRole,
        role_name: primaryRoleName,
        permissions,
        employee_code: employee?.employee_code || null,
        full_name: fullNameTh,
      },
      process.env.JWT_SECRET || "dev-secret-key",
      { expiresIn: "1d" }
    );

    // =========================
    // 7) ส่ง response + set cookie
    // =========================
    const response = NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: userAccount.id,
        employee_id: userAccount.employee_id,
        role_id: userAccount.role_id,
        username: userAccount.username,
        role: primaryRole,
        role_name: primaryRoleName,
        permissions,
        employee_code: employee?.employee_code || null,
        full_name: fullNameTh,
      },
    });

    response.cookies.set("employee_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}