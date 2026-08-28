import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function cleanText(value) {
  return String(value || "").trim();
}

function sanitizeSearch(value) {
  return cleanText(value)
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .replaceAll("%", "")
    .replaceAll("*", "")
    .trim();
}

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_formulas",
        "view",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const {
      searchParams,
    } =
      new URL(req.url);

    const companyId =
      cleanText(
        searchParams.get(
          "company_id"
        )
      );

    const search =
      sanitizeSearch(
        searchParams.get("search")
      );

    const page =
      Math.max(
        Number(
          searchParams.get("page")
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

    if (!companyId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุ company_id",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !guard.canAccessId(
        companyId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์เข้าถึงตัวแปรของบริษัทนี้",
        },
        {
          status: 403,
        }
      );
    }

    let query =
      supabaseAdmin
        .from(
          "formula_variables"
        )
        .select(
          `
            id,
            company_id,
            variable_code,
            variable_name,
            data_type,
            source_type,
            source_key,
            default_value,
            is_required,
            is_system,
            status,
            sort_order
          `,
          {
            count: "exact",
          }
        )
        .eq(
          "company_id",
          companyId
        )
        .eq(
          "status",
          "active"
        );

    if (search) {
      query =
        query.or(
          [
            `variable_code.ilike.%${search}%`,
            `variable_name.ilike.%${search}%`,
            `source_key.ilike.%${search}%`,
          ].join(",")
        );
    }

    query =
      query
        .order(
          "sort_order",
          {
            ascending: true,
          }
        )
        .order(
          "variable_code",
          {
            ascending: true,
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
      success: true,

      data: data || [],

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
      "GET_PAYROLL_FORMULA_VARIABLES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลดตัวแปรสูตรคำนวณได้",
      },
      {
        status: 500,
      }
    );
  }
}
