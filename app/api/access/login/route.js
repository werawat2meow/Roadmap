/*



  STEP 1: Login (เอา Token มาก่อน)
  Response ที่จะได้ 
  {
    "success": true,
    "accessToken": "xxxxx",
    "refreshToken": "xxxxx"
  } 







  
  const res = await fetch("/api/access/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
      username: "admin",
      password: "123456",
    }),
  });

  const json = await res.json();

  localStorage.setItem("accessToken", json.accessToken);
  localStorage.setItem("refreshToken", json.refreshToken);

*/

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/logActivity";
import { createAccessToken, createRefreshToken, hashToken } from "@/lib/jwt";

export async function POST(req) {
  try {
    const body = await req.json();

    const username = body?.username?.trim();
    const password = body?.password?.trim();
    const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Username และ Password" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        auth_user_id,
        employee_id,
        role_id,
        username,
        password_hash,
        is_active,
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
      .eq("username", username)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้ใช้งาน" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: "บัญชีถูกปิดการใช้งาน" },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash || "");

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      user_id: user.id,
      auth_user_id: user.auth_user_id,
      employee_id: user.employee_id,
      role_id: user.role_id,
      username: user.username,
      role_code: user.roles?.role_code || "",
    };

    const accessToken = await createAccessToken(tokenPayload);
    const refreshToken = await createRefreshToken(tokenPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabaseAdmin.from("user_refresh_tokens").insert({
      user_id: user.id,
      refresh_token_hash: hashToken(refreshToken),
      user_agent: userAgent,
      request_ip: requestIp,
      expires_at: expiresAt.toISOString(),
    });

    await supabaseAdmin
      .from("user_accounts")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", user.id);

    await logActivity({
      userId: user.id,
      moduleName: "AUTH",
      actionType: "LOGIN",
      referenceTable: "user_accounts",
      referenceId: user.id,
      description: `Login สำเร็จ: ${user.username}`,
      newData: {
        ip: requestIp,
        user_agent: userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      accessToken,
      refreshToken,
      data: {
        id: user.id,
        auth_user_id: user.auth_user_id,
        employee_id: user.employee_id,
        username: user.username,
        role_id: user.role_id,
        role_code: user.roles?.role_code || "",
        role_name: user.roles?.role_name || "",
        employee_code: user.employees?.employee_code || "",
        employee_name: `${user.employees?.first_name_th || ""} ${
          user.employees?.last_name_th || ""
        }`.trim(),
      },
    });
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Login ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}