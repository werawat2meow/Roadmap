import { NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import {
  buildUserAccessContext,
  loadUserAccountById,
} from "@/lib/auth/buildUserAccessContext";

/* =========================================================
   Config
========================================================= */

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
      "GET, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",

    "Access-Control-Max-Age":
      "86400",

    Vary: "Origin",
  };
}

/* =========================================================
   OPTIONS /api/mobile/auth/me
========================================================= */

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

/* =========================================================
   Helpers
========================================================= */

function getBearerToken(req) {
  const authorization =
    req.headers.get(
      "authorization"
    );

  if (!authorization) {
    return null;
  }

  const [
    scheme,
    token,
  ] = authorization
    .trim()
    .split(/\s+/);

  if (
    scheme?.toLowerCase() !==
      "bearer" ||
    !token
  ) {
    return null;
  }

  return token;
}

/* =========================================================
   GET /api/mobile/auth/me
========================================================= */

export async function GET(req) {
  try {
    /* =====================================================
       1. Read Bearer Token
    ===================================================== */

    const token =
      getBearerToken(req);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized",
        },
        {
          status: 401,
          headers:
            getCorsHeaders(req),
        }
      );
    }

    /* =====================================================
       2. Verify JWT
    ===================================================== */

    let decoded;

    try {
      decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET ||
            "dev-secret-key"
        );
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Token ไม่ถูกต้องหรือหมดอายุ",
        },
        {
          status: 401,
          headers:
            getCorsHeaders(req),
        }
      );
    }

    /* =====================================================
       3. Verify Mobile Token Type
    ===================================================== */

    if (
      decoded?.token_type !==
      "mobile"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid token type",
        },
        {
          status: 401,
          headers:
            getCorsHeaders(req),
        }
      );
    }

    const userAccountId =
      decoded?.user_id;

    if (!userAccountId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid token",
        },
        {
          status: 401,
          headers:
            getCorsHeaders(req),
        }
      );
    }

    /* =====================================================
       4. Reload User Account From Database
    ===================================================== */

    const userAccount =
      await loadUserAccountById(
        userAccountId
      );

    if (
      !userAccount ||
      !userAccount.is_active
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "บัญชีผู้ใช้งานไม่พร้อมใช้งาน",
        },
        {
          status: 401,
          headers:
            getCorsHeaders(req),
        }
      );
    }

    /* =====================================================
       5. Build Latest Permission + Scope
    ===================================================== */

    const user =
      await buildUserAccessContext(
        userAccount
      );

    /* =====================================================
       6. Response
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
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
      "MOBILE_AUTH_ME_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้",
      },
      {
        status: 500,
        headers:
          getCorsHeaders(req),
      }
    );
  }
}