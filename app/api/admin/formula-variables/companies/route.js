import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function cleanText(
  value
) {
  return String(
    value || ""
  ).trim();
}

function sanitizeSearch(
  value
) {
  return cleanText(
    value
  )
    .replaceAll(
      ",",
      " "
    )
    .replaceAll(
      "(",
      " "
    )
    .replaceAll(
      ")",
      " "
    )
    .replaceAll(
      "%",
      ""
    )
    .trim();
}

export async function GET(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.formula_variables",
        "view",
        {
          scopeType:
            "company",
        }
      );

    if (
      !guard.ok
    ) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(
        req.url
      );

    const id =
      cleanText(
        searchParams.get(
          "id"
        )
      );

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
            DEFAULT_PAGE_SIZE,
          1
        ),
        MAX_PAGE_SIZE
      );

    if (
      id &&
      !guard.canAccessId(
        id
      )
    ) {
      return NextResponse.json(
        {
          success:
            false,

          error:
            "คุณไม่มีสิทธิ์เข้าถึงบริษัทนี้",
        },
        {
          status:
            403,
        }
      );
    }

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

    if (id) {
      query =
        query.eq(
          "id",
          id
        );
    }

    if (
      search
    ) {
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
        .eq(
          "status",
          "active"
        )
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

    const total =
      count || 0;

    return NextResponse.json({
      success:
        true,

      data:
        data || [],

      pagination: {
        page,
        pageSize,
        total,

        totalPages:
          Math.ceil(
            total /
              pageSize
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET_FORMULA_VARIABLE_COMPANIES_ERROR:",
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
        status:
          500,
      }
    );
  }
}
