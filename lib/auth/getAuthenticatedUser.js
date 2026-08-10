import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { supabaseAdmin } from "@/lib/supabaseServer";

const TOKEN_COOKIE_NAME = "employee_token";

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get(
    TOKEN_COOKIE_NAME
  )?.value;

  if (!token) {
    return {
      user: null,
      error: "Unauthorized",
      status: 401,
    };
  }

  let decoded;

  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ||
        "dev-secret-key"
    );
  } catch {
    return {
      user: null,
      error:
        "Session หมดอายุหรือ Token ไม่ถูกต้อง",
      status: 401,
    };
  }

  const userId = decoded?.user_id;

  if (!userId) {
    return {
      user: null,
      error:
        "Token ไม่มีข้อมูลผู้ใช้งาน",
      status: 401,
    };
  }

  const { data: userAccount, error } =
    await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        role_id,
        username,
        is_active
      `)
      .eq("id", userId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (
    !userAccount ||
    !userAccount.is_active
  ) {
    return {
      user: null,
      error:
        "ไม่พบบัญชีผู้ใช้งานหรือบัญชีถูกปิดใช้งาน",
      status: 401,
    };
  }

  return {
    user: userAccount,
    decoded,
    error: null,
    status: 200,
  };
}