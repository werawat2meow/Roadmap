/*
🔄 STEP 3: Refresh Token
    POST http://localhost:3000/api/access/refresh
  เอา accessToken ใหม่ไปใช้ต่อ


  const refreshToken = localStorage.getItem("refreshToken");

  const res = await fetch("/api/access/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const json = await res.json();

  localStorage.setItem("accessToken", json.accessToken);
  localStorage.setItem("refreshToken", json.refreshToken);



  1) Login
  POST /api/access/login
  ได้ accessToken + refreshToken

  2) ยิง API ปกติ
  ใช้ accessToken แนบ Authorization

  3) ถ้า API ตอบ 401 เพราะ accessToken หมดอายุ
  ค่อยยิง
  POST /api/access/refresh

  4) ได้ accessToken ใหม่
  เอาไปยิง API เดิมอีกครั้ง
*/

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {verifyRefreshToken,createAccessToken,createRefreshToken,hashToken,} from "@/lib/jwt";

export async function POST(req) {
  try {
    const body = await req.json();
    const refreshToken = body?.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Missing refresh token" },
        { status: 401 }
      );
    }

    const payload = await verifyRefreshToken(refreshToken);
    const refreshTokenHash = hashToken(refreshToken);

    const { data: storedToken, error } = await supabaseAdmin
      .from("user_refresh_tokens")
      .select("id, user_id, expires_at, revoked_at")
      .eq("user_id", payload.user_id)
      .eq("refresh_token_hash", refreshTokenHash)
      .maybeSingle();

    if (error) throw error;

    if (!storedToken || storedToken.revoked_at) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    if (new Date(storedToken.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Refresh token expired" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      user_id: payload.user_id,
      auth_user_id: payload.auth_user_id,
      employee_id: payload.employee_id,
      role_id: payload.role_id,
      username: payload.username,
      role_code: payload.role_code,
    };

    const newAccessToken = await createAccessToken(tokenPayload);
    const newRefreshToken = await createRefreshToken(tokenPayload);

    await supabaseAdmin
      .from("user_refresh_tokens")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", storedToken.id);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabaseAdmin.from("user_refresh_tokens").insert({
      user_id: payload.user_id,
      refresh_token_hash: hashToken(newRefreshToken),
      expires_at: expiresAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("REFRESH_TOKEN_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Refresh token ไม่ถูกต้อง" },
      { status: 401 }
    );
  }
}