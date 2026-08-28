import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseServer";

import {
  writeActivityLog,
} from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  RUN_TYPES,
  RUN_STATUSES,
  cleanText,
  cleanNullableText,
  cleanCode,
  sanitizeSearch,
  jsonError,
  getActorId,
  getErrorStatus,
  mapDatabaseError,
  validatePeriod,
} from "./_helpers";

const TABLE_NAME =
  "payroll_runs";

const DEFAULT_PAGE_SIZE =
  20;

const MAX_PAGE_SIZE =
  100;

function normalizePayload(
  body = {}
) {
  return {
    company_id:
      cleanText(
        body.company_id
      ),

    payroll_period_id:
      cleanText(
        body.payroll_period_id
      ),

    run_code:
      cleanCode(
        body.run_code
      ),

    run_name:
      cleanText(
        body.run_name
      ),

    run_type:
      cleanText(
        body.run_type
      ) ||
      "regular",

    remark:
      cleanNullableText(
        body.remark
      ),
  };
}

function validatePayload(
  payload
) {
  if (
    !payload.company_id
  ) {
    return "กรุณาเลือกบริษัท";
  }

  if (
    !payload.payroll_period_id
  ) {
    return "กรุณาเลือกงวดเงินเดือน";
  }

  if (
    !payload.run_code
  ) {
    return "กรุณากรอกรหัส Payroll Run";
  }

  if (
    !payload.run_name
  ) {
    return "กรุณากรอกชื่อ Payroll Run";
  }

  if (
    !RUN_TYPES.includes(
      payload.run_type
    )
  ) {
    return "ประเภท Payroll Run ไม่ถูกต้อง";
  }

  return null;
}

function applyListFilters(
  query,
  {
    guard,
    search,
    companyId,
    payrollPeriodId,
    runType,
    status,
  }
) {
  query =
    guard.applyScope(
      query,
      "company_id"
    );

  if (search) {
    query =
      query.or(
        [
          `run_code.ilike.%${search}%`,
          `run_name.ilike.%${search}%`,
          `remark.ilike.%${search}%`,
        ].join(",")
      );
  }

  if (companyId) {
    query =
      query.eq(
        "company_id",
        companyId
      );
  }

  if (payrollPeriodId) {
    query =
      query.eq(
        "payroll_period_id",
        payrollPeriodId
      );
  }

  if (runType) {
    query =
      query.eq(
        "run_type",
        runType
      );
  }

  if (status) {
    query =
      query.eq(
        "status",
        status
      );
  }

  return query;
}

async function loadSummary(
  filters
) {
  let query =
    supabaseAdmin
      .from(TABLE_NAME)
      .select(
        `
          id,
          status,
          net_amount
        `
      );

  query =
    applyListFilters(
      query,
      filters
    );

  const {
    data,
    error,
  } =
    await query.limit(
      5000
    );

  if (error) {
    throw error;
  }

  const rows =
    Array.isArray(
      data
    )
      ? data
      : [];

  return {
    total:
      rows.length,

    draft:
      rows.filter(
        (item) =>
          item.status ===
          "draft"
      ).length,

    prepared:
      rows.filter(
        (item) =>
          item.status ===
          "prepared"
      ).length,

    processing:
      rows.filter(
        (item) =>
          item.status ===
          "processing"
      ).length,

    completed:
      rows.filter(
        (item) =>
          item.status ===
          "completed"
      ).length,

    cancelled:
      rows.filter(
        (item) =>
          item.status ===
          "cancelled"
      ).length,

    net_total:
      rows.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item
              .net_amount ||
            0
          ),
        0
      ),
  };
}

/* =========================================================
   GET /api/admin/payroll-runs
========================================================= */

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

    const companyId =
      cleanText(
        searchParams.get(
          "company_id"
        )
      );

    const payrollPeriodId =
      cleanText(
        searchParams.get(
          "payroll_period_id"
        )
      );

    const runType =
      cleanText(
        searchParams.get(
          "run_type"
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
        MAX_PAGE_SIZE
      );

    if (
      companyId &&
      !guard.canAccessId(
        companyId
      )
    ) {
      return jsonError(
        "คุณไม่มีสิทธิ์เข้าถึง Payroll Run ของบริษัทนี้",
        403
      );
    }

    if (
      runType &&
      !RUN_TYPES.includes(
        runType
      )
    ) {
      return jsonError(
        "ประเภท Payroll Run ไม่ถูกต้อง",
        400
      );
    }

    if (
      status &&
      !RUN_STATUSES.includes(
        status
      )
    ) {
      return jsonError(
        "สถานะ Payroll Run ไม่ถูกต้อง",
        400
      );
    }

    const filters = {
      guard,
      search,
      companyId,
      payrollPeriodId,
      runType,
      status,
    };

    let query =
      supabaseAdmin
        .from(
          TABLE_NAME
        )
        .select(
          `
            id,
            company_id,
            payroll_period_id,
            payroll_group_id,
            run_code,
            run_name,
            run_type,
            status,
            calculation_engine,
            employee_count,
            calculated_count,
            error_count,
            base_salary_total,
            gross_amount,
            deduction_amount,
            net_amount,
            prepared_at,
            started_at,
            completed_at,
            cancelled_at,
            is_locked,
            remark,
            created_at,
            updated_at,
            companies:company_id (
              id,
              company_code,
              company_name_th,
              company_name_en
            ),
            payroll_periods:payroll_period_id (
              id,
              period_code,
              period_name,
              period_year,
              period_no,
              period_start_date,
              period_end_date,
              payment_date,
              status,
              is_locked
            ),
            payroll_groups:payroll_group_id (
              id,
              payroll_group_code,
              payroll_group_name,
              payroll_company_id
            )
          `,
          {
            count:
              "exact",
          }
        );

    query =
      applyListFilters(
        query,
        filters
      );

    query =
      query
        .order(
          "created_at",
          {
            ascending:
              false,
          }
        )
        .order(
          "run_code",
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

    const summary =
      await loadSummary(
        filters
      );

    const total =
      count || 0;

    return NextResponse.json({
      success:
        true,

      data:
        data || [],

      summary,

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
      "GET_PAYROLL_RUNS_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(
        error
      ),
      getErrorStatus(
        error
      )
    );
  }
}

/* =========================================================
   POST /api/admin/payroll-runs
========================================================= */

export async function POST(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_runs",
        "create",
        {
          scopeType:
            "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const body =
      await req
        .json()
        .catch(
          () => null
        );

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(
        body
      )
    ) {
      return jsonError(
        "Request Body ไม่ถูกต้อง",
        400
      );
    }

    const payload =
      normalizePayload(
        body
      );

    const validationError =
      validatePayload(
        payload
      );

    if (
      validationError
    ) {
      return jsonError(
        validationError,
        400
      );
    }

    const scopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์สร้าง Payroll Run ให้บริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    const periodValidation =
      await validatePeriod({
        companyId:
          payload.company_id,

        payrollPeriodId:
          payload.payroll_period_id,

        requireOpen:
          false,
      });

    if (
      periodValidation.error
    ) {
      return jsonError(
        periodValidation.error,
        400
      );
    }

    const period =
      periodValidation.period;

    if (
      period.status ===
      "processed"
    ) {
      return jsonError(
        "งวดเงินเดือนนี้ประมวลผลเสร็จแล้ว ไม่สามารถสร้าง Run ใหม่ได้",
        400
      );
    }

    const actorId =
      getActorId(
        guard
      );

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          TABLE_NAME
        )
        .insert({
          company_id:
            payload.company_id,

          payroll_period_id:
            payload.payroll_period_id,

          payroll_group_id:
            period.payroll_group_id,

          run_code:
            payload.run_code,

          run_name:
            payload.run_name,

          run_type:
            payload.run_type,

          status:
            "draft",

          remark:
            payload.remark,

          created_by:
            actorId,

          updated_by:
            actorId,
        })
        .select(
          `
            *,
            companies:company_id (
              id,
              company_code,
              company_name_th,
              company_name_en
            ),
            payroll_periods:payroll_period_id (
              id,
              period_code,
              period_name,
              period_year,
              period_no,
              payment_date,
              status
            ),
            payroll_groups:payroll_group_id (
              id,
              payroll_group_code,
              payroll_group_name
            )
          `
        )
        .single();

    if (error) {
      throw error;
    }

    try {
      await writeActivityLog({
        moduleName:
          "payroll_runs",

        actionType:
          "CREATE",

        referenceTable:
          TABLE_NAME,

        referenceId:
          data.id,

        description:
          `สร้าง Payroll Run ${data.run_code} - ${data.run_name}`,

        newData:
          data,
      });
    } catch (
      logError
    ) {
      console.error(
        "PAYROLL_RUN_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "สร้าง Payroll Run เรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "POST_PAYROLL_RUN_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(
        error
      ),
      getErrorStatus(
        error
      )
    );
  }
}
