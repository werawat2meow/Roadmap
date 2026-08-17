import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  buildUserAccessContext,
  loadUserAccountByUsername,
} from "@/lib/auth/buildUserAccessContext";

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
<<<<<<< HEAD
        role: primaryRole,
        role_name: primaryRoleName,
        // permissions,
        employee_code: employee?.employee_code || null,
        full_name: fullNameTh,
      },
      process.env.JWT_SECRET || "dev-secret-key",
      { expiresIn: "10h" }
=======
      },
      process.env.JWT_SECRET || "dev-secret-key",
      { expiresIn: TOKEN_EXPIRES_IN }
>>>>>>> test_merge_all
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
<<<<<<< HEAD
      maxAge: 60 * 60 * 10, // 10 hours
=======
      maxAge: TOKEN_MAX_AGE,
>>>>>>> test_merge_all
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ไม่สามารถเข้าสู่ระบบได้" },
      { status: 500 }
    );
  }
}
