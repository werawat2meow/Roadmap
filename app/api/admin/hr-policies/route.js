import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

import {
  POLICY_CATEGORIES,
  POLICY_STATUSES,
  cleanText,
  sanitizeSearch,
  jsonError,
  getActorId,
  getErrorStatus,
  mapDatabaseError,
  normalizePayload,
  validatePayload,
} from "./_helpers";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function applyFilters(
  query,
  {
    guard,
    search,
    companyId,
    category,
    status,
    mandatory,
  }
) {
  query = guard.applyScope(
    query,
    "company_id"
  );

  if (search) {
    query = query.or(
      [
        `policy_code.ilike.%${search}%`,
        `policy_name.ilike.%${search}%`,
        `description.ilike.%${search}%`,
        `owner_department.ilike.%${search}%`,
      ].join(",")
    );
  }

  if (companyId) {
    query = query.eq(
      "company_id",
      companyId
    );
  }

  if (category) {
    query = query.eq(
      "policy_category",
      category
    );
  }

  if (status) {
    query = query.eq(
      "status",
      status
    );
  }

  if (
    mandatory === "true" ||
    mandatory === "false"
  ) {
    query = query.eq(
      "is_mandatory",
      mandatory === "true"
    );
  }

  return query;
}

async function loadSummary(filters) {
  let query = supabaseAdmin
    .from("hr_policies")
    .select("id,status,is_mandatory");

  query = applyFilters(
    query,
    filters
  );

  const {
    data,
    error,
  } = await query.limit(5000);

  if (error) {
    throw error;
  }

  const rows = data || [];

  return {
    total: rows.length,
    draft: rows.filter(
      (item) => item.status === "draft"
    ).length,
    published: rows.filter(
      (item) => item.status === "published"
    ).length,
    archived: rows.filter(
      (item) => item.status === "archived"
    ).length,
    mandatory: rows.filter(
      (item) => item.is_mandatory === true
    ).length,
  };
}

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "policy.hr_policies",
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
    } = new URL(req.url);

    const search =
      sanitizeSearch(
        searchParams.get("search")
      );

    const companyId =
      cleanText(
        searchParams.get("company_id")
      );

    const category =
      cleanText(
        searchParams.get(
          "policy_category"
        )
      );

    const status =
      cleanText(
        searchParams.get("status")
      );

    const mandatory =
      cleanText(
        searchParams.get(
          "is_mandatory"
        )
      );

    const page = Math.max(
      Number(
        searchParams.get("page")
      ) || 1,
      1
    );

    const pageSize = Math.min(
      Math.max(
        Number(
          searchParams.get("pageSize")
        ) || DEFAULT_PAGE_SIZE,
        1
      ),
      MAX_PAGE_SIZE
    );

    if (
      companyId &&
      !guard.canAccessId(companyId)
    ) {
      return jsonError(
        "คุณไม่มีสิทธิ์เข้าถึงนโยบายของบริษัทนี้",
        403
      );
    }

    if (
      category &&
      !POLICY_CATEGORIES.includes(
        category
      )
    ) {
      return jsonError(
        "หมวดหมู่นโยบายไม่ถูกต้อง",
        400
      );
    }

    if (
      status &&
      !POLICY_STATUSES.includes(
        status
      )
    ) {
      return jsonError(
        "สถานะนโยบายไม่ถูกต้อง",
        400
      );
    }

    const filters = {
      guard,
      search,
      companyId,
      category,
      status,
      mandatory,
    };

    let query = supabaseAdmin
      .from("hr_policies")
      .select(
        `
          id,
          company_id,
          policy_code,
          policy_name,
          policy_category,
          description,
          owner_department,
          status,
          current_version_no,
          effective_date,
          expire_date,
          is_mandatory,
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
          count: "exact",
        }
      );

    query = applyFilters(
      query,
      filters
    );

    query = query
      .order("updated_at", {
        ascending: false,
      })
      .order("policy_code", {
        ascending: true,
      });

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    const {
      data,
      error,
      count,
    } = await query.range(
      from,
      to
    );

    if (error) {
      throw error;
    }

    const summary =
      await loadSummary(filters);

    const total = count || 0;

    return NextResponse.json({
      success: true,
      data: data || [],
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages:
          Math.ceil(
            total / pageSize
          ),
      },
    });
  } catch (error) {
    console.error(
      "GET_HR_POLICIES_ERROR:",
      error
    );

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}

export async function POST(req) {
  let insertedPolicyId = null;

  try {
    const guard =
      await requireScopedAccess(
        "policy.hr_policies",
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
        "คุณไม่มีสิทธิ์เพิ่มนโยบายให้บริษัทนี้"
      );

    if (scopeError) {
      return scopeError;
    }

    const actorId =
      getActorId(guard);

    const now =
      new Date().toISOString();

    const {
      data: policy,
      error: policyError,
    } = await supabaseAdmin
      .from("hr_policies")
      .insert({
        company_id:
          payload.company_id,
        policy_code:
          payload.policy_code,
        policy_name:
          payload.policy_name,
        policy_category:
          payload.policy_category,
        description:
          payload.description,
        owner_department:
          payload.owner_department,
        status:
          payload.status,
        current_version_no: 1,
        effective_date:
          payload.effective_date,
        expire_date:
          payload.expire_date,
        is_mandatory:
          payload.is_mandatory,
        created_by: actorId,
        updated_by: actorId,
        updated_at: now,
      })
      .select("*")
      .single();

    if (policyError) {
      throw policyError;
    }

    insertedPolicyId =
      policy.id;

    const published =
      payload.status === "published";

    const {
      data: version,
      error: versionError,
    } = await supabaseAdmin
      .from("hr_policy_versions")
      .insert({
        policy_id:
          policy.id,
        version_no: 1,
        version_title:
          payload.version_title,
        content:
          payload.content,
        change_summary:
          payload.change_summary,
        status:
          payload.status,
        effective_date:
          payload.effective_date,
        expire_date:
          payload.expire_date,
        published_at:
          published ? now : null,
        published_by:
          published ? actorId : null,
        created_by:
          actorId,
      })
      .select("*")
      .single();

    if (versionError) {
      throw versionError;
    }

    try {
      await writeActivityLog({
        moduleName:
          "hr_policies",
        actionType:
          "CREATE",
        referenceTable:
          "hr_policies",
        referenceId:
          policy.id,
        description:
          `เพิ่มนโยบายบริษัท ${policy.policy_code} - ${policy.policy_name}`,
        newData: {
          ...policy,
          current_version:
            version,
        },
      });
    } catch (logError) {
      console.error(
        "HR_POLICY_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มนโยบายบริษัทเรียบร้อยแล้ว",
      data: {
        ...policy,
        current_version:
          version,
      },
    });
  } catch (error) {
    console.error(
      "POST_HR_POLICY_ERROR:",
      error
    );

    if (insertedPolicyId) {
      try {
        await supabaseAdmin
          .from("hr_policies")
          .delete()
          .eq(
            "id",
            insertedPolicyId
          );
      } catch {
        // best effort cleanup
      }
    }

    return jsonError(
      mapDatabaseError(error),
      getErrorStatus(error)
    );
  }
}
