import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

function cleanText(value) {
  return String(value || "").trim();
}

function cleanNullableText(value) {
  const text = cleanText(value);
  return text || null;
}

function cleanBoolean(
  value,
  fallback = false
) {
  if (typeof value === "boolean") {
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

function parsePositiveInteger(
  value,
  fallback = 1,
  max = null
) {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  const result =
    Math.floor(parsed);

  return max
    ? Math.min(result, max)
    : result;
}

function parseNullablePositiveInteger(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return null;
  }

  return Math.floor(parsed);
}

function parseSortOrder(value) {
  const parsed = Number(value);

  if (
    !Number.isFinite(parsed) ||
    parsed < 0
  ) {
    return 0;
  }

  return Math.floor(parsed);
}

function normalizeDate(value) {
  const text = cleanText(value);
  return text || null;
}

function validateDateRange(
  effectiveDate,
  expireDate
) {
  if (
    !effectiveDate ||
    !expireDate
  ) {
    return null;
  }

  if (expireDate < effectiveDate) {
    return "วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มมีผล";
  }

  return null;
}

function normalizePayload(body = {}) {
  const status = cleanText(
    body.status || "active"
  ).toLowerCase();

  return {
    company_id:
      cleanText(
        body.company_id
      ),

    visa_code:
      cleanText(
        body.visa_code
      ).toUpperCase(),

    visa_name_th:
      cleanText(
        body.visa_name_th
      ),

    visa_name_en:
      cleanNullableText(
        body.visa_name_en
      ),

    description:
      cleanNullableText(
        body.description
      ),

    allows_work:
      cleanBoolean(
        body.allows_work,
        false
      ),

    requires_work_permit:
      cleanBoolean(
        body.requires_work_permit,
        true
      ),

    is_extendable:
      cleanBoolean(
        body.is_extendable,
        true
      ),

    default_validity_days:
      parseNullablePositiveInteger(
        body.default_validity_days
      ),

    effective_date:
      normalizeDate(
        body.effective_date
      ) ||
      new Date()
        .toISOString()
        .slice(0, 10),

    expire_date:
      normalizeDate(
        body.expire_date
      ),

    status,

    sort_order:
      parseSortOrder(
        body.sort_order
      ),

    remark:
      cleanNullableText(
        body.remark
      ),
  };
}

function applyCommonFilters(
  query,
  {
    search,
    companyId,
    allowsWork,
  }
) {
  let nextQuery = query;

  if (search) {
    const keyword =
      search
        .replaceAll(",", " ")
        .trim();

    nextQuery =
      nextQuery.or(
        [
          `visa_code.ilike.%${keyword}%`,
          `visa_name_th.ilike.%${keyword}%`,
          `visa_name_en.ilike.%${keyword}%`,
          `description.ilike.%${keyword}%`,
          `remark.ilike.%${keyword}%`,
        ].join(",")
      );
  }

  if (companyId) {
    nextQuery =
      nextQuery.eq(
        "company_id",
        companyId
      );
  }

  if (allowsWork === "true") {
    nextQuery =
      nextQuery.eq(
        "allows_work",
        true
      );
  }

  if (allowsWork === "false") {
    nextQuery =
      nextQuery.eq(
        "allows_work",
        false
      );
  }

  return nextQuery;
}

async function loadSummary(
  guard,
  filters
) {
  async function countByStatus(
    statusValue = ""
  ) {
    let query =
      supabaseAdmin
        .from("visa_types")
        .select("id", {
          count: "exact",
          head: true,
        });

    query =
      guard.applyScope(
        query,
        "company_id"
      );

    query =
      applyCommonFilters(
        query,
        filters
      );

    if (statusValue) {
      query =
        query.eq(
          "status",
          statusValue
        );
    }

    const {
      count,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    return Number(
      count || 0
    );
  }

  const [
    total,
    active,
    inactive,
  ] =
    await Promise.all([
      countByStatus(),
      countByStatus(
        "active"
      ),
      countByStatus(
        "inactive"
      ),
    ]);

  return {
    total,
    active,
    inactive,
  };
}

/* =========================================================
   GET /api/admin/visa-types

   Permission:
   ems.visa_types.view

   Scope:
   company
========================================================= */

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.visa_types",
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
      cleanText(
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

    const allowsWork =
      cleanText(
        searchParams.get(
          "allows_work"
        )
      ).toLowerCase();

    const status =
      cleanText(
        searchParams.get(
          "status"
        )
      ).toLowerCase();

    const all =
      searchParams.get(
        "all"
      ) === "true";

    const page =
      parsePositiveInteger(
        searchParams.get(
          "page"
        ),
        1
      );

    const pageSize =
      parsePositiveInteger(
        searchParams.get(
          "pageSize"
        ),
        20,
        100
      );

    if (
      allowsWork &&
      ![
        "true",
        "false",
      ].includes(
        allowsWork
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ตัวกรองสิทธิ์ทำงานไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (
      status &&
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "สถานะไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (companyId) {
      const scopeResponse =
        guard.assertAccessId(
          companyId,
          "คุณไม่มีสิทธิ์เข้าถึงประเภทวีซ่าของบริษัทนี้"
        );

      if (scopeResponse) {
        return scopeResponse;
      }
    }

    let query =
      supabaseAdmin
        .from("visa_types")
        .select(
          `
            id,
            company_id,
            visa_code,
            visa_name_th,
            visa_name_en,
            description,
            allows_work,
            requires_work_permit,
            is_extendable,
            default_validity_days,
            effective_date,
            expire_date,
            status,
            sort_order,
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
            )
          `,
          {
            count: all
              ? undefined
              : "exact",
          }
        );

    query =
      guard.applyScope(
        query,
        "company_id"
      );

    query =
      applyCommonFilters(
        query,
        {
          search,
          companyId,
          allowsWork,
        }
      );

    if (status) {
      query =
        query.eq(
          "status",
          status
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
          "visa_code",
          {
            ascending: true,
          }
        );

    if (!all) {
      const from =
        (page - 1) *
        pageSize;

      const to =
        from +
        pageSize -
        1;

      query =
        query.range(
          from,
          to
        );
    }

    const {
      data,
      error,
      count,
    } =
      await query;

    if (error) {
      throw error;
    }

    const summary =
      await loadSummary(
        guard,
        {
          search,
          companyId,
          allowsWork,
        }
      );

    const rows =
      data || [];

    return NextResponse.json({
      success: true,

      data:
        rows,

      summary,

      pagination: {
        page:
          all ? 1 : page,

        pageSize:
          all
            ? rows.length
            : pageSize,

        total:
          all
            ? rows.length
            : Number(
                count || 0
              ),

        totalPages:
          all
            ? 1
            : Math.max(
                Math.ceil(
                  Number(
                    count || 0
                  ) /
                    pageSize
                ),
                1
              ),
      },

      meta: {
        scope_type:
          "company",
        all,
      },
    });
  } catch (error) {
    console.error(
      "GET_VISA_TYPES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดประเภทวีซ่าได้",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/admin/visa-types

   Permission:
   ems.visa_types.create

   Scope:
   company
========================================================= */

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.visa_types",
        "create",
        {
          scopeType: "company",
        }
      );

    if (!guard.ok) {
      return guard.response;
    }

    const body =
      await req.json();

    const payload =
      normalizePayload(
        body
      );

    if (!payload.company_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกบริษัท",
        },
        { status: 400 }
      );
    }

    if (!payload.visa_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสประเภทวีซ่า",
        },
        { status: 400 }
      );
    }

    if (!payload.visa_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อประเภทวีซ่า",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_STATUSES.includes(
        payload.status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "สถานะไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const dateError =
      validateDateRange(
        payload.effective_date,
        payload.expire_date
      );

    if (dateError) {
      return NextResponse.json(
        {
          success: false,
          error:
            dateError,
        },
        { status: 400 }
      );
    }

    const scopeResponse =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์เพิ่มประเภทวีซ่าในบริษัทนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const {
      data:
        duplicate,
      error:
        duplicateError,
    } =
      await supabaseAdmin
        .from("visa_types")
        .select("id")
        .eq(
          "company_id",
          payload.company_id
        )
        .eq(
          "visa_code",
          payload.visa_code
        )
        .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสประเภทวีซ่านี้มีอยู่แล้วในบริษัท",
        },
        { status: 400 }
      );
    }

    const actorId =
      guard?.access?.id ||
      null;

    const insertPayload = {
      ...payload,
      created_by:
        actorId,
      updated_by:
        actorId,
    };

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("visa_types")
        .insert([
          insertPayload,
        ])
        .select(
          `
            *,
            companies:company_id (
              id,
              company_code,
              company_name_th,
              company_name_en
            )
          `
        )
        .single();

    if (error) {
      throw error;
    }

    await writeActivityLog({
      module_name:
        "visa_types",

      action_type:
        "create",

      reference_table:
        "visa_types",

      reference_id:
        data.id,

      description:
        `เพิ่มประเภทวีซ่า ${data.visa_code} - ${data.visa_name_th}`,

      new_data:
        data,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "เพิ่มประเภทวีซ่าสำเร็จ",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE_VISA_TYPE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถเพิ่มประเภทวีซ่าได้",
      },
      { status: 500 }
    );
  }
}
