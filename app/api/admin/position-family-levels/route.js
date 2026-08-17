import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

/* =========================================================
   HELPERS
========================================================= */

function successResponse(
  data,
  {
    message = null,
    status = 200,
  } = {}
) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
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
  } = {}
) {
  return NextResponse.json(
    {
      success: false,
      message,
      error,
    },
    {
      status,
    }
  );
}

function cleanUuid(value) {
  const cleaned =
    String(value || "").trim();

  return cleaned || null;
}

/* =========================================================
   GET /api/admin/position-family-levels

   รองรับ:
   ?all=true
   ?family_id=<uuid>
========================================================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const familyId =
      cleanUuid(
        searchParams.get(
          "family_id"
        )
      );

    const all =
      searchParams.get("all") ===
      "true";

    let query = supabaseAdmin
      .from(
        "position_family_levels"
      )
      .select(
        `
          id,
          position_family_id,
          position_level_id,
          sort_order,
          created_at,
          updated_at,

          position_families:position_families!position_family_levels_position_family_id_fkey (
            id,
            family_code,
            family_name,
            status,
            sort_order
          ),

          position_levels:position_levels!position_family_levels_position_level_id_fkey (
            id,
            level_code,
            level_name,
            description,
            sort_order,
            status
          )
        `
      );

    /*
      ถ้าส่ง family_id
      ให้กรองเฉพาะ Family นั้น
    */

    if (familyId) {
      query = query.eq(
        "position_family_id",
        familyId
      );
    }

    /*
      ถ้าไม่ได้ส่ง family_id
      ต้องเป็น all=true เท่านั้น
    */

    if (!familyId && !all) {
      return errorResponse(
        "กรุณาระบุ family_id หรือ all=true",
        {
          status: 400,
        }
      );
    }

    query = query
      .order(
        "sort_order",
        {
          ascending: true,
        }
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    const {
      data,
      error,
    } = await query;

    if (error) {
      throw error;
    }

    return successResponse(
      data || []
    );
  } catch (error) {
    console.error(
      "Position Family Levels GET error:",
      error
    );

    return errorResponse(
      "ไม่สามารถโหลดระดับตำแหน่งของกลุ่มสายงานได้",
      {
        status: 500,
        error:
          error?.message ||
          "Internal Server Error",
      }
    );
  }
}

/* =========================================================
   PUT /api/admin/position-family-levels
========================================================= */

