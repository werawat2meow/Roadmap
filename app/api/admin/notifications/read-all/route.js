import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  getNotificationUser,
} from "@/lib/auth/getNotificationUser";

/* =========================================================
   POST /api/admin/notifications/read-all
========================================================= */

export async function POST() {
  try {
    const currentUser =
      await getNotificationUser();

    if (!currentUser) {
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

    const now =
      new Date()
        .toISOString();

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "notifications"
        )
        .update({
          is_read: true,
          read_at: now,
          updated_at: now,
        })
        .eq(
          "user_account_id",
          currentUser.id
        )
        .eq(
          "is_read",
          false
        );

    if (error) {
      console.error(
        "POST notifications read-all error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถทำเครื่องหมายอ่านทั้งหมดได้",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "POST notifications read-all error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "เกิดข้อผิดพลาดในการอัปเดตการแจ้งเตือน",
      },
      {
        status: 500,
      }
    );
  }
}
