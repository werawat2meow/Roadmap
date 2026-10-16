import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  buildUserAccessContext,
  loadUserAccountByUsername,
} from "@/lib/auth/buildUserAccessContext";

/* =========================================================
   Config
========================================================= */

const TOKEN_EXPIRES_IN =
  process.env.MOBILE_TOKEN_EXPIRES_IN ||
  "10h";

const TOKEN_EXPIRES_SECONDS =
  Number(
    process.env.MOBILE_TOKEN_EXPIRES_SECONDS ||
      36000
  );

const ALLOWED_ORIGINS =
  String(
    process.env.MOBILE_ALLOWED_ORIGINS ||
      ""
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/* =========================================================
   CORS
========================================================= */

function getCorsHeaders(req) {
  const origin =
    req.headers.get("origin");

  const isAllowed =
    origin &&
    ALLOWED_ORIGINS.includes(origin);

  return {
    ...(isAllowed
      ? {
          "Access-Control-Allow-Origin":
            origin,
        }
      : {}),

    "Access-Control-Allow-Methods":
      "POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",

    "Access-Control-Max-Age":
      "86400",

    Vary: "Origin",
  };
}

/* =========================================================
   OPTIONS /api/mobile/auth/login
========================================================= */

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

/* =========================================================
   POST /api/mobile/auth/login
========================================================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const username = String(
      body?.username || ""
    ).trim();

    const password =
      body?.password;

    /* =====================================================
       1. Validate Input
    ===================================================== */

    if (
      !username ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอก username และ password",
        },
        {
          status: 400,
          headers:
            getCorsHeaders(req),
        }
      );
    }

    /* =====================================================
       2. Load User Account
    ===================================================== */

    const userAccount =
      await loadUserAccountByUsername(
        username
      );

    if (
      !userAccount ||
      !userAccount.is_active
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Username หรือ Password ไม่ถูกต้อง",
        },
        {
          status: 401,
          headers:
            getCorsHeaders(req),
        }
      );
    }

    /* =====================================================
       3. Verify Password
    ===================================================== */

    const passwordMatched =
      await bcrypt.compare(
        String(password),
        String(
          userAccount.password_hash ||
            ""
        )
      );

    if (!passwordMatched) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Username หรือ Password ไม่ถูกต้อง",
        },
        {
          status: 401,
          headers:
            getCorsHeaders(req),
        }
      );
    }

    /* =====================================================
       4. Build Permission + Scope Context
    ===================================================== */

    const user =
      await buildUserAccessContext(
        userAccount
      );

    /* =====================================================
       5. Create Mobile JWT
    ===================================================== */

    const jwtSecret =
      process.env.JWT_SECRET ||
      "dev-secret-key";

    const accessToken =
      jwt.sign(
        {
          user_id:
            userAccount.id,

          employee_id:
            userAccount.employee_id ||
            null,

          username:
            userAccount.username,

          token_type:
            "mobile",
        },

        jwtSecret,

        {
          expiresIn:
            TOKEN_EXPIRES_IN,
        }
      );

    /* =====================================================
       6. Update Last Login
    ===================================================== */

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("user_accounts")
      .update({
        last_login_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        userAccount.id
      );

    if (updateError) {
      console.error(
        "MOBILE_LOGIN_UPDATE_LAST_LOGIN_ERROR:",
        updateError
      );
    }

    /* =====================================================
       7. Response
    ===================================================== */

    return NextResponse.json(
      {
        success: true,

        access_token:
          accessToken,

        token_type:
          "Bearer",

        expires_in:
          TOKEN_EXPIRES_SECONDS,

        user,
      },
      {
        status: 200,
        headers:
          getCorsHeaders(req),
      }
    );
  } catch (error) {
    console.error(
      "MOBILE_LOGIN_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "ไม่สามารถเข้าสู่ระบบได้",
      },
      {
        status: 500,
        headers:
          getCorsHeaders(req),
      }
    );
  }
}