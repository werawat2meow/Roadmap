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

const DEFAULT_PAGE_SIZE =
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

    const id =
      cleanText(
        searchParams.get(
          "id"
        )
      );

    const companyId =
      cleanText(
        searchParams.get(
          "company_id"
        )
      );

    const search =
      sanitizeSearch(
        searchParams.get(
          "search"
        )
      );

    const status =
      cleanText(
        searchParams.get(
          "status"
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
            DEFAULT_PAGE_SIZE,
          1
        ),
        100
      );

    if (
      companyId &&
      !guard.canAccessId(
        companyId
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "คุณไม่มีสิทธิ์เข้าถึงงวดเงินเดือนของบริษัทนี้",
        },
        {
          status: 403,
        }
      );
    }

    let query =
      supabaseAdmin
        .from(
          "payroll_periods"
        )
        .select(
          `
            id,
            company_id,
            payroll_group_id,
            period_code,
            period_name,
            period_year,
            period_no,
            period_start_date,
            period_end_date,
            payment_date,
            status,
            is_locked,
            payroll_groups:payroll_group_id (
              id,
              payroll_group_code,
              payroll_group_name
            )
          `,
          {
            count:
              "exact",
          }
        );

    query =
      guard.applyScope(
        query,
        "company_id"
      );

    if (id) {
      query =
        query.eq(
          "id",
          id
        );
    }

    if (companyId) {
      query =
        query.eq(
          "company_id",
          companyId
        );
    }

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    } else {
      query =
        query.in(
          "status",
          [
            "draft",
            "open",
          ]
        );
    }

    if (search) {
      query =
        query.or(
          [
            `period_code.ilike.%${search}%`,
            `period_name.ilike.%${search}%`,
          ].join(",")
        );
    }

    query =
      query
        .order(
          "period_year",
          {
            ascending:
              false,
          }
        )
        .order(
          "period_no",
          {
            ascending:
              false,
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
      "GET_PAYROLL_RUN_PERIODS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "ไม่สามารถโหลดงวดเงินเดือนได้",
      },
      {
        status: 500,
      }
    );
  }
}
