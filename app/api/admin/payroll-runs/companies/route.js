import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  cleanText,
  sanitizeSearch,
} from "../_helpers";

const PAGE_SIZE =
  20;

export async function GET(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_runs",
        "view",
        {
          scopeType:
            "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(req.url);

    const search =
      sanitizeSearch(
        searchParams.get(
          "search"
        )
      );

    const page =
      Math.max(
        Number(
          searchParams.get(
            "page"
          )
        ) || 1,
        1
      );

    const pageSize =
      Math.min(
        Math.max(
          Number(
            searchParams.get(
              "pageSize"
            )
          ) ||
            PAGE_SIZE,
          1
        ),
        100
      );

    let query =
      supabaseAdmin
        .from(
          "companies"
        )
        .select(
          `
            id,
            company_code,
            company_name_th,
            company_name_en,
            status,
            sort_order
          `,
          {
            count:
              "exact",
          }
        );

    query =
      guard.applyScope(
        query,
        "id"
      );

    query =
      query.eq(
        "status",
        "active"
      );

    if (search) {
      query =
        query.or(
          [
            `company_code.ilike.%${search}%`,
            `company_name_th.ilike.%${search}%`,
            `company_name_en.ilike.%${search}%`,
          ].join(",")
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
          "company_code",
          {
            ascending:
              true,
          }
        );

    const from =
      (page - 1) *
      pageSize;

    const to =
      from +
      pageSize -
      1;

    const {
      data,
      error,
      count,
    } =
      await query.range(
        from,
        to
      );

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success:
        true,

      data:
        data || [],

      pagination: {
        page,
        pageSize,
        total:
          count || 0,

        totalPages:
          Math.ceil(
            (count || 0) /
            pageSize
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET_PAYROLL_RUN_COMPANIES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "ไม่สามารถโหลดบริษัทได้",
      },
      {
        status: 500,
      }
    );
  }
}
