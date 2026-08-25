import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   CONSTANTS
========================================================= */

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ALL_LIMIT = 5000;

const ALLOWED_STATUSES = [
  "active",
  "inactive",
];

const ALLOWED_IMPORTANCE_LEVELS = [
  "low",
  "medium",
  "high",
  "critical",
];

const POSITION_COMPETENCY_SELECT = `
  id,
  position_id,
  competency_id,
  required_level_id,
  importance_level,
  status,
  sort_order,
  created_at,
  updated_at
`;

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function successResponse(
  data,
  {
    status = 200,
    message = null,
    pagination = null,
    meta = null,
  } = {}
) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(
    response,
    {
      status,
    }
  );
}

function errorResponse(
  message,
  {
    status = 500,
    error = null,
    details = null,
  } = {}
) {
  const response = {
    success: false,

    // รองรับ Frontend เดิมที่อ่าน json.error
    error: message,

    message,
  };

  if (error) {
    response.details_error = error;
  }

  if (details) {
    response.details = details;
  }

  return NextResponse.json(
    response,
    {
      status,
    }
  );
}

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
  return String(
    value ?? ""
  ).trim();
}

function cleanBoolean(
  value,
  fallback = false
) {
  if (
    typeof value === "boolean"
  ) {
    return value;
  }

  if (
    value === true ||
    value === "true" ||
    value === "1" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === "0" ||
    value === 0
  ) {
    return false;
  }

  return fallback;
}

