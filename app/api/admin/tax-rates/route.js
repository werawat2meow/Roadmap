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
  CALCULATION_METHODS,
  TAX_RATE_STATUSES,
  cleanText,
  cleanInteger,
  sanitizeSearch,
  jsonError,
  getActorId,
  getErrorStatus,
  mapDatabaseError,
  normalizeHeader,
  normalizeBrackets,
  validateHeader,
  validateBrackets,
  unsetOtherDefaults,
} from "./_helpers";

const DEFAULT_PAGE_SIZE =
  20;

const MAX_PAGE_SIZE =
  100;

function applyFilters(
  query,
  {
    guard,
    search,
    companyId,
    taxYear,
    calculationMethod,
    status,
    isDefault,
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
          `tax_rate_code.ilike.%${search}%`,
          `tax_rate_name.ilike.%${search}%`,
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

  if (taxYear) {
    query =
      query.eq(
        "tax_year",
        taxYear
      );
  }

  if (calculationMethod) {
    query =
      query.eq(
        "calculation_method",
        calculationMethod
      );
  }

  if (status) {
    query =
      query.eq(
        "status",
        status
      );
  }

  if (
    isDefault ===
      "true" ||
    isDefault ===
      "false"
  ) {
    query =
      query.eq(
        "is_default",
        isDefault === "true"
      );
  }

  return query;
}

async function loadSummary(
  filters
) {
  let query =
    supabaseAdmin
      .from(
        "tax_rate_sets"
      )
      .select(
        `
          id,
          status,
          is_default,
          calculation_method
        `
      );

  query =
    applyFilters(
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
    data || [];

  return {
    total:
      rows.length,

    active:
      rows.filter(
        (item) =>
          item.status ===
          "active"
      ).length,

    inactive:
      rows.filter(
        (item) =>
          item.status ===
          "inactive"
      ).length,

    default:
      rows.filter(
        (item) =>
          item.is_default ===
          true
      ).length,

    progressive:
      rows.filter(
        (item) =>
          item
            .calculation_method ===
          "progressive"
      ).length,
  };
}

/* =========================================================
   GET /api/admin/tax-rates
========================================================= */

export async function GET(
  req
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.tax_rates",
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

    const taxYear =
      cleanInteger(
        searchParams.get(
          "tax_year"
        ),
        0
      );

    const calculationMethod =
      cleanText(
        searchParams.get(
          "calculation_method"
        )
      );

    const status =
      cleanText(
        searchParams.get(
          "status"
        )
      );

    const isDefault =
      cleanText(
        searchParams.get(
          "is_default"
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
        "คุณไม่มีสิทธิ์เข้าถึงอัตราภาษีของบริษัทนี้",
        403
      );
    }

    if (
      calculationMethod &&
      !CALCULATION_METHODS.includes(
        calculationMethod
      )
    ) {
      return jsonError(
        "วิธีคำนวณภาษีไม่ถูกต้อง",
        400
      );
    }

    if (
      status &&
      !TAX_RATE_STATUSES.includes(
        status
      )
    ) {
      return jsonError(
        "สถานะไม่ถูกต้อง",
        400
      );
    }

    const filters = {
      guard,
      search,
      companyId,
      taxYear,
      calculationMethod,
      status,
      isDefault,
    };

    let query =
      supabaseAdmin
        .from(
          "tax_rate_sets"
        )
        .select(
          `
            id,
            company_id,
            tax_rate_code,
            tax_rate_name,
            tax_year,
            calculation_method,
            effective_date,
            expire_date,
            status,
            is_default,
            remark,
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
            count:
              "exact",
          }
        );

    query =
      applyFilters(
        query,
        filters
      );

    query =
      query
        .order(
          "tax_year",
          {
            ascending:
              false,
          }
        )
        .order(
          "is_default",
          {
            ascending:
              false,
          }
        )
        .order(
          "effective_date",
          {
            ascending:
              false,
          }
        )
        .order(
          "tax_rate_code",
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

    const ids =
      (data || [])
        .map(
          (item) =>
            item.id
        )
        .filter(Boolean);

    const bracketCountMap =
      new Map();

    if (
      ids.length >
      0
    ) {
      const {
        data:
          bracketRows,
        error:
          bracketError,
      } =
        await supabaseAdmin
          .from(
            "tax_rate_brackets"
          )
          .select(
            `
              id,
              tax_rate_set_id
            `
          )
          .in(
            "tax_rate_set_id",
            ids
          );

      if (bracketError) {
        throw bracketError;
      }

      (
        bracketRows ||
        []
      ).forEach(
        (row) => {
          const key =
            String(
              row
                .tax_rate_set_id
            );

          bracketCountMap.set(
            key,
            (
              bracketCountMap.get(
                key
              ) || 0
            ) + 1
          );
        }
      );
    }

    const rows =
      (data || []).map(
        (item) => ({
          ...item,

          bracket_count:
            bracketCountMap.get(
              String(
                item.id
              )
            ) || 0,
        })
      );

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
        rows,

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
      "GET_TAX_RATES_ERROR:",
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
   POST /api/admin/tax-rates
========================================================= */

export async function POST(
  req
) {
  let insertedId =
    null;

  try {
    const guard =
      await requireScopedAccess(
        "ems.tax_rates",
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

    const header =
      normalizeHeader(
        body
      );

    const brackets =
      normalizeBrackets(
        body.brackets
      );

    const headerError =
      validateHeader(
        header
      );

    if (headerError) {
      return jsonError(
        headerError,
        400
      );
    }

    const bracketError =
      validateBrackets(
        brackets,
        header
          .calculation_method
      );

    if (bracketError) {
      return jsonError(
        bracketError,
        400
      );
    }

    const scopeError =
      guard.assertAccessId(
        header.company_id,
        "คุณไม่มีสิทธิ์เพิ่มอัตราภาษีให้บริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    const requestedDefault =
      header.is_default;

    const actorId =
      getActorId(
        guard
      );

    const {
      data: inserted,
      error:
        insertError,
    } =
      await supabaseAdmin
        .from(
          "tax_rate_sets"
        )
        .insert({
          ...header,

          /*
           * ตั้ง Default หลัง Header + Brackets
           * บันทึกสำเร็จแล้ว เพื่อไม่ยกเลิก Default เดิม
           * หาก Create ล้มเหลวกลางทาง
           */
          is_default:
            false,

          created_by:
            actorId,

          updated_by:
            actorId,
        })
        .select("*")
        .single();

    if (insertError) {
      throw insertError;
    }

    insertedId =
      inserted.id;

    const {
      error:
        bracketInsertError,
    } =
      await supabaseAdmin
        .from(
          "tax_rate_brackets"
        )
        .insert(
          brackets.map(
            (item) => ({
              ...item,

              tax_rate_set_id:
                inserted.id,
            })
          )
        );

    if (
      bracketInsertError
    ) {
      throw bracketInsertError;
    }

    if (
      requestedDefault
    ) {
      await unsetOtherDefaults({
        companyId:
          header.company_id,

        taxYear:
          header.tax_year,

        excludeId:
          inserted.id,
      });

      const {
        error:
          defaultError,
      } =
        await supabaseAdmin
          .from(
            "tax_rate_sets"
          )
          .update({
            is_default:
              true,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            inserted.id
          );

      if (defaultError) {
        throw defaultError;
      }

      inserted.is_default =
        true;
    }

    try {
      await writeActivityLog({
        moduleName:
          "tax_rates",

        actionType:
          "CREATE",

        referenceTable:
          "tax_rate_sets",

        referenceId:
          inserted.id,

        description:
          `เพิ่มชุดอัตราภาษี ${inserted.tax_rate_code} - ${inserted.tax_rate_name}`,

        newData: {
          ...inserted,
          brackets,
        },
      });
    } catch (logError) {
      console.error(
        "TAX_RATE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success:
        true,

      message:
        "เพิ่มชุดอัตราภาษีเรียบร้อยแล้ว",

      data: {
        ...inserted,
        brackets,
      },
    });
  } catch (error) {
    console.error(
      "POST_TAX_RATE_ERROR:",
      error
    );

    if (insertedId) {
      try {
        await supabaseAdmin
          .from(
            "tax_rate_sets"
          )
          .delete()
          .eq(
            "id",
            insertedId
          );
      } catch {
        // best effort cleanup
      }
    }

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
