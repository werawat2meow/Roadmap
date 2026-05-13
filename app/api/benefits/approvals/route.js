import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

async function getCurrentUser() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("employee_token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || "dev-secret-key"
  );

  const userId = decoded?.user_id;

  if (!userId) return null;

  const { data, error } = await supabaseAdmin
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
      ),
      role_permissions (
        permissions (
          permission_code
        )
      )
    `)
    .eq("id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) {
    return null;
  }

  const permissions =
    data.role_permissions
      ?.map((item) => item.permissions?.permission_code)
      ?.filter(Boolean) || [];

  return {
    ...data,
    permissions,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
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

    const canApprove =
      user.permissions.includes(
        "benefit.request.approve"
      );

    if (!canApprove) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_requests")
      .select(`
        id,
        request_no,
        employee_id,
        benefit_id,
        requested_amount,
        approved_amount,
        request_date,
        status,
        remark,
        created_at,

        employees (
          id,
          employee_code,
          first_name_th,
          last_name_th
        ),

        benefits (
          id,
          benefit_code,
          benefit_name
        )
      `)
      .in("status", [
        "pending",
        "in_review",
      ])
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error:
            "โหลดรายการอนุมัติไม่สำเร็จ",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error(
      "BENEFIT_APPROVALS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "เกิดข้อผิดพลาดภายในระบบ",
      },
      {
        status: 500,
      }
    );
  }
}