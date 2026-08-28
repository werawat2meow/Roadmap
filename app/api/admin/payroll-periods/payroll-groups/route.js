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
    .trim();
}

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_periods",
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

    const id =
      cleanText(
        searchParams.get("id")
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
          ) || DEFAULT_PAGE_SIZE,
          1
        ),
        MAX_PAGE_SIZE
      );

    if (
      companyId &&
      !guard.canAccessId(
        companyId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "คุณไม่มีสิทธิ์เข้าถึงกลุ่มเงินเดือนของบริษัทนี้",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * payroll_groups ผูกกับ payroll_companies
     * และ payroll_companies ผูก company_id
     *
     * จึงหา payroll_company_id ที่อยู่ใน Company Scope ก่อน
     */
    let payrollCompanyQuery =
      supabaseAdmin
        .from(
          "payroll_companies"
        )
        .select(
          `
            id,
            company_id,
            payroll_company_code,
            payroll_company_name,
            status
          `
        )
        .eq(
          "status",
          "active"
        );

    payrollCompanyQuery =
      guard.applyScope(
        payrollCompanyQuery,
        "company_id"
      );

    if (companyId) {
      payrollCompanyQuery =
        payrollCompanyQuery.eq(
          "company_id",
          companyId
        );
    }

    const {
      data:
        payrollCompanies,
      error:
        payrollCompanyError,
    } =
      await payrollCompanyQuery;

    if (
      payrollCompanyError
    ) {
      throw payrollCompanyError;
    }

    const payrollCompanyIds =
      (
        payrollCompanies ||
        []
      )
        .map(
          (item) =>
            item.id
        )
        .filter(Boolean);

    if (
      payrollCompanyIds.length ===
      0
    ) {
      return NextResponse.json({
        success: true,

        data: [],

        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const companyMap =
      new Map(
        (
          payrollCompanies ||
          []
        ).map(
          (item) => [
            String(item.id),
            item,
          ]
        )
      );

    let query =
      supabaseAdmin
        .from(
          "payroll_groups"
        )
        .select(
          `
            id,
            payroll_company_id,
            payroll_group_code,
            payroll_group_name,
            payment_frequency,
            status,
            sort_order
          `,
          {
            count: "exact",
          }
        )
        .in(
          "payroll_company_id",
          payrollCompanyIds
        )
        .eq(
          "status",
          "active"
        );

    if (id) {
      query =
        query.eq(
          "id",
          id
        );
    }

    if (search) {
      query =
        query.or(
          [
            `payroll_group_code.ilike.%${search}%`,
            `payroll_group_name.ilike.%${search}%`,
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
          "payroll_group_code",
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

    const rows =
      (
        data || []
      ).map(
        (item) => ({
          ...item,

          payroll_company:
            companyMap.get(
              String(
                item
                  .payroll_company_id
              )
            ) ||
            null,
        })
      );

    const total =
      count || 0;

    return NextResponse.json({
      success: true,

      data: rows,

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
      "GET_PAYROLL_PERIOD_GROUPS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "ไม่สามารถโหลดกลุ่มเงินเดือนได้",
      },
      {
        status: 500,
      }
    );
  }
}
