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
   Helpers
========================================================= */

function parsePositiveInteger(
  value,
  fallback
) {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
}

/* =========================================================
   GET /api/admin/notifications

   สำคัญ:
   Notification เป็นข้อมูลของ User โดยตรง
   จึง filter ด้วย user_account_id ของ Login User เสมอ
========================================================= */

export async function GET(
  req
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
      searchParams,
    } =
      new URL(req.url);

    const page =
      Math.max(
        parsePositiveInteger(
          searchParams.get(
            "page"
          ),
          1
        ),
        1
      );

    const pageSize =
      Math.min(
        Math.max(
          parsePositiveInteger(
            searchParams.get(
              "pageSize"
            ),
            10
          ),
          1
        ),
        50
      );

    const unreadOnly =
      searchParams.get(
        "unread_only"
      ) === "true";

    const from =
      (page - 1) *
      pageSize;

    const to =
      from +
      pageSize -
      1;

    /* =====================================================
       1. Notification List
    ===================================================== */

    let listQuery =
      supabaseAdmin
        .from(
          "notifications"
        )
        .select(
          `
            id,
            user_account_id,
            company_id,
            notification_type,
            title,
            message,
            module_code,
            entity_type,
            entity_id,
            action_url,
            priority,
            metadata,
            is_read,
            read_at,
            created_at,
            updated_at
          `,
          {
            count: "exact",
          }
        )
        .eq(
          "user_account_id",
          currentUser.id
        );

    if (unreadOnly) {
      listQuery =
        listQuery.eq(
          "is_read",
          false
        );
    }

    listQuery =
      listQuery
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .range(
          from,
          to
        );

    const {
      data,
      error,
      count,
    } =
      await listQuery;

    if (error) {
      console.error(
        "GET notifications list error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถโหลดการแจ้งเตือนได้",
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       2. Unread Count
    ===================================================== */

    const {
      count: unreadCount,
      error: unreadError,
    } =
      await supabaseAdmin
        .from(
          "notifications"
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq(
          "user_account_id",
          currentUser.id
        )
        .eq(
          "is_read",
          false
        );

    if (unreadError) {
      console.error(
        "GET notifications unread count error:",
        unreadError
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      unread_count:
        unreadCount || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error(
      "GET notifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "เกิดข้อผิดพลาดในการโหลดการแจ้งเตือน",
      },
      {
        status: 500,
      }
    );
  }
}
