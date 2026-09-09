import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

const ALLOWED_CATEGORIES = [
  "passport",
  "visa",
  "work_permit",
  "mou",
  "identity",
  "medical",
  "insurance",
  "employment",
  "government",
  "other",
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

  const result = Math.floor(parsed);

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

  const documentCategory =
    cleanText(
      body.document_category || "other"
    ).toLowerCase();

  return {
    company_id:
      cleanText(
        body.company_id
      ),

    document_code:
      cleanText(
        body.document_code
      ).toUpperCase(),

    document_name_th:
      cleanText(
        body.document_name_th
      ),

    document_name_en:
      cleanNullableText(
        body.document_name_en
      ),

    document_category:
      documentCategory,

    description:
      cleanNullableText(
        body.description
      ),

    requires_document_no:
      cleanBoolean(
        body.requires_document_no,
        true
      ),

    requires_issue_date:
      cleanBoolean(
        body.requires_issue_date,
        false
      ),

    requires_expiry_date:
      cleanBoolean(
        body.requires_expiry_date,
        false
      ),

    is_mandatory:
      cleanBoolean(
        body.is_mandatory,
        false
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
    documentCategory,
    mandatory,
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
          `document_code.ilike.%${keyword}%`,
          `document_name_th.ilike.%${keyword}%`,
          `document_name_en.ilike.%${keyword}%`,
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

  if (documentCategory) {
    nextQuery =
      nextQuery.eq(
        "document_category",
        documentCategory
      );
  }

  if (mandatory === "true") {
    nextQuery =
      nextQuery.eq(
        "is_mandatory",
        true
      );
  }

  if (mandatory === "false") {
    nextQuery =
      nextQuery.eq(
        "is_mandatory",
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
        .from(
          "foreign_worker_document_types"
        )
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
      countByStatus("active"),
      countByStatus("inactive"),
    ]);

  return {
    total,
    active,
    inactive,
  };
}

/* =========================================================
   GET /api/admin/foreign-worker-document-types

   Permission:
   ems.foreign_worker_document_types.view

   Scope:
   company
========================================================= */

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.foreign_worker_document_types",
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
        searchParams.get("search")
      );

    const companyId =
      cleanText(
        searchParams.get("company_id")
      );

    const documentCategory =
      cleanText(
        searchParams.get(
          "document_category"
        )
      ).toLowerCase();

    const mandatory =
      cleanText(
        searchParams.get(
          "is_mandatory"
        )
      ).toLowerCase();

    const status =
      cleanText(
        searchParams.get("status")
      ).toLowerCase();

    const all =
      searchParams.get("all") === "true";

    const page =
      parsePositiveInteger(
        searchParams.get("page"),
        1
      );

    const pageSize =
      parsePositiveInteger(
        searchParams.get("pageSize"),
        20,
        100
      );

    if (
      documentCategory &&
      !ALLOWED_CATEGORIES.includes(
        documentCategory
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "หมวดเอกสารไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    if (
      mandatory &&
      !["true", "false"].includes(
        mandatory
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ตัวกรองเอกสารบังคับไม่ถูกต้อง",
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
          "คุณไม่มีสิทธิ์เข้าถึงประเภทเอกสารแรงงานต่างชาติของบริษัทนี้"
        );

      if (scopeResponse) {
        return scopeResponse;
      }
    }

    let query =
      supabaseAdmin
        .from(
          "foreign_worker_document_types"
        )
        .select(
          `
            id,
            company_id,
            document_code,
            document_name_th,
            document_name_en,
            document_category,
            description,
            requires_document_no,
            requires_issue_date,
            requires_expiry_date,
            is_mandatory,
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
          documentCategory,
          mandatory,
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
          "document_code",
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
          documentCategory,
          mandatory,
        }
      );

    const rows =
      data || [];

    return NextResponse.json({
      success: true,

      data: rows,

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
      "GET_FOREIGN_WORKER_DOCUMENT_TYPES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดประเภทเอกสารแรงงานต่างชาติได้",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST /api/admin/foreign-worker-document-types

   Permission:
   ems.foreign_worker_document_types.create

   Scope:
   company
========================================================= */

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.foreign_worker_document_types",
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
      normalizePayload(body);

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

    if (!payload.document_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสประเภทเอกสาร",
        },
        { status: 400 }
      );
    }

    if (!payload.document_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อประเภทเอกสาร",
        },
        { status: 400 }
      );
    }

    if (
      !ALLOWED_CATEGORIES.includes(
        payload.document_category
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "หมวดเอกสารไม่ถูกต้อง",
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
        "คุณไม่มีสิทธิ์เพิ่มประเภทเอกสารแรงงานต่างชาติในบริษัทนี้"
      );

    if (scopeResponse) {
      return scopeResponse;
    }

    const {
      data: duplicate,
      error: duplicateError,
    } =
      await supabaseAdmin
        .from(
          "foreign_worker_document_types"
        )
        .select("id")
        .eq(
          "company_id",
          payload.company_id
        )
        .eq(
          "document_code",
          payload.document_code
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
            "รหัสประเภทเอกสารนี้มีอยู่แล้วในบริษัท",
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
        .from(
          "foreign_worker_document_types"
        )
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
        "foreign_worker_document_types",

      action_type:
        "create",

      reference_table:
        "foreign_worker_document_types",

      reference_id:
        data.id,

      description:
        `เพิ่มประเภทเอกสารแรงงานต่างชาติ ${data.document_code} - ${data.document_name_th}`,

      new_data:
        data,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "เพิ่มประเภทเอกสารแรงงานต่างชาติสำเร็จ",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE_FOREIGN_WORKER_DOCUMENT_TYPE_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถเพิ่มประเภทเอกสารแรงงานต่างชาติได้",
      },
      { status: 500 }
    );
  }
}
