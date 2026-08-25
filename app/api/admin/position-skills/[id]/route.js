import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

import {
  requireScopedAccess,
} from "@/lib/auth/requireScopedAccess";

/* =========================================================
   CONSTANTS
========================================================= */

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
  } = {}
) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message =
      message;
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

    message,
  };

  if (error) {
    response.details_error =
      error;
  }

  if (details) {
    response.details =
      details;
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
    return "มีข้อมูลอื่นอ้างอิงรายการนี้ หรือไม่พบ Master ที่อ้างอิง";
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

/* =========================================================
   LOAD / ENRICH
========================================================= */

async function getPositionSkillById(
  id
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
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
        `
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

  return {
    data,
    error,
  };
}

async function loadPosition(
  positionId
) {
  if (!positionId) {
    return null;
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
      .eq(
        "id",
        positionId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function loadSkill(
  skillId
) {
  if (!skillId) {
    return null;
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
          skill_name,
          status
        `
      )
      .eq(
        "id",
        skillId
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function enrichPositionSkill(
  item
) {
  if (!item) {
    return null;
  }

  const [
    position,
    skill,
  ] =
    await Promise.all([
      loadPosition(
        item.position_id
      ),

      loadSkill(
        item.skill_id
      ),
    ]);

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

    position_exists:
      Boolean(position),

    skill_exists:
      Boolean(skill),
  };
}

/* =========================================================
   GET
   /api/admin/position-skills/[id]

   Permission:
   ems.position_skills.view
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_skills",
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสรายการทักษะประจำตำแหน่ง",
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } =
      await getPositionSkillById(
        id
      );

    if (error) {
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

    if (!data) {
      return errorResponse(
        "ไม่พบข้อมูลทักษะประจำตำแหน่ง",
        {
          status: 404,
        }
      );
    }

    return successResponse(
      await enrichPositionSkill(
        data
      )
    );
  } catch (error) {
    console.error(
      "GET /api/admin/position-skills/[id] exception:",
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
   PATCH
   /api/admin/position-skills/[id]

   Permission:
   ems.position_skills.edit
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_skills",
        "edit"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสรายการทักษะประจำตำแหน่ง",
        {
          status: 400,
        }
      );
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

    const {
      data: current,
      error: currentError,
    } =
      await getPositionSkillById(
        id
      );

    if (currentError) {
      return errorResponse(
        "ไม่สามารถโหลดข้อมูลทักษะประจำตำแหน่งเดิมได้",
        {
          status:
            getErrorStatus(
              currentError
            ),

          error:
            mapDatabaseError(
              currentError
            ),
        }
      );
    }

    if (!current) {
      return errorResponse(
        "ไม่พบข้อมูลทักษะประจำตำแหน่ง",
        {
          status: 404,
        }
      );
    }

    const payload = {
      position_id:
        body.position_id !==
        undefined
          ? cleanText(
              body.position_id
            )
          : current
              .position_id,

      skill_id:
        body.skill_id !==
        undefined
          ? cleanText(
              body.skill_id
            )
          : current
              .skill_id,

      required_level:
        body.required_level !==
        undefined
          ? parseRequiredLevel(
              body.required_level,
              Number(
                current.required_level ||
                1
              )
            )
          : Number(
              current.required_level ||
              1
            ),

      importance_level:
        body.importance_level !==
        undefined
          ? cleanText(
              body.importance_level
            ).toLowerCase()
          : current
              .importance_level,

      is_mandatory:
        body.is_mandatory !==
        undefined
          ? cleanBoolean(
              body.is_mandatory,
              false
            )
          : Boolean(
              current.is_mandatory
            ),

      description:
        body.description !==
        undefined
          ? cleanNullableText(
              body.description
            )
          : current
              .description,

      status:
        body.status !==
        undefined
          ? cleanText(
              body.status
            ).toLowerCase()
          : current.status,

      sort_order:
        body.sort_order !==
        undefined
          ? parseSortOrder(
              body.sort_order,
              Number(
                current.sort_order ||
                0
              )
            )
          : Number(
              current.sort_order ||
              0
            ),
    };

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
      position,
      skill,
    ] =
      await Promise.all([
        loadPosition(
          payload.position_id
        ),

        loadSkill(
          payload.skill_id
        ),
      ]);

    if (!position) {
      return errorResponse(
        "ไม่พบข้อมูลตำแหน่ง",
        {
          status: 404,
        }
      );
    }

    if (!skill) {
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
        .neq(
          "id",
          id
        )
        .limit(1)
        .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return errorResponse(
        `ตำแหน่ง ${position.position_name} มีทักษะ ${skill.skill_name} อยู่แล้ว`,
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
        .update({
          ...payload,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          id
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
          `
        )
        .single();

    if (error) {
      console.error(
        "PATCH position-skills/[id] error:",
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

    const updatedItem =
      await enrichPositionSkill(
        data
      );

    try {
      await writeActivityLog({
        moduleName:
          "position_skills",

        actionType:
          "UPDATE",

        referenceTable:
          "position_skills",

        referenceId:
          id,

        description:
          `แก้ไขทักษะ ${skill.skill_name} ของตำแหน่ง ${position.position_name}`,

        oldData:
          await enrichPositionSkill(
            current
          ),

        newData:
          updatedItem,
      });
    } catch (logError) {
      console.error(
        "Write position skill update activity log error:",
        logError
      );
    }

    return successResponse(
      updatedItem,
      {
        message:
          "แก้ไขทักษะประจำตำแหน่งเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "PATCH /api/admin/position-skills/[id] exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการแก้ไขทักษะประจำตำแหน่ง",
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
   DELETE
   /api/admin/position-skills/[id]

   Permission:
   ems.position_skills.delete
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_skills",
        "delete"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสรายการทักษะประจำตำแหน่ง",
        {
          status: 400,
        }
      );
    }

    const {
      data: current,
      error: currentError,
    } =
      await getPositionSkillById(
        id
      );

    if (currentError) {
      return errorResponse(
        "ไม่สามารถตรวจสอบข้อมูลทักษะประจำตำแหน่งก่อนลบได้",
        {
          status:
            getErrorStatus(
              currentError
            ),

          error:
            mapDatabaseError(
              currentError
            ),
        }
      );
    }

    if (!current) {
      return errorResponse(
        "ไม่พบข้อมูลทักษะประจำตำแหน่ง",
        {
          status: 404,
        }
      );
    }

    const oldData =
      await enrichPositionSkill(
        current
      );

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "position_skills"
        )
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      console.error(
        "DELETE position-skills/[id] error:",
        error
      );

      if (
        error.code === "23503"
      ) {
        return errorResponse(
          "ไม่สามารถลบทักษะประจำตำแหน่งนี้ได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่ กรุณาเปลี่ยนสถานะเป็นไม่ใช้งานแทน",
          {
            status: 409,

            error:
              error.message,
          }
        );
      }

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

    try {
      await writeActivityLog({
        moduleName:
          "position_skills",

        actionType:
          "DELETE",

        referenceTable:
          "position_skills",

        referenceId:
          id,

        description:
          `ลบทักษะ ${oldData?.skill_name || "-"} ออกจากตำแหน่ง ${oldData?.position_name || "-"}`,

        oldData,

        newData:
          null,
      });
    } catch (logError) {
      console.error(
        "Write position skill delete activity log error:",
        logError
      );
    }

    return successResponse(
      {
        id,

        position_id:
          current.position_id,

        skill_id:
          current.skill_id,
      },
      {
        message:
          "ลบทักษะออกจากตำแหน่งเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "DELETE /api/admin/position-skills/[id] exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการลบทักษะประจำตำแหน่ง",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}
