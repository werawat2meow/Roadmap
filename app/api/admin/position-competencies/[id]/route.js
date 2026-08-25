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
    return "ตำแหน่งนี้มี Competency ดังกล่าวอยู่แล้ว";
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

/* =========================================================
   LOADERS
========================================================= */

async function getPositionCompetencyById(
  id
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from(
        "position_competencies"
      )
      .select(
        POSITION_COMPETENCY_SELECT
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
  id
) {
  if (!id) {
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
        id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function loadCompetency(
  id
) {
  if (!id) {
    return null;
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
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function loadLevel(
  id
) {
  if (!id) {
    return null;
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
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function loadCompetencyType(
  id
) {
  if (!id) {
    return null;
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
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function enrichItem(
  item
) {
  if (!item) {
    return null;
  }

  const [
    position,
    competency,
    level,
  ] =
    await Promise.all([
      loadPosition(
        item.position_id
      ),

      loadCompetency(
        item.competency_id
      ),

      loadLevel(
        item.required_level_id
      ),
    ]);

  const competencyType =
    competency
      ?.competency_type_id
      ? await loadCompetencyType(
          competency
            .competency_type_id
        )
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

/* =========================================================
   GET
   /api/admin/position-competencies/[id]

   Permission:
   ems.position_competencies.view
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_competencies",
        "view"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสรายการสมรรถนะประจำตำแหน่ง",
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } =
      await getPositionCompetencyById(
        id
      );

    if (error) {
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

    if (!data) {
      return errorResponse(
        "ไม่พบข้อมูลสมรรถนะประจำตำแหน่ง",
        {
          status: 404,
        }
      );
    }

    return successResponse(
      await enrichItem(
        data
      )
    );
  } catch (error) {
    console.error(
      "GET /api/admin/position-competencies/[id] exception:",
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
   PATCH
   /api/admin/position-competencies/[id]

   Permission:
   ems.position_competencies.edit
========================================================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_competencies",
        "edit"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสรายการสมรรถนะประจำตำแหน่ง",
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
      await getPositionCompetencyById(
        id
      );

    if (currentError) {
      return errorResponse(
        "ไม่สามารถโหลดข้อมูลเดิมได้",
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
        "ไม่พบข้อมูลสมรรถนะประจำตำแหน่ง",
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

      competency_id:
        body.competency_id !==
        undefined
          ? cleanText(
              body.competency_id
            )
          : current
              .competency_id,

      required_level_id:
        body.required_level_id !==
        undefined
          ? cleanText(
              body.required_level_id
            )
          : current
              .required_level_id,

      importance_level:
        body.importance_level !==
        undefined
          ? cleanText(
              body.importance_level
            ).toLowerCase()
          : current
              .importance_level,

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
      competency,
      level,
    ] =
      await Promise.all([
        loadPosition(
          payload.position_id
        ),

        loadCompetency(
          payload.competency_id
        ),

        loadLevel(
          payload.required_level_id
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

    if (!competency) {
      return errorResponse(
        "ไม่พบข้อมูล Competency",
        {
          status: 404,
        }
      );
    }

    if (!level) {
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
        `ตำแหน่ง ${position.position_name} มี Competency ${competency.competency_name} อยู่แล้ว`,
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
          POSITION_COMPETENCY_SELECT
        )
        .single();

    if (error) {
      console.error(
        "PATCH position-competencies/[id] error:",
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
      await enrichItem(
        data
      );

    try {
      await writeActivityLog({
        moduleName:
          "position_competencies",

        actionType:
          "UPDATE",

        referenceTable:
          "position_competencies",

        referenceId:
          id,

        description:
          `แก้ไข Competency ${competency.competency_name} ของตำแหน่ง ${position.position_name}`,

        oldData:
          await enrichItem(
            current
          ),

        newData:
          updatedItem,
      });
    } catch (logError) {
      console.error(
        "Write position competency update activity log error:",
        logError
      );
    }

    return successResponse(
      updatedItem,
      {
        message:
          "แก้ไขสมรรถนะประจำตำแหน่งเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "PATCH /api/admin/position-competencies/[id] exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการแก้ไขสมรรถนะประจำตำแหน่ง",
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
   /api/admin/position-competencies/[id]

   Permission:
   ems.position_competencies.delete
========================================================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const guard =
      await requireScopedAccess(
        "ems.position_competencies",
        "delete"
      );

    if (!guard.ok) {
      return guard.response;
    }

    const { id } =
      await params;

    if (!id) {
      return errorResponse(
        "ไม่พบรหัสรายการสมรรถนะประจำตำแหน่ง",
        {
          status: 400,
        }
      );
    }

    const {
      data: current,
      error: currentError,
    } =
      await getPositionCompetencyById(
        id
      );

    if (currentError) {
      return errorResponse(
        "ไม่สามารถตรวจสอบข้อมูลก่อนลบได้",
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
        "ไม่พบข้อมูลสมรรถนะประจำตำแหน่ง",
        {
          status: 404,
        }
      );
    }

    const oldData =
      await enrichItem(
        current
      );

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          "position_competencies"
        )
        .delete()
        .eq(
          "id",
          id
        );

    if (error) {
      console.error(
        "DELETE position-competencies/[id] error:",
        error
      );

      if (
        error.code === "23503"
      ) {
        return errorResponse(
          "ไม่สามารถลบรายการนี้ได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่ กรุณาเปลี่ยนสถานะเป็นไม่ใช้งานแทน",
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
          "position_competencies",

        actionType:
          "DELETE",

        referenceTable:
          "position_competencies",

        referenceId:
          id,

        description:
          `ลบ Competency ${oldData?.competency_name || "-"} ออกจากตำแหน่ง ${oldData?.position_name || "-"}`,

        oldData,

        newData:
          null,
      });
    } catch (logError) {
      console.error(
        "Write position competency delete activity log error:",
        logError
      );
    }

    return successResponse(
      {
        id,

        position_id:
          current.position_id,

        competency_id:
          current.competency_id,
      },
      {
        message:
          "ลบสมรรถนะออกจากตำแหน่งเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "DELETE /api/admin/position-competencies/[id] exception:",
      error
    );

    return errorResponse(
      "เกิดข้อผิดพลาดในการลบสมรรถนะประจำตำแหน่ง",
      {
        status: 500,

        error:
          error?.message ||
          "Unknown error",
      }
    );
  }
}
