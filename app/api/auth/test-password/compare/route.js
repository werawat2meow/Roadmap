// app/api/auth/test-password/compare/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const password = body?.password;
    const hash = body?.hash;

    if (!password || !hash) {
      return NextResponse.json(
        { error: "กรุณากรอก password และ hash" },
        { status: 400 }
      );
    }

    const isMatch = await bcrypt.compare(password, hash);

    return NextResponse.json({
      success: true,
      is_match: isMatch,
    });
  } catch (error) {
    console.error("COMPARE_PASSWORD_ERROR:", error);

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการ compare password" },
      { status: 500 }
    );
  }
}