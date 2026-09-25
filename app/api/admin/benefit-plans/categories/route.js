import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

function cleanText(
  value
) {
  return String(
    value ||
      ""
  ).trim();
}

export async function GET(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        "benefits.benefit_plans",
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(req.url);

    const search =
      cleanText(
        searchParams.get(
          "search"
        )
      );

    const status =
      cleanText(
        searchParams.get(
          "status"
        )
      ).toLowerCase();

    let query =
      supabaseAdmin
        .from(
          "benefit_categories"
        )
        .select(
          `
            id,
            category_code,
            category_name,
            description,
            sort_order,
            is_active
          `
        );

    if (search) {
      query =
        query.or(
          [
            `category_code.ilike.%${search}%`,
            `category_name.ilike.%${search}%`,
          ].join(
            ","
          )
        );
    }

    if (
      status ===
      "active"
    ) {
      query =
        query.eq(
          "is_active",
          true
        );
    }

    if (
      status ===
      "inactive"
    ) {
      query =
        query.eq(
          "is_active",
          false
        );
    }

    query =
      query
        .order(
          "sort_order",
          {
            ascending:
              true,
          }
        )
        .order(
          "category_name",
          {
            ascending:
              true,
          }
        )
        .limit(
          1000
        );

    const {
      data,
      error,
    } =
      await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success:
        true,

      data:
        data || [],

      total:
        data?.length ||
        0,
    });
  } catch (error) {
    console.error(
      "GET_BENEFIT_PLAN_CATEGORIES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "ไม่สามารถโหลดประเภทสวัสดิการได้",
      },
      {
        status:
          500,
      }
    );
  }
}
