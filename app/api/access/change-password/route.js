/*

  await fetch("/api/access/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });



*/


import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/logActivity";
import { verifyAccessToken } from "@/lib/jwt";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim(): "";
    const requestIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "กรุณาเข้าสู่ระบบ" },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload?.user_id) {
      return NextResponse.json(
        { success: false, error: "Token ไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const currentPassword = body?.currentPassword?.trim();
    const newPassword = body?.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่",
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร",
        },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
        },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("user_accounts")
      .select("id, username, password_hash, is_active")
      .eq("id", payload.user_id)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "ไม่พบผู้ใช้งาน" },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: "บัญชีถูกปิดการใช้งาน" },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password_hash || ""
    );

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "รหัสผ่านเดิมไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from("user_accounts")
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    await logActivity({
      userId: user.id,
      moduleName: "AUTH",
      actionType: "CHANGE_PASSWORD",
      referenceTable: "user_accounts",
      referenceId: user.id,
      description: `เปลี่ยนรหัสผ่านสำเร็จ: ${user.username}`,
      newData: {
        ip: requestIp,
        user_agent: userAgent,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}