import { NextResponse } from "next/server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import {
  buildUserAccessContext,
  loadUserAccountById,
} from "@/lib/auth/buildUserAccessContext";

const TOKEN_COOKIE_NAME =
  "employee_token";

/* =========================================================
   Unauthorized
========================================================= */

function unauthorizedResponse(
  message = "Unauthorized"
) {
  const response =
    NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 401,
      }
    );

  response.cookies.set(
    TOKEN_COOKIE_NAME,
    "",
    {
      httpOnly: true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite: "lax",

      path: "/",

      maxAge: 0,
    }
  );

  return response;
}

/* =========================================================
   GET /api/auth/me
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       1. Read Cookie
    ===================================================== */

    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        TOKEN_COOKIE_NAME
      )?.value;

    if (!token) {
      return unauthorizedResponse(
        "ไม่พบข้อมูลการเข้าสู่ระบบ"
      );
    }

    /* =====================================================
       2. Verify Token
    ===================================================== */

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "dev-secret-key"
      );
    } catch (error) {
      console.error(
        "JWT_VERIFY_ERROR:",
        error
      );

      return unauthorizedResponse(
        "Session หมดอายุหรือ Token ไม่ถูกต้อง"
      );
    }

    const userId =
      decoded?.user_id;

    if (!userId) {
      return unauthorizedResponse(
        "Token ไม่มีข้อมูลผู้ใช้งาน"
      );
    }

    /* =====================================================
       3. Load User Account
    ===================================================== */

    const userAccount =
      await loadUserAccountById(
        userId
      );

    if (!userAccount) {
      return unauthorizedResponse(
        "ไม่พบบัญชีผู้ใช้งาน"
      );
    }

    if (!userAccount.is_active) {
      return unauthorizedResponse(
        "บัญชีผู้ใช้งานถูกปิดการใช้งาน"
      );
    }

    /* =====================================================
       4. Build User Context

       JSON รูปแบบเดียวกับ Login
    ===================================================== */

    const user =
      await buildUserAccessContext(
        userAccount
      );

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "GET_ME_ERROR:",
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