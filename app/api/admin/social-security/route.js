import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

import {
  SCHEME_TYPES,
  METHODS,
  STATUSES,
  cleanText,
  sanitizeSearch,
  jsonError,
  getActorId,
  getErrorStatus,
  mapDatabaseError,
  normalizePayload,
  validatePayload,
  unsetOtherDefaults,
} from "./_helpers";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function applyFilters(
  query,
  {
    guard,
    search,
    companyId,
    schemeType,
    method,
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
          `setting_code.ilike.%${search}%`,
          `setting_name.ilike.%${search}%`,
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

  if (schemeType) {
    query =
      query.eq(
        "scheme_type",
        schemeType
      );
  }

  if (method) {
    query =
      query.eq(
        "contribution_method",
        method
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
    isDefault === "true" ||
    isDefault === "false"
  ) {
    query =
      query.eq(
        "is_default",
        isDefault === "true"
      );
  }

  return query;
}

async function loadSummary(filters) {
  let query =
    supabaseAdmin
      .from(
        "social_security_settings"
      )
      .select(
        `
          id,
          status,
          is_default,
          scheme_type
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
    await query.limit(5000);

  if (error) {
    throw error;
  }

  const rows = data || [];

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

    section_33:
      rows.filter(
        (item) =>
          item.scheme_type ===
          "section_33"
      ).length,
  };
}

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.social_security",
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

    const schemeType =
      cleanText(
        searchParams.get(
          "scheme_type"
        )
      );

    const method =
      cleanText(
        searchParams.get(
          "contribution_method"
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
        "คุณไม่มีสิทธิ์เข้าถึงข้อมูลประกันสังคมของบริษัทนี้",
        403
      );
    }

    if (
      schemeType &&
      !SCHEME_TYPES.includes(
        schemeType
      )
    ) {
      return jsonError(
        "ประเภทผู้ประกันตนไม่ถูกต้อง",
        400
      );
    }

    if (
      method &&
      !METHODS.includes(
        method
      )
    ) {
      return jsonError(
        "วิธีคำนวณไม่ถูกต้อง",
        400
      );
    }

    if (
      status &&
      !STATUSES.includes(
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
      schemeType,
      method,
      status,
      isDefault,
    };

    let query =
      supabaseAdmin
        .from(
          "social_security_settings"
        )
        .select(
          `
            *,
            companies:company_id (
              id,
              company_code,
              company_name_th,
              company_name_en
            )
          `,
          {
            count: "exact",
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
          "is_default",
          {
            ascending: false,
          }
        )
        .order(
          "effective_date",
          {
            ascending: false,
          }
        )
        .order(
          "setting_code",
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
      "GET_SOCIAL_SECURITY_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

export async function POST(req) {
  let insertedId = null;

  try {
    const guard =
      await requireScopedAccess(
        "ems.social_security",
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
      validatePayload(payload);

    if (validationError) {
      return jsonError(
        validationError,
        400
      );
    }

    const scopeError =
      guard.assertAccessId(
        payload.company_id,
        "คุณไม่มีสิทธิ์เพิ่มข้อมูลประกันสังคมให้บริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    const requestedDefault =
      payload.is_default;

    const actorId =
      getActorId(guard);

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "social_security_settings"
        )
        .insert({
          ...payload,
          is_default: false,
          created_by:
            actorId,
          updated_by:
            actorId,
        })
        .select("*")
        .single();

    if (error) {
      throw error;
    }

    insertedId = data.id;

    if (requestedDefault) {
      await unsetOtherDefaults({
        companyId:
          payload.company_id,
        schemeType:
          payload.scheme_type,
        excludeId:
          data.id,
      });

      const {
        error: defaultError,
      } =
        await supabaseAdmin
          .from(
            "social_security_settings"
          )
          .update({
            is_default: true,
            updated_at:
              new Date()
                .toISOString(),
          })
          .eq("id", data.id);

      if (defaultError) {
        throw defaultError;
      }

      data.is_default = true;
    }

    try {
      await writeActivityLog({
        moduleName:
          "social_security",
        actionType:
          "CREATE",
        referenceTable:
          "social_security_settings",
        referenceId:
          data.id,
        description:
          `เพิ่มการตั้งค่าประกันสังคม ${data.setting_code} - ${data.setting_name}`,
        newData:
          data,
      });
    } catch (logError) {
      console.error(
        "SOCIAL_SECURITY_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มการตั้งค่าประกันสังคมเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "POST_SOCIAL_SECURITY_ERROR:",
      error
    );

    if (insertedId) {
      try {
        await supabaseAdmin
          .from(
            "social_security_settings"
          )
          .delete()
          .eq(
            "id",
            insertedId
          );
      } catch {
        // best effort
      }
    }

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
