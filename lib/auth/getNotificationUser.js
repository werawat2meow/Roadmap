import jwt from "jsonwebtoken";

import {
  cookies,
} from "next/headers";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

/* =========================================================
   Current User For Notification API

   ยึด Auth ปัจจุบันของระบบ:
   - Cookie: employee_token
   - JWT payload: user_id = user_accounts.id
   - Secret: JWT_SECRET || dev-secret-key
========================================================= */

export async function getNotificationUser() {
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

    const userId =
      decoded?.user_id;

    if (!userId) {
      return null;
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "user_accounts"
        )
        .select(`
          id,
          employee_id,
          username,
          is_active
        `)
        .eq(
          "id",
          userId
        )
        .maybeSingle();

    if (
      error ||
      !data ||
      !data.is_active
    ) {
      return null;
    }

    return data;
  } catch (error) {
    console.error(
      "getNotificationUser error:",
      error
    );

    return null;
  }
}