function parsePositiveInteger(
  value,
  fallback,
  max = null
) {
  const parsed =
    Number.parseInt(
      String(value ?? ""),
      10
    );

  if (
    Number.isNaN(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  if (
    max !== null &&
    parsed > max
  ) {
    return max;
  }

  return parsed;
}

function parseSortOrder(
  value,
  fallback = 0
) {
  const parsed =
    Number.parseInt(
      String(value ?? ""),
      10
    );

  if (
    Number.isNaN(parsed) ||
    parsed < 0
  ) {
    return fallback;
  }

  return parsed;
}

function sanitizeSearch(value) {
  return cleanText(value)
    .replaceAll(",", " ")
    .replaceAll("(", " ")
    .replaceAll(")", " ")
    .trim();
}

function getErrorStatus(error) {
  if (!error) {
    return 500;
  }

  if (error.code === "23505") {
    return 409;
  }

  if (
    error.code === "23503" ||
    error.code === "23514" ||
    error.code === "23502" ||
    error.code === "22P02"
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
    return "ตำแหน่งนี้มี Competency ดังกล่าวอยู่แล้ว";
  }

  if (error.code === "23503") {
    return "ไม่พบข้อมูลตำแหน่ง Competency หรือระดับที่อ้างอิง";
  }

  if (error.code === "23514") {
    return "ข้อมูลไม่ผ่านเงื่อนไขที่ฐานข้อมูลกำหนด";
  }

  if (error.code === "23502") {
    return "กรุณากรอกข้อมูลที่จำเป็นให้ครบ";
  }

  if (error.code === "22P02") {
    return "รูปแบบ UUID หรือข้อมูลที่ส่งมาไม่ถูกต้อง";
  }

  return (
    error.message ||
    "เกิดข้อผิดพลาดในฐานข้อมูล"
  );
}

function validatePayload(payload) {
  if (!payload.position_id) {
    return "กรุณาเลือกตำแหน่ง";
  }

  if (!payload.competency_id) {
    return "กรุณาเลือก Competency";
  }

  if (!payload.required_level_id) {
    return "กรุณาเลือกระดับ Competency";
  }

  if (
    !ALLOWED_IMPORTANCE_LEVELS.includes(
      payload.importance_level
    )
  ) {
    return "ระดับความสำคัญไม่ถูกต้อง";
  }

  if (
    !ALLOWED_STATUSES.includes(
      payload.status
    )
  ) {
    return "สถานะไม่ถูกต้อง";
  }

  if (
    !Number.isInteger(
      payload.sort_order
    ) ||
    payload.sort_order < 0
  ) {
    return "ลำดับต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป";
  }

  return null;
}

function normalizePayload(
  body = {}
) {
  return {
    position_id:
      cleanText(
        body.position_id
      ),

    competency_id:
      cleanText(
        body.competency_id
      ),

    required_level_id:
      cleanText(
        body.required_level_id
      ),

    importance_level:
      cleanText(
        body.importance_level ||
        "medium"
      ).toLowerCase(),

    status:
      cleanText(
        body.status ||
        "active"
      ).toLowerCase(),

    sort_order:
      parseSortOrder(
        body.sort_order,
        0
      ),
  };
}

/* =========================================================
   MASTER LOADERS

   ไม่ใช้ vw_position_competencies
   และไม่ใช้ nested relationship จาก position_competencies

   เหตุผล:
   - รองรับ Position Architecture ปัจจุบัน
   - ไม่ผูก GET กับ PostgREST Schema Cache
   - แสดง orphan reference ได้ชัดเจน
========================================================= */

async function loadPositionsByIds(
  ids = []
) {
  const uniqueIds =
    [...new Set(
      ids.filter(Boolean)
    )];

  if (!uniqueIds.length) {
    return new Map();
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("positions")
      .select(
        `
          id,
          position_code,
          position_name,
          short_name,
          position_family_id,
          job_id,
          is_manager,
          is_executive,
          status
        `
      )
      .in(
        "id",
        uniqueIds
      );

  if (error) {
    throw error;
  }

  return new Map(
    (data || []).map(
      (item) => [
        item.id,
        item,
      ]
    )
  );
}

async function loadCompetenciesByIds(
  ids = []
) {
  const uniqueIds =
    [...new Set(
      ids.filter(Boolean)
    )];

  if (!uniqueIds.length) {
    return new Map();
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("competencies")
      .select(
        `
          id,
          competency_code,
          competency_name,
          competency_type_id,
          status
        `
      )
      .in(
        "id",
        uniqueIds
      );

  if (error) {
    throw error;
  }

  return new Map(
    (data || []).map(
      (item) => [
        item.id,
        item,
      ]
    )
  );
}

async function loadCompetencyLevelsByIds(
  ids = []
) {
  const uniqueIds =
    [...new Set(
      ids.filter(Boolean)
    )];

  if (!uniqueIds.length) {
    return new Map();
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "competency_levels"
      )
      .select(
        `
          id,
          level_code,
          level_name,
          level_number,
          status
        `
      )
      .in(
        "id",
        uniqueIds
      );

  if (error) {
    throw error;
  }

  return new Map(
    (data || []).map(
      (item) => [
        item.id,
        item,
      ]
    )
  );
}

async function loadCompetencyTypesByIds(
  ids = []
) {
  const uniqueIds =
    [...new Set(
      ids.filter(Boolean)
    )];

  if (!uniqueIds.length) {
    return new Map();
  }

  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "competency_types"
      )
      .select(
        `
          id,
          type_code,
          type_name
        `
      )
      .in(
        "id",
        uniqueIds
      );

  if (error) {
    throw error;
  }

  return new Map(
    (data || []).map(
      (item) => [
        item.id,
        item,
      ]
    )
  );
}

async function enrichRows(
  rows = []
) {
  const [
    positionMap,
    competencyMap,
    levelMap,
  ] =
    await Promise.all([
      loadPositionsByIds(
        rows.map(
          (item) =>
            item.position_id
        )
      ),

      loadCompetenciesByIds(
        rows.map(
          (item) =>
            item.competency_id
        )
      ),

      loadCompetencyLevelsByIds(
        rows.map(
          (item) =>
            item.required_level_id
        )
      ),
    ]);

  const typeMap =
    await loadCompetencyTypesByIds(
      [...competencyMap.values()]
        .map(
          (item) =>
            item.competency_type_id
        )
        .filter(Boolean)
    );

  return rows.map(
    (item) => {
      const position =
        positionMap.get(
          item.position_id
        ) || null;

      const competency =
        competencyMap.get(
          item.competency_id
        ) || null;

      const level =
        levelMap.get(
          item.required_level_id
        ) || null;

      const competencyType =
        competency
          ?.competency_type_id
          ? typeMap.get(
              competency
                .competency_type_id
            ) || null
          : null;

      return {
        id:
          item.id,

        position_id:
          item.position_id,

        position_code:
          position
            ?.position_code ||
          "",

        position_name:
          position
            ?.position_name ||
          "",

        position_family_id:
          position
            ?.position_family_id ||
          null,

        job_id:
          position
            ?.job_id ||
          null,

        competency_id:
          item.competency_id,

        competency_code:
          competency
            ?.competency_code ||
          "",

        competency_name:
          competency
            ?.competency_name ||
          "",

        competency_type_id:
          competency
            ?.competency_type_id ||
          null,

        competency_type:
          competencyType
            ?.type_code ||
          "",

        competency_type_name:
          competencyType
            ?.type_name ||
          "",

        required_level_id:
          item.required_level_id,

        required_level_code:
          level
            ?.level_code ||
          "",

        required_level_name:
          level
            ?.level_name ||
          "",

        required_level:
          level
            ?.level_number ??
          null,

        importance_level:
          item.importance_level ||
          "medium",

        status:
          item.status ||
          "active",

        sort_order:
          Number(
            item.sort_order ||
            0
          ),

        created_at:
          item.created_at,

        updated_at:
          item.updated_at,

        position_exists:
          Boolean(position),

        competency_exists:
          Boolean(competency),

        required_level_exists:
          Boolean(level),
      };
    }
  );
}

/* =========================================================
   SEARCH IDS
========================================================= */

async function resolveSearchIds(
  search
) {
  if (!search) {
    return {
      positionIds: [],
      competencyIds: [],
      levelIds: [],
    };
  }

  const pattern =
    `%${search}%`;

  const [
    positionResult,
    competencyResult,
    levelResult,
  ] =
    await Promise.all([
      supabaseAdmin
        .from("positions")
        .select("id")
        .or(
          [
            `position_code.ilike.${pattern}`,
            `position_name.ilike.${pattern}`,
          ].join(",")
        )
        .limit(500),

      supabaseAdmin
        .from("competencies")
        .select("id")
        .or(
          [
            `competency_code.ilike.${pattern}`,
            `competency_name.ilike.${pattern}`,
          ].join(",")
        )
        .limit(500),

      supabaseAdmin
        .from(
          "competency_levels"
        )
        .select("id")
        .or(
          [
            `level_code.ilike.${pattern}`,
            `level_name.ilike.${pattern}`,
          ].join(",")
        )
        .limit(500),
    ]);

  if (positionResult.error) {
    throw positionResult.error;
  }

  if (competencyResult.error) {
    throw competencyResult.error;
  }

  if (levelResult.error) {
    throw levelResult.error;
  }

  return {
    positionIds:
      (positionResult.data || [])
        .map(
          (item) => item.id
        )
        .filter(Boolean),

    competencyIds:
      (competencyResult.data || [])
        .map(
          (item) => item.id
        )
        .filter(Boolean),

    levelIds:
      (levelResult.data || [])
        .map(
          (item) => item.id
        )
        .filter(Boolean),
  };
}

/* =========================================================
   GET
   /api/admin/position-competencies

   Permission:
   ems.position_competencies.view

   Scope:
   ไม่ใช้ Organization Scope
   เพราะเป็น Skill & Competency / Job Architecture Master
========================================================= */

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_competencies",
        "view"
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

    const positionId =
      cleanText(
        searchParams.get(
          "position_id"
        )
      );

    const competencyId =
      cleanText(
        searchParams.get(
          "competency_id"
        )
      );

    const requiredLevelId =
      cleanText(
        searchParams.get(
          "required_level_id"
        )
      );

    const importanceLevel =
      cleanText(
        searchParams.get(
          "importance_level"
        )
      ).toLowerCase();

    const status =
      cleanText(
        searchParams.get(
          "status"
        )
      ).toLowerCase();

    const all =
      cleanBoolean(
        searchParams.get(
          "all"
        ),
        false
      );

    const page =
      parsePositiveInteger(
        searchParams.get(
          "page"
        ),
        DEFAULT_PAGE
      );

    const pageSize =
      parsePositiveInteger(
        searchParams.get(
          "pageSize"
        ),
        DEFAULT_PAGE_SIZE,
        MAX_PAGE_SIZE
      );

    if (
      importanceLevel &&
      !ALLOWED_IMPORTANCE_LEVELS.includes(
        importanceLevel
      )
    ) {
      return errorResponse(
        "ระดับความสำคัญไม่ถูกต้อง",
        {
          status: 400,
        }
      );
    }

    if (
      status &&
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {
      return errorResponse(
        "สถานะไม่ถูกต้อง",
        {
          status: 400,
        }
      );
    }

    let query =
      supabaseAdmin
        .from(
          "position_competencies"
        )
        .select(
          POSITION_COMPETENCY_SELECT,
          {
            count:
              all
                ? undefined
                : "exact",
          }
        );

    if (positionId) {
      query =
        query.eq(
          "position_id",
          positionId
        );
    }

    if (competencyId) {
      query =
        query.eq(
          "competency_id",
          competencyId
        );
    }

    if (
      requiredLevelId
    ) {
      query =
        query.eq(
          "required_level_id",
          requiredLevelId
        );
    }

    if (
      importanceLevel
    ) {
      query =
        query.eq(
          "importance_level",
          importanceLevel
        );
    }

    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }

    if (search) {
      const {
        positionIds,
        competencyIds,
        levelIds,
      } =
        await resolveSearchIds(
          search
        );

      const filters = [];

      if (
        positionIds.length
      ) {
        filters.push(
          `position_id.in.(${positionIds.join(
            ","
          )})`
        );
      }

      if (
        competencyIds.length
      ) {
        filters.push(
          `competency_id.in.(${competencyIds.join(
            ","
          )})`
        );
      }

      if (
        levelIds.length
      ) {
        filters.push(
          `required_level_id.in.(${levelIds.join(
            ","
          )})`
        );
      }

      if (!filters.length) {
        return successResponse(
          [],
          {
            pagination: {
              page,
              pageSize,
              total: 0,
              totalPages: 1,
            },

            meta: {
              search,
            },
          }
        );
      }

      query =
        query.or(
          filters.join(",")
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
          "created_at",
          {
            ascending: false,
          }
        );

    if (all) {
      query =
        query.limit(
          ALL_LIMIT
        );
    } else {
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
    } = await query;

    if (error) {
      console.error(
        "GET position-competencies error:",
        error
      );

      return errorResponse(
        "ไม่สามารถโหลดข้อมูลสมรรถนะประจำตำแหน่งได้",
        {
          status:
            getErrorStatus(
              error
            ),

          error:
            mapDatabaseError(
              error
            ),
        }
      );
    }

    const items =
      await enrichRows(
        data || []
      );

    if (all) {
      return successResponse(
        items,
        {
          pagination: {
            page: 1,
            pageSize:
              items.length,
            total:
              items.length,
            totalPages: 1,
          },

          meta: {
            all: true,
          },
        }
      );
    }

    const total =
      Number(
        count || 0
      );

    return successResponse(
      items,
      {
        pagination: {
          page,
          pageSize,
          total,
          totalPages:
            Math.max(
              Math.ceil(
                total /
                pageSize
              ),
              1
            ),
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/position-competencies exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการโหลดข้อมูลสมรรถนะประจำตำแหน่ง",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}

/* =========================================================
   POST
   /api/admin/position-competencies

   Permission:
   ems.position_competencies.create
========================================================= */

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_competencies",
        "create"
      );

    if (!guard.ok) {
      return guard.response;
    }

    let body = null;

    try {
      body =
        await req.json();
    } catch {
      return errorResponse(
        "รูปแบบ Request Body ไม่ถูกต้อง",
        {
          status: 400,
        }
      );
    }

    if (
      !body ||
      typeof body !==
        "object" ||
      Array.isArray(body)
    ) {
      return errorResponse(
        "Request Body ต้องเป็น Object",
        {
          status: 400,
        }
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

    if (validationError) {
      return errorResponse(
        validationError,
        {
          status: 400,
        }
      );
    }

    const [
      positionResult,
      competencyResult,
      levelResult,
    ] =
      await Promise.all([
        supabaseAdmin
          .from("positions")
          .select(
            `
              id,
              position_code,
              position_name,
              status
            `
          )
          .eq(
            "id",
            payload.position_id
          )
          .maybeSingle(),

        supabaseAdmin
          .from("competencies")
          .select(
            `
              id,
              competency_code,
              competency_name,
              status
            `
          )
          .eq(
            "id",
            payload.competency_id
          )
          .maybeSingle(),

        supabaseAdmin
          .from(
            "competency_levels"
          )
          .select(
            `
              id,
              level_code,
              level_name,
              level_number,
              status
            `
          )
          .eq(
            "id",
            payload.required_level_id
          )
          .maybeSingle(),
      ]);

    for (
      const result of [
        positionResult,
        competencyResult,
        levelResult,
      ]
    ) {
      if (result.error) {
        throw result.error;
      }
    }

    if (!positionResult.data) {
      return errorResponse(
        "ไม่พบข้อมูลตำแหน่ง",
        {
          status: 404,
        }
      );
    }

    if (!competencyResult.data) {
      return errorResponse(
        "ไม่พบข้อมูล Competency",
        {
          status: 404,
        }
      );
    }

    if (!levelResult.data) {
      return errorResponse(
        "ไม่พบระดับ Competency",
        {
          status: 404,
        }
      );
    }

    const {
      data: duplicate,
      error: duplicateError,
    } =
      await supabaseAdmin
        .from(
          "position_competencies"
        )
        .select("id")
        .eq(
          "position_id",
          payload.position_id
        )
        .eq(
          "competency_id",
          payload.competency_id
        )
        .limit(1)
        .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return errorResponse(
        `ตำแหน่ง ${positionResult.data.position_name} มี Competency ${competencyResult.data.competency_name} อยู่แล้ว`,
        {
          status: 409,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "position_competencies"
        )
        .insert({
          ...payload,

          updated_at:
            new Date()
              .toISOString(),
        })
        .select(
          POSITION_COMPETENCY_SELECT
        )
        .single();

    if (error) {
      console.error(
        "POST position-competencies error:",
        error
      );

      return errorResponse(
        mapDatabaseError(
          error
        ),
        {
          status:
            getErrorStatus(
              error
            ),

          error:
            error.message,
        }
      );
    }

    const [
      createdItem,
    ] =
      await enrichRows(
        [data]
      );

    try {
      await writeActivityLog({
        moduleName:
          "position_competencies",

        actionType:
          "CREATE",

        referenceTable:
          "position_competencies",

        referenceId:
          data.id,

        description:
          `เพิ่ม Competency ${competencyResult.data.competency_name} ให้ตำแหน่ง ${positionResult.data.position_name}`,

        oldData:
          null,

        newData:
          createdItem,
      });
    } catch (logError) {
      console.error(
        "Write position competency activity log error:",
        logError
      );
    }

    return successResponse(
      createdItem,
      {
        status: 201,

        message:
          "เพิ่มสมรรถนะประจำตำแหน่งเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/position-competencies exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการเพิ่มสมรรถนะประจำตำแหน่ง",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}
