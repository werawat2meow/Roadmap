import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  buildUserAccessContext,
  loadUserAccountByUsername,
} from "@/lib/auth/buildUserAccessContext";

import { writeEnterpriseAudit } from "@/lib/audit/logger";

const TOKEN_COOKIE_NAME = "employee_token";
const TOKEN_EXPIRES_IN = "10h";
const TOKEN_MAX_AGE = 60 * 60 * 10;

export async function POST(req) {
  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = body?.password;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก username และ password" },
        { status: 400 }
      );
    }

    const userAccount = await loadUserAccountByUsername(username);

    if (!userAccount || !userAccount.is_active) {
      await writeEnterpriseAudit({ event_type: "LOGIN_FAILED", event_status: "FAILED", severity: "WARNING", module_name: "AUTH", system_code: "HRMS", description: "Invalid username or inactive account", actor: { username }, request: req, endpoint: "/api/auth/login", http_method: "POST", http_status: 401 });
      return NextResponse.json(
        { success: false, error: "Username หรือ Password ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const passwordMatched = await bcrypt.compare(
      String(password),
      String(userAccount.password_hash || "")
    );

    if (!passwordMatched) {
      await writeEnterpriseAudit({ event_type: "LOGIN_FAILED", event_status: "FAILED", severity: "WARNING", module_name: "AUTH", system_code: "HRMS", description: "Incorrect password", actor: { username }, request: req, endpoint: "/api/auth/login", http_method: "POST", http_status: 401 });
      return NextResponse.json(
        { success: false, error: "Username หรือ Password ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const user = await buildUserAccessContext(userAccount);

    const token = jwt.sign(
      {
        user_id: userAccount.id,
        employee_id: userAccount.employee_id || null,
        username: userAccount.username,
      },
      process.env.JWT_SECRET || "dev-secret-key",
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    await supabaseAdmin
      .from("user_accounts")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", userAccount.id);

    const response = NextResponse.json({ success: true, user });

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TOKEN_MAX_AGE,
    });

    await writeEnterpriseAudit({ event_type: "LOGIN_SUCCESS", event_status: "SUCCESS", module_name: "AUTH", system_code: "HRMS", description: "User signed in", actor: { user_account_id: userAccount.id, employee_id: userAccount.employee_id, username: userAccount.username, role_code: user?.role_code ?? user?.role?.code ?? null }, request: req, endpoint: "/api/auth/login", http_method: "POST", http_status: 200 });
    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ไม่สามารถเข้าสู่ระบบได้" },
      { status: 500 }
    );
  }
}
