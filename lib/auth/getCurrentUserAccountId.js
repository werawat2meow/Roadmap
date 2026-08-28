import jwt from "jsonwebtoken";

import {
  cookies,
} from "next/headers";

/* =========================================================
   Current User Account ID
   ใช้ JWT employee_token ตามระบบ Auth ปัจจุบัน
========================================================= */

export async function getCurrentUserAccountId() {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "employee_token"
      )?.value;

    if (!token) {
      return null;
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "dev-secret-key"
      );

    return (
      decoded?.user_id ||
      null
    );
  } catch {
    return null;
  }
}
