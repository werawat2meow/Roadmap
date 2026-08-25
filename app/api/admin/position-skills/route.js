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

    // Frontend เดิมอ่าน json.error
    error: message,

    // เก็บ message ไว้ด้วย
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

function cleanNullableText(value) {
  const cleaned =
    cleanText(value);

  return cleaned || null;
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

function parseRequiredLevel(
  value,
  fallback = 1
) {
  const parsed =
    Number.parseInt(
      String(value ?? ""),
      10
    );

  if (
    Number.isNaN(parsed)
  ) {
    return fallback;
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
    return "ตำแหน่งนี้มีทักษะดังกล่าวอยู่แล้ว";
  }

  if (error.code === "23503") {
    return "ไม่พบข้อมูลตำแหน่งหรือทักษะที่อ้างอิง";
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

/* =========================================================
   VALIDATION
========================================================= */

function validatePayload(payload) {
  if (!payload.position_id) {
    return "กรุณาเลือกตำแหน่ง";
  }

  if (!payload.skill_id) {
    return "กรุณาเลือกทักษะ";
  }

  if (
    !Number.isInteger(
      payload.required_level
    ) ||
    payload.required_level < 1 ||
    payload.required_level > 5
  ) {
    return "ระดับทักษะต้องอยู่ระหว่าง 1 ถึง 5";
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

function normalizePayload(body = {}) {
  return {
    position_id:
      cleanText(
        body.position_id
      ),

    skill_id:
      cleanText(
        body.skill_id
      ),

    required_level:
      parseRequiredLevel(
        body.required_level,
        1
      ),

    importance_level:
      cleanText(
        body.importance_level ||
        "medium"
      ).toLowerCase(),

    is_mandatory:
      cleanBoolean(
        body.is_mandatory,
        false
      ),

    description:
      cleanNullableText(
        body.description
      ),

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

   หมายเหตุ:
   ไม่ใช้ PostgREST nested relationship ใน GET หลัก
   เพื่อไม่ผูก API กับ Schema Cache ของ FK position_id
========================================================= */

async function loadPositionsByIds(ids = []) {
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

async function loadSkillsByIds(ids = []) {
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
      .from("skills")
      .select(
        `
          id,
          skill_code,
          skill_name
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

async function enrichPositionSkills(
  rows = []
) {
  const [
    positionMap,
    skillMap,
  ] =
    await Promise.all([
      loadPositionsByIds(
        rows.map(
          (item) =>
            item.position_id
        )
      ),

      loadSkillsByIds(
        rows.map(
          (item) =>
            item.skill_id
        )
      ),
    ]);

  return rows.map(
    (item) => {
      const position =
        positionMap.get(
          item.position_id
        ) || null;

      const skill =
        skillMap.get(
          item.skill_id
        ) || null;

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

        skill_id:
          item.skill_id,

        skill_code:
          skill
            ?.skill_code ||
          "",

        skill_name:
          skill
            ?.skill_name ||
          "",

        required_level:
          Number(
            item.required_level ||
            1
          ),

        importance_level:
          item.importance_level ||
          "medium",

        is_mandatory:
          Boolean(
            item.is_mandatory
          ),

        description:
          item.description ||
          "",

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

        // ช่วยตรวจข้อมูลเก่าที่เป็น orphan
        position_exists:
          Boolean(position),

        skill_exists:
          Boolean(skill),
      };
    }
  );
}

/* =========================================================
   SEARCH RESOLVER

   Search ตำแหน่ง/ทักษะจาก Master จริง
   แล้วนำ ID มากรอง position_skills
========================================================= */

async function resolveSearchIds(
  search
) {
  if (!search) {
    return {
      positionIds: [],
      skillIds: [],
    };
  }

  const pattern =
    `%${search}%`;

  const [
    positionResult,
    skillResult,
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
        .from("skills")
        .select("id")
        .or(
          [
            `skill_code.ilike.${pattern}`,
            `skill_name.ilike.${pattern}`,
          ].join(",")
        )
        .limit(500),
    ]);

  if (positionResult.error) {
    throw positionResult.error;
  }

  if (skillResult.error) {
    throw skillResult.error;
  }

  return {
    positionIds:
      (positionResult.data || [])
        .map(
          (item) => item.id
        )
        .filter(Boolean),

    skillIds:
      (skillResult.data || [])
        .map(
          (item) => item.id
        )
        .filter(Boolean),
  };
}

/* =========================================================
   GET
   /api/admin/position-skills

   Permission:
   ems.position_skills.view

   Scope:
   ไม่ใช้ Organization Scope
   เพราะเป็น Job Architecture Master
========================================================= */

export async function GET(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_skills",
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

    const skillId =
      cleanText(
        searchParams.get(
          "skill_id"
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
          "position_skills"
        )
        .select(
          `
            id,
            position_id,
            skill_id,
            required_level,
            importance_level,
            is_mandatory,
            description,
            status,
            sort_order,
            created_at,
            updated_at
          `,
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

    if (skillId) {
      query =
        query.eq(
          "skill_id",
          skillId
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
        skillIds,
      } =
        await resolveSearchIds(
          search
        );

      const filters = [
        `description.ilike.%${search}%`,
      ];

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
        skillIds.length
      ) {
        filters.push(
          `skill_id.in.(${skillIds.join(
            ","
          )})`
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
        "GET position-skills error:",
        error
      );

      return errorResponse(
        "ไม่สามารถโหลดข้อมูลทักษะประจำตำแหน่งได้",
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
      await enrichPositionSkills(
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

    const totalPages =
      Math.max(
        Math.ceil(
          total /
          pageSize
        ),
        1
      );

    return successResponse(
      items,
      {
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },

        meta: {
          search:
            search || null,

          filters: {
            position_id:
              positionId ||
              null,

            skill_id:
              skillId ||
              null,

            importance_level:
              importanceLevel ||
              null,

            status:
              status || null,
          },
        },
      }
    );
  } catch (error) {
    console.error(
      "GET /api/admin/position-skills exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการโหลดข้อมูลทักษะประจำตำแหน่ง",
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
   /api/admin/position-skills

   Permission:
   ems.position_skills.create
========================================================= */

export async function POST(req) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_skills",
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
      skillResult,
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
          .from("skills")
          .select(
            `
              id,
              skill_code,
              skill_name,
              status
            `
          )
          .eq(
            "id",
            payload.skill_id
          )
          .maybeSingle(),
      ]);

    if (
      positionResult.error
    ) {
      throw positionResult.error;
    }

    if (
      skillResult.error
    ) {
      throw skillResult.error;
    }

    if (
      !positionResult.data
    ) {
      return errorResponse(
        "ไม่พบข้อมูลตำแหน่ง",
        {
          status: 404,
        }
      );
    }

    if (
      !skillResult.data
    ) {
      return errorResponse(
        "ไม่พบข้อมูลทักษะ",
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
          "position_skills"
        )
        .select("id")
        .eq(
          "position_id",
          payload.position_id
        )
        .eq(
          "skill_id",
          payload.skill_id
        )
        .limit(1)
        .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return errorResponse(
        `ตำแหน่ง ${positionResult.data.position_name} มีทักษะ ${skillResult.data.skill_name} อยู่แล้ว`,
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
          "position_skills"
        )
        .insert({
          ...payload,

          updated_at:
            new Date()
              .toISOString(),
        })
        .select(
          `
            id,
            position_id,
            skill_id,
            required_level,
            importance_level,
            is_mandatory,
            description,
            status,
            sort_order,
            created_at,
            updated_at
          `
        )
        .single();

    if (error) {
      console.error(
        "POST position-skills error:",
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
      await enrichPositionSkills(
        [data]
      );

    try {
      await writeActivityLog({
        moduleName:
          "position_skills",

        actionType:
          "CREATE",

        referenceTable:
          "position_skills",

        referenceId:
          data.id,

        description:
          `เพิ่มทักษะ ${skillResult.data.skill_name} ให้ตำแหน่ง ${positionResult.data.position_name}`,

        oldData:
          null,

        newData:
          createdItem,
      });
    } catch (logError) {
      console.error(
        "Write position skill activity log error:",
        logError
      );
    }

    return successResponse(
      createdItem,
      {
        status: 201,

        message:
          "เพิ่มทักษะประจำตำแหน่งเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "POST /api/admin/position-skills exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการเพิ่มทักษะประจำตำแหน่ง",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}
