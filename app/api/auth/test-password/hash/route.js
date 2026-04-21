// app/api/auth/test-password/hash/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();
    const password = body?.password;

    if (!password) {
      return NextResponse.json(
        { error: "กรุณากรอก password" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    return NextResponse.json({
      success: true,
      hash,
    });
  } catch (error) {
    console.error("HASH_PASSWORD_ERROR:", error);

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการ hash password" },
      { status: 500 }
    );
  }
}