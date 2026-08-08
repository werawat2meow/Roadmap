import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  buildUserAccessContext,
  loadUserAccountByUsername,
} from "@/lib/auth/buildUserAccessContext";

const TOKEN_COOKIE_NAME ="employee_token";
const TOKEN_EXPIRES_IN = "10h";
const TOKEN_MAX_AGE =60 * 60 * 10;

/* =========================================================
   POST /api/auth/login
========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const username =
      String(
        body?.username || ""
      ).trim();

    const password =
      body?.password;

    if (!username || !password) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอก username และ password",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       1. Load User Account
    ===================================================== */

    const userAccount =
      await loadUserAccountByUsername(
        username
      );

    if (!userAccount) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        },
        {
          status: 401,
        }
      );
    }

    if (!userAccount.is_active) {
      return NextResponse.json(
        {
          success: false,
          error:
            "บัญชีนี้ถูกปิดการใช้งาน",
        },
        {
          status: 403,
        }
      );
    }

    if (!userAccount.password_hash) {
      return NextResponse.json(
        {
          success: false,
          error:
            "บัญชีนี้ยังไม่มีรหัสผ่านในระบบ",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       2. Check Password
    ===================================================== */

    const isPasswordValid =
      await bcrypt.compare(
        password,
        userAccount.password_hash
      );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       3. Build User Context

       JSON ส่วนนี้จะเหมือน /api/auth/me
    ===================================================== */

    const user =
      await buildUserAccessContext(
        userAccount
      );

    /* =====================================================
       4. Update Last Login
    ===================================================== */

    const { error: lastLoginError } =
      await supabaseAdmin
        .from("user_accounts")
        .update({
          last_login_at:
            new Date().toISOString(),
        })
        .eq("id", userAccount.id);

    if (lastLoginError) {
      console.error(
        "LAST_LOGIN_UPDATE_ERROR:",
        lastLoginError
      );
    }

    /* =====================================================
       5. JWT

       ไม่ใส่ Scope ทั้งหมดลง JWT
       ใช้ user_id ไปตรวจ Database ใหม่
    ===================================================== */

    const token = jwt.sign(
      {
        user_id: user.id,
        employee_id:
          user.employee_id,
        username:
          user.username,
        role_id:
          user.role_id,
        role:
          user.role,
        employee_code:
          user.employee_code,
        full_name:
          user.full_name,
      },
      process.env.JWT_SECRET ||
        "dev-secret-key",
      {
        expiresIn:
          TOKEN_EXPIRES_IN,
      }
    );

    /* =====================================================
       6. Response
    ===================================================== */

    const response =
      NextResponse.json({
        success: true,

        message:
          "เข้าสู่ระบบสำเร็จ",

        user,
      });

    response.cookies.set(
      TOKEN_COOKIE_NAME,
      token,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "lax",

        path: "/",

        maxAge:
          TOKEN_MAX_AGE,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "LOGIN_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "เกิดข้อผิดพลาดภายในระบบ",
        detail:
          process.env.NODE_ENV ===
          "development"
            ? error?.message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}