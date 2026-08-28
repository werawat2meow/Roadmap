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
  jsonError,
  loadRun,
} from "../../_helpers";

/* =========================================================
   GET /api/admin/payroll-runs/[id]/items
========================================================= */

export async function GET(
  req,
  {
    params,
  }
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
      id,
    } =
      await params;

    const runResult =
      await loadRun(id);

    if (runResult.error) {
      throw runResult.error;
    }

    const run =
      runResult.data;

    if (!run) {
      return jsonError(
        "ไม่พบ Payroll Run",
        404
      );
    }

    const scopeError =
      guard.assertAccessId(
        run.company_id,
        "คุณไม่มีสิทธิ์ดูรายการ Payroll Run ของบริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
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
      )
        .replaceAll(
          "%",
          ""
        )
        .replaceAll(
          ",",
          " "
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
          ) || 20,
          1
        ),
        100
      );

    let query =
      supabaseAdmin
        .from(
          "payroll_run_items"
        )
        .select(
          `
            id,
            payroll_run_id,
            employee_id,
            employee_code,
            employee_name,
            base_salary,
            gross_amount,
            deduction_amount,
            net_amount,
            calculation_status,
            calculation_note,
            snapshot,
            created_at,
            updated_at
          `,
          {
            count:
              "exact",
          }
        )
        .eq(
          "payroll_run_id",
          id
        );

    if (search) {
      query =
        query.or(
          [
            `employee_code.ilike.%${search}%`,
            `employee_name.ilike.%${search}%`,
          ].join(",")
        );
    }

    if (status) {
      query =
        query.eq(
          "calculation_status",
          status
        );
    }

    query =
      query.order(
        "employee_code",
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
      "GET_PAYROLL_RUN_ITEMS_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success:
          false,

        error:
          error?.message ||
          "ไม่สามารถโหลดรายการพนักงานใน Payroll Run ได้",
      },
      {
        status: 500,
      }
    );
  }
}