export async function PUT(req) {
  try {
    let body = null;

    try {
      body = await req.json();
    } catch (error) {
      return errorResponse(
        "รูปแบบ Request Body ไม่ถูกต้อง",
        {
          status: 400,
          error:
            error?.message ||
            null,
        }
      );
    }

    const familyId =
      cleanUuid(
        body?.family_id
      );

    const rawLevelIds =
      Array.isArray(
        body?.level_ids
      )
        ? body.level_ids
        : [];

    const levelIds = [
      ...new Set(
        rawLevelIds
          .map(cleanUuid)
          .filter(Boolean)
      ),
    ];

    if (!familyId) {
      return errorResponse(
        "family_id is required",
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------------
       Validate Family
    ----------------------------------------------------- */

    const {
      data: family,
      error: familyError,
    } = await supabaseAdmin
      .from(
        "position_families"
      )
      .select(
        `
          id,
          family_code,
          family_name,
          status
        `
      )
      .eq(
        "id",
        familyId
      )
      .maybeSingle();

    if (familyError) {
      throw familyError;
    }

    if (!family) {
      return errorResponse(
        "ไม่พบกลุ่มสายงานที่เลือก",
        {
          status: 404,
        }
      );
    }

    /*
      รองรับล้าง Mapping ทั้งหมด
      กรณี level_ids = []
    */

    if (levelIds.length > 0) {
      const {
        data: levels,
        error: levelsError,
      } = await supabaseAdmin
        .from(
          "position_levels"
        )
        .select(
          `
            id,
            status
          `
        )
        .in(
          "id",
          levelIds
        );

      if (levelsError) {
        throw levelsError;
      }

      const foundIds =
        new Set(
          (levels || []).map(
            (item) => item.id
          )
        );

      const missingIds =
        levelIds.filter(
          (id) =>
            !foundIds.has(id)
        );

      if (
        missingIds.length > 0
      ) {
        return errorResponse(
          "พบระดับตำแหน่งที่ไม่มีอยู่ในระบบ",
          {
            status: 400,
            error:
              missingIds.join(", "),
          }
        );
      }
    }

    /* -----------------------------------------------------
       Load Existing Mapping
    ----------------------------------------------------- */

    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from(
        "position_family_levels"
      )
      .select(
        `
          id,
          position_level_id,
          sort_order
        `
      )
      .eq(
        "position_family_id",
        familyId
      );

    if (existingError) {
      throw existingError;
    }

    const existingRows =
      Array.isArray(existing)
        ? existing
        : [];

    const existingLevelIds =
      new Set(
        existingRows.map(
          (item) =>
            item.position_level_id
        )
      );

    const incomingLevelIds =
      new Set(levelIds);

    /* -----------------------------------------------------
       Delete Mapping
    ----------------------------------------------------- */

    const deleteIds =
      existingRows
        .filter(
          (item) =>
            !incomingLevelIds.has(
              item.position_level_id
            )
        )
        .map(
          (item) => item.id
        );

    if (
      deleteIds.length > 0
    ) {
      const {
        error: deleteError,
      } = await supabaseAdmin
        .from(
          "position_family_levels"
        )
        .delete()
        .in(
          "id",
          deleteIds
        );

      if (deleteError) {
        throw deleteError;
      }
    }

    /* -----------------------------------------------------
       Insert Mapping
    ----------------------------------------------------- */

    const insertRows =
      levelIds
        .filter(
          (id) =>
            !existingLevelIds.has(
              id
            )
        )
        .map(
          (
            id,
            index
          ) => ({
            position_family_id:
              familyId,

            position_level_id:
              id,

            sort_order:
              index,
          })
        );

    if (
      insertRows.length > 0
    ) {
      const {
        error: insertError,
      } = await supabaseAdmin
        .from(
          "position_family_levels"
        )
        .insert(
          insertRows
        );

      if (insertError) {
        throw insertError;
      }
    }

    /* -----------------------------------------------------
       Update Sort Order ของรายการเดิม
    ----------------------------------------------------- */

    for (
      let index = 0;
      index <
      levelIds.length;
      index += 1
    ) {
      const levelId =
        levelIds[index];

      const {
        error: sortError,
      } = await supabaseAdmin
        .from(
          "position_family_levels"
        )
        .update({
          sort_order: index,
          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "position_family_id",
          familyId
        )
        .eq(
          "position_level_id",
          levelId
        );

      if (sortError) {
        throw sortError;
      }
    }

    /* -----------------------------------------------------
       Reload Result
    ----------------------------------------------------- */

    const {
      data: updatedRows,
      error: reloadError,
    } = await supabaseAdmin
      .from(
        "position_family_levels"
      )
      .select(
        `
          id,
          position_family_id,
          position_level_id,
          sort_order,
          created_at,
          updated_at,

          position_levels:position_levels!position_family_levels_position_level_id_fkey (
            id,
            level_code,
            level_name,
            description,
            sort_order,
            status
          )
        `
      )
      .eq(
        "position_family_id",
        familyId
      )
      .order(
        "sort_order",
        {
          ascending: true,
        }
      );

    if (reloadError) {
      throw reloadError;
    }

    return successResponse(
      updatedRows || [],
      {
        message:
          "อัปเดตระดับตำแหน่งของกลุ่มสายงานเรียบร้อยแล้ว",
      }
    );
  } catch (error) {
    console.error(
      "Position Family Levels PUT error:",
      error
    );

    return errorResponse(
      "ไม่สามารถอัปเดตระดับตำแหน่งของกลุ่มสายงานได้",
      {
        status: 500,
        error:
          error?.message ||
          "Internal Server Error",
      }
    );
  }
}