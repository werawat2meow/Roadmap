import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

const TABLE_NAME = "payroll_periods";

const ALLOWED_STATUSES = [
  "draft",
  "open",
  "closed",
  "processed",
];

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function cleanText(value) {
  return String(value || "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanCode(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cleanInteger(value, fallback = 0) {
  const parsed = Number.parseInt(
    String(value ?? ""),
    10
  );

  return Number.isInteger(parsed)
    ? parsed
    : fallback;
}

function cleanDate(value) {
  return cleanText(value) || null;
}

function cleanBoolean(value, fallback = false) {
  if (value === true || value === false) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
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

function getActorId(guard) {
  return (
    guard?.access?.user_account_id ||
    guard?.access?.user?.id ||
    guard?.user?.id ||
    null
  );
}

function jsonError(
  message,
  status = 500,
  extra = {}
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...extra,
    },
    {
      status,
    }
  );
}

function getErrorStatus(error) {
  if (!error) return 500;

  if (error.code === "23505") {
    return 409;
  }

  if (
    [
      "23503",
      "23514",
      "23502",
      "22P02",
    ].includes(error.code)
  ) {
    return 400;
  }

  return 500;
}

function mapDatabaseError(error) {
  if (!error) {
    return "เกิดข้อผิดพลาดในฐานข้อมูล";
  }

  if (error.code === "23505") {
    return "รหัสงวด หรือ ลำดับงวดนี้มีอยู่แล้วในกลุ่มเงินเดือน";
  }

  if (error.code === "23503") {
    return "ไม่พบบริษัท กลุ่มเงินเดือน หรือข้อมูลที่อ้างอิง";
  }

  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขของงวดเงินเดือน";
  }

  if (error.code === "23502") {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  if (error.code === "22P02") {
    return "รูปแบบข้อมูลหรือ UUID ไม่ถูกต้อง";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

function normalizePayload(
  body = {},
  current = null
) {
  return {
    company_id:
      cleanText(
        body.company_id ??
        current?.company_id
      ),

    payroll_group_id:
      cleanText(
        body.payroll_group_id ??
        current?.payroll_group_id
      ),

    period_code:
      cleanCode(
        body.period_code ??
        current?.period_code
      ),

    period_name:
      cleanText(
        body.period_name ??
        current?.period_name
      ),

    period_year:
      cleanInteger(
        body.period_year ??
        current?.period_year,
        new Date().getFullYear()
      ),

    period_no:
      cleanInteger(
        body.period_no ??
        current?.period_no,
        1
      ),

    period_start_date:
      cleanDate(
        body.period_start_date ??
        current?.period_start_date
      ),

    period_end_date:
      cleanDate(
        body.period_end_date ??
        current?.period_end_date
      ),

    cutoff_start_date:
      cleanDate(
        body.cutoff_start_date ??
        current?.cutoff_start_date
      ),

    cutoff_end_date:
      cleanDate(
        body.cutoff_end_date ??
        current?.cutoff_end_date
      ),

    payment_date:
      cleanDate(
        body.payment_date ??
        current?.payment_date
      ),

    status:
      cleanText(
        body.status ??
        current?.status
      ) || "draft",

    is_locked:
      cleanBoolean(
        body.is_locked ??
        current?.is_locked,
        false
      ),

    remark:
      cleanNullableText(
        body.remark ??
        current?.remark
      ),
  };
}

function validatePayload(payload) {
  if (!payload.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (!payload.payroll_group_id) {
    return "กรุณาเลือกกลุ่มเงินเดือน";
  }

  if (!payload.period_code) {
    return "กรุณากรอกรหัสงวดเงินเดือน";
  }

  if (!payload.period_name) {
    return "กรุณากรอกชื่องวดเงินเดือน";
  }

  if (
    payload.period_year < 2000 ||
    payload.period_year > 2200
  ) {
    return "ปีงวดเงินเดือนต้องอยู่ระหว่าง 2000 - 2200";
  }

  if (
    payload.period_no < 1 ||
    payload.period_no > 99
  ) {
    return "ลำดับงวดต้องอยู่ระหว่าง 1 - 99";
  }

  if (
    !payload.period_start_date ||
    !payload.period_end_date
  ) {
    return "กรุณาระบุช่วงวันที่ของงวดเงินเดือน";
  }

  if (
    payload.period_end_date <
    payload.period_start_date
  ) {
    return "วันที่สิ้นสุดงวดต้องไม่น้อยกว่าวันที่เริ่มงวด";
  }

  if (!payload.payment_date) {
    return "กรุณาระบุวันที่จ่ายเงิน";
  }

  if (
    payload.cutoff_start_date &&
    payload.cutoff_end_date &&
    payload.cutoff_end_date <
      payload.cutoff_start_date
  ) {
    return "วันที่สิ้นสุด Cut-off ต้องไม่น้อยกว่าวันที่เริ่ม Cut-off";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะงวดเงินเดือนไม่ถูกต้อง";
  }

  return null;
}

async function validatePayrollGroup({
  companyId,
  payrollGroupId,
}) {
  const {
    data: group,
    error: groupError,
  } =
    await supabaseAdmin
      .from("payroll_groups")
      .select(
        `
          id,
          payroll_group_code,
          payroll_group_name,
          payroll_company_id,
          status
        `
      )
      .eq("id", payrollGroupId)
      .maybeSingle();

  if (groupError) {
    throw groupError;
  }

  if (!group) {
    return {
      error:
        "ไม่พบกลุ่มเงินเดือนที่เลือก",
    };
  }

  if (
    group.status &&
    group.status !== "active"
  ) {
    return {
      error:
        "กลุ่มเงินเดือนที่เลือกไม่ได้อยู่ในสถานะใช้งาน",
    };
  }

  if (!group.payroll_company_id) {
    return {
      error:
        "กลุ่มเงินเดือนไม่ได้ผูกกับบริษัทเงินเดือน",
    };
  }

  const {
    data: payrollCompany,
    error: companyError,
  } =
    await supabaseAdmin
      .from("payroll_companies")
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
        "id",
        group.payroll_company_id
      )
      .maybeSingle();

  if (companyError) {
    throw companyError;
  }

  if (!payrollCompany) {
    return {
      error:
        "ไม่พบบริษัทเงินเดือนของกลุ่มที่เลือก",
    };
  }

  if (
    String(
      payrollCompany.company_id
    ) !==
    String(companyId)
  ) {
    return {
      error:
        "กลุ่มเงินเดือนนี้ไม่ได้อยู่ในบริษัทที่เลือก",
    };
  }

  if (
    payrollCompany.status &&
    payrollCompany.status !== "active"
  ) {
    return {
      error:
        "บริษัทเงินเดือนของกลุ่มนี้ไม่ได้อยู่ในสถานะใช้งาน",
    };
  }

  return {
    group,
    payrollCompany,
  };
}

function applyListFilters(
  query,
  {
    guard,
    search,
    companyId,
    payrollGroupId,
    periodYear,
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
          `period_code.ilike.%${search}%`,
          `period_name.ilike.%${search}%`,
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

  if (payrollGroupId) {
    query =
      query.eq(
        "payroll_group_id",
        payrollGroupId
      );
  }

  if (periodYear) {
    query =
      query.eq(
        "period_year",
        periodYear
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

async function loadSummary(filters) {
  let query =
    supabaseAdmin
      .from(TABLE_NAME)
      .select("id,status");

  query =
    applyListFilters(
      query,
      filters
    );

  const {
    data,
    error,
  } =
    await query.limit(5000);

  if (error) {
    throw error;
  }

  const rows =
    Array.isArray(data)
      ? data
      : [];

  return {
    total:
      rows.length,

    draft:
      rows.filter(
        (item) =>
          item.status === "draft"
      ).length,

    open:
      rows.filter(
        (item) =>
          item.status === "open"
      ).length,

    closed:
      rows.filter(
        (item) =>
          item.status === "closed"
      ).length,

    processed:
      rows.filter(
        (item) =>
          item.status === "processed"
      ).length,
  };
}

/* =========================================================
   GET /api/admin/payroll-periods
========================================================= */

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

    const payrollGroupId =
      cleanText(
        searchParams.get(
          "payroll_group_id"
        )
      );

    const periodYear =
      cleanInteger(
        searchParams.get(
          "period_year"
        ),
        0
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

    if (
      status &&
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return jsonError(
        "สถานะงวดเงินเดือนไม่ถูกต้อง",
        400
      );
    }

    if (
      companyId &&
      !guard.canAccessId(
        companyId
      )
    ) {
      return jsonError(
        "คุณไม่มีสิทธิ์เข้าถึงงวดเงินเดือนของบริษัทนี้",
        403
      );
    }

    const filters = {
      guard,
      search,
      companyId,
      payrollGroupId,
      periodYear,
      status,
    };

    let query =
      supabaseAdmin
        .from(TABLE_NAME)
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
            cutoff_start_date,
            cutoff_end_date,
            payment_date,
            status,
            is_locked,
            remark,
            created_by,
            updated_by,
            created_at,
            updated_at,
            companies:company_id (
              id,
              company_code,
              company_name_th,
              company_name_en
            ),
            payroll_groups:payroll_group_id (
              id,
              payroll_group_code,
              payroll_group_name,
              payroll_company_id
            )
          `,
          {
            count: "exact",
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
          "period_year",
          {
            ascending: false,
          }
        )
        .order(
          "period_no",
          {
            ascending: false,
          }
        )
        .order(
          "payment_date",
          {
            ascending: false,
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
      success: true,

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
      "GET_PAYROLL_PERIODS_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

/* =========================================================
   POST /api/admin/payroll-periods
========================================================= */

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.payroll_periods",
        "create",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const body =
      await req
        .json()
        .catch(() => null);

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return jsonError(
        "Request Body ไม่ถูกต้อง",
        400
      );
    }

    const payload =
      normalizePayload(body);

    const validationError =
      validatePayload(
        payload
      );

    if (validationError) {
      return jsonError(
        validationError,
        400
      );
    }

    const scopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์เพิ่มงวดเงินเดือนให้บริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    const groupValidation =
      await validatePayrollGroup({
        companyId:
          payload.company_id,

        payrollGroupId:
          payload.payroll_group_id,
      });

    if (
      groupValidation.error
    ) {
      return jsonError(
        groupValidation.error,
        400
      );
    }

    const actorId =
      getActorId(guard);

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(TABLE_NAME)
        .insert({
          ...payload,

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
            payroll_groups:payroll_group_id (
              id,
              payroll_group_code,
              payroll_group_name,
              payroll_company_id
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
          "payroll_periods",

        actionType:
          "CREATE",

        referenceTable:
          TABLE_NAME,

        referenceId:
          data.id,

        description:
          `เพิ่มงวดเงินเดือน ${data.period_code} - ${data.period_name}`,

        newData:
          data,
      });
    } catch (logError) {
      console.error(
        "PAYROLL_PERIOD_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "เพิ่มงวดเงินเดือนเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "POST_PAYROLL_PERIOD_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
