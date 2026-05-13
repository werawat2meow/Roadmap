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
    process.env.JWT_SECRET ||
      "dev-secret-key"
  );

  const userId = decoded?.user_id;

  if (!userId) return null;

  const { data, error } =
    await supabaseAdmin
      .from("user_accounts")
      .select(`
        id,
        is_active,

        role_permissions (
          permissions (
            permission_code
          )
        )
      `)
      .eq("id", userId)
      .maybeSingle();

  if (
    error ||
    !data ||
    !data.is_active
  ) {
    return null;
  }

  const permissions =
    data.role_permissions
      ?.map(
        (item) =>
          item.permissions
            ?.permission_code
      )
      ?.filter(Boolean) || [];

  return {
    ...data,
    permissions,
  };
}

export async function GET() {
  try {
    const user =
      await getCurrentUser();

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

    const canView =
      user.permissions.includes(
        "benefit.rule.view"
      );

    if (!canView) {
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

    const { data, error } =
      await supabaseAdmin
        .from("benefit_rules")
        .select(`
          id,
          benefit_id,
          position_level,
          min_service_months,
          max_service_months,
          quota_amount,
          quota_unit,
          quota_frequency,
          discount_percent,
          is_unlimited,
          rule_note,
          is_active,

          benefits (
            id,
            benefit_code,
            benefit_name,

            benefit_categories (
              category_name
            )
          )
        `)
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error:
            "โหลด Benefit Rules ไม่สำเร็จ",
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
      "BENEFIT_RULES_ERROR:",
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