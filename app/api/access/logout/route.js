/*


STEP 4: Logout
  POST http://localhost:3000/api/access/logout
  Body
  {
    "refreshToken": "xxxxx"
  }
  ลบ accessToken และ refreshToken ออกจาก localStorage



  
  const refreshToken = localStorage.getItem("refreshToken");

  await fetch("/api/access/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");


*/

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { hashToken } from "@/lib/jwt";

export async function POST(req) {
  try {
    const body = await req.json();
    const refreshToken = body?.refreshToken;

    if (refreshToken) {
      await supabaseAdmin
        .from("user_refresh_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .eq("refresh_token_hash", hashToken(refreshToken));
    }

    return NextResponse.json({
      success: true,
      message: "ออกจากระบบสำเร็จ",
    });
  } catch (error) {
    console.error("LOGOUT_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "Logout ไม่สำเร็จ" },
      { status: 500 }
    );
  }
}