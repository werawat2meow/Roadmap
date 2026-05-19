import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET ||
      "dev-secret-key"
  );

  const userId = decoded?.user_id;

  if (!userId) return null;

  const { data } =
    await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        employee_id,
        role_id,
        username,
        is_active,

        roles (
          role_code,
          role_name
        )
      `)
      .eq("id", userId)
      .maybeSingle();

  if (
    !data ||
    !data.is_active
  ) {
    return null;
  }

  let permissions = [];

  if (data.role_id) {
    const {
      data: permissionRows,
    } = await supabaseAdmin
      .from("role_permissions")
      .select(`
        permissions (
          permission_code,
          is_active
        )
      `)
      .eq(
        "role_id",
        data.role_id
      );

    permissions =
      permissionRows
        ?.map(
          (row) =>
            row.permissions
        )
        ?.filter(
          (perm) =>
            perm?.is_active
        )
        ?.map(
          (perm) =>
            perm.permission_code
        ) || [];
  }

  return {
    ...data,
    permissions,
  };
}

function hasPermission(user,permission) {
  const roleCode =
    user?.roles?.role_code;

  if (
    roleCode ===
    "SUPER_ADMIN"
  ) {
    return true;
  }

  return (
    user?.permissions?.includes(
      permission
    ) || false
  );
}

export async function GET(
  req
) {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized",
        },
        { status: 401 }
      );
    }

    const canView =
      hasPermission(
        user,
        "benefit.request.view"
      ) ||
      hasPermission(
        user,
        "benefit.request.approve"
      );

    if (!canView) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่มีสิทธิ์ดูรายการอนุมัติ",
        },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const status =
      searchParams.get(
        "status"
      );

    const search =
      searchParams.get(
        "search"
      );

    let query =
      supabaseAdmin
        .from(
          "benefit_requests"
        )
        .select(`
          id,
          request_no,
          employee_id,
          benefit_id,
          requested_amount,
          status,
          remark,
          created_at,
          updated_at,

          employees (
            employee_code,
            first_name_th,
            last_name_th
          ),

          benefits (
            benefit_code,
            benefit_name
          )
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "BENEFIT_APPROVALS_GET_QUERY_ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        { status: 500 }
      );
    }

    let filtered =
      data || [];

    if (search) {
      const keyword =
        search.toLowerCase();

      filtered =
        filtered.filter(
          (item) => {
            const emp =
              item.employees;

            return (
              item.request_no
                ?.toLowerCase()
                ?.includes(
                  keyword
                ) ||
              emp?.employee_code
                ?.toLowerCase()
                ?.includes(
                  keyword
                ) ||
              emp?.first_name_th
                ?.toLowerCase()
                ?.includes(
                  keyword
                ) ||
              emp?.last_name_th
                ?.toLowerCase()
                ?.includes(
                  keyword
                ) ||
              item?.benefits?.benefit_name
                ?.toLowerCase()
                ?.includes(
                  keyword
                )
            );
          }
        );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error(
      "BENEFIT_APPROVALS_GET_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "โหลดข้อมูลอนุมัติไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req
) {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body =
      await req.json();

    const requestId =
      body?.request_id;

    const status =
      body?.status;

    if (!requestId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ request_id",
        },
        { status: 400 }
      );
    }

    if (
      ![
        "approved",
        "rejected",
      ].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "สถานะไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (
      status ===
        "approved" &&
      !hasPermission(
        user,
        "benefit.request.approve"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่มีสิทธิ์อนุมัติ",
        },
        { status: 403 }
      );
    }

    if (
      status ===
        "rejected" &&
      !hasPermission(
        user,
        "benefit.request.edit"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่มีสิทธิ์ปฏิเสธคำขอ",
        },
        { status: 403 }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "benefit_requests"
      )
      .update({
        status,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error(
        "BENEFIT_APPROVALS_PUT_QUERY_ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "BENEFIT_APPROVALS_PUT_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "อัปเดตสถานะไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req
) {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized",
        },
        { status: 401 }
      );
    }

    if (
      !hasPermission(
        user,
        "benefit.request.delete"
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่มีสิทธิ์ลบคำขอ",
        },
        { status: 403 }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ id",
        },
        { status: 400 }
      );
    }

    const { error } =
      await supabaseAdmin
        .from(
          "benefit_requests"
        )
        .delete()
        .eq("id", id);

    if (error) {
      console.error(
        "BENEFIT_APPROVALS_DELETE_QUERY_ERROR:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "BENEFIT_APPROVALS_DELETE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "ลบคำขอไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}