import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(req) {
  try {
    const body = await req.json();

    const currentPassword = body?.currentPassword?.trim();
    const newPassword = body?.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกข้อมูลให้ครบ",
        },
        {
          status: 400,
        }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร",
        },
        {
          status: 400,
        }
      );
    }

    const cookieStore = await cookies();

    const token =
      cookieStore.get("employee_token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "dev-secret-key"
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Token ไม่ถูกต้อง",
        },
        {
          status: 401,
        }
      );
    }

    const userId = decoded?.user_id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: userAccount,
      error: userError,
    } = await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        username,
        password_hash,
        is_active
      `)
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      console.error(userError);

      return NextResponse.json(
        {
          success: false,
          error: "เกิดข้อผิดพลาดในการค้นหาผู้ใช้งาน",
        },
        {
          status: 500,
        }
      );
    }

    if (!userAccount || !userAccount.is_active) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบบัญชีผู้ใช้งาน",
        },
        {
          status: 401,
        }
      );
    }

    if (!userAccount.password_hash) {
      return NextResponse.json(
        {
          success: false,
          error: "บัญชีนี้ยังไม่มีรหัสผ่าน",
        },
        {
          status: 400,
        }
      );
    }

    const passwordMatched = await bcrypt.compare(
      currentPassword,
      userAccount.password_hash
    );

    if (!passwordMatched) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสผ่านเดิมไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      userAccount.password_hash
    );

    if (samePassword) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม",
        },
        {
          status: 400,
        }
      );
    }

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      12
    );

    const { error: updateError } =
      await supabaseAdmin
        .from("user_accounts")
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userAccount.id);

    if (updateError) {
      console.error(updateError);

      return NextResponse.json(
        {
          success: false,
          error: "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        },
        {
          status: 500,
        }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });

    response.cookies.set("employee_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error(
      "CHANGE_PASSWORD_ROUTE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "เกิดข้อผิดพลาดภายในระบบ",
      },
      {
        status: 500,
      }
    );
  }
}