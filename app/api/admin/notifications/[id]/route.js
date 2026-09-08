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
   PATCH /api/admin/notifications/[id]

   ใช้สำหรับ Mark Read / Unread
   และบังคับ user_account_id = Login User เสมอ
========================================================= */

export async function PATCH(
  req,
  {
    params,
  }
) {
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

    const {
      id,
    } =
      await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรหัสการแจ้งเตือน",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await req.json().catch(
        () => ({})
      );

    const isRead =
      body?.is_read !== false;

    const now =
      new Date()
        .toISOString();

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "notifications"
        )
        .update({
          is_read: isRead,
          read_at: isRead
            ? now
            : null,
          updated_at: now,
        })
        .eq(
          "id",
          id
        )
        .eq(
          "user_account_id",
          currentUser.id
        )
        .select(`
          id,
          is_read,
          read_at,
          updated_at
        `)
        .maybeSingle();

    if (error) {
      console.error(
        "PATCH notification error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถอัปเดตการแจ้งเตือนได้",
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบการแจ้งเตือน หรือคุณไม่มีสิทธิ์เข้าถึงรายการนี้",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "PATCH notification error:",
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
