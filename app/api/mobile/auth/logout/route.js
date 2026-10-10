import { NextResponse } from "next/server";

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
      "POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",

    "Access-Control-Max-Age":
      "86400",

    Vary: "Origin",
  };
}

/* =========================================================
   OPTIONS /api/mobile/auth/logout
========================================================= */

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

/* =========================================================
   POST /api/mobile/auth/logout
========================================================= */

export async function POST(req) {
  try {
    return NextResponse.json(
      {
        success: true,
        message:
          "ออกจากระบบเรียบร้อยแล้ว",
      },
      {
        status: 200,
        headers:
          getCorsHeaders(req),
      }
    );
  } catch (error) {
    console.error(
      "MOBILE_LOGOUT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "ไม่สามารถออกจากระบบได้",
      },
      {
        status: 500,
        headers:
          getCorsHeaders(req),
      }
    );
  }
}