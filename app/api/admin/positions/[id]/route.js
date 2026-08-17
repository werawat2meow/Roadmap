import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const position_code = body?.position_code?.trim();
    const position_name = body?.position_name?.trim();
    const short_name = body?.short_name?.trim() || null;
    const description = body?.description?.trim() || null;
    const position_group = body?.position_group?.trim() || null;
    const job_id = body?.job_id || null;
    const position_family_id = body?.position_family_id || null;
    const position_levels = Array.isArray(body?.position_levels) ? body.position_levels.filter(Boolean) : [];
    const is_manager =body?.is_manager ?? false;
    const is_executive =body?.is_executive ?? false;
    const allow_multiple_assignment = body?.allow_multiple_assignment ?? false;
    const status = body?.status || "active";

    /* =========================================================
     * Validation
     * ========================================================= */

    if (!position_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสตำแหน่ง",
        },
        {
          status: 400,
        }
      );
    }

    if (!position_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อตำแหน่ง",
        },
        {
          status: 400,
        }
      );
    }

    if (!position_family_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกกลุ่มสายงาน",
        },
        { status: 400 }
      );
    }

    if (position_levels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกระดับตำแหน่งอย่างน้อย 1 ระดับ",
        },
        { status: 400 }
      );
    }

    const { data: allowedLevels, error: levelError } =
      await supabaseAdmin
        .from("position_family_levels")
        .select("position_level_id")
        .eq("position_family_id", position_family_id);

    if (levelError) {
      throw levelError;
    }


    if ((allowedLevels || []).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Job Family นี้ยังไม่ได้กำหนดระดับตำแหน่ง",
        },
        {
          status: 400,
        }
      );
    }

    const allowedSet  = new Set(
      (allowedLevels || []).map(
        (x) => x.position_level_id
      )
    );

    const invalidLevels = position_levels.filter(
      (id) => !allowedSet.has(id)
    );

    if (invalidLevels.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ระดับตำแหน่งที่เลือกไม่อยู่ใน Job Family นี้",
        },
        {
          status: 400,
        }
      );
    }


    /* =========================================================
     * Duplicate Position Code
     * ========================================================= */

    const { data: duplicate } =
      await supabaseAdmin
        .from("positions")
        .select("id")
        .eq("position_code", position_code)
        .neq("id", id)
        .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสตำแหน่งนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================================================
     * Read Old Data
     * ========================================================= */

    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("positions")
        .select("*")
        .eq("id", id)
        .single();

    if (oldError) {
      throw oldError;
    }

    /* =========================================================
     * Update Position
     * ========================================================= */

    const { data, error } = await supabaseAdmin
      .from("positions")
      .update({
        position_code,
        position_name,
        short_name,
        description,
        position_group,
        job_id,
        position_family_id,
        is_manager,
        is_executive,
        allow_multiple_assignment,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        position_code,
        position_name,
        short_name,
        description,
        position_group,
        job_id,
        position_family_id,
        is_manager,
        is_executive,
        allow_multiple_assignment,
        status,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw error;
    }

    const { error: deleteMappingError } = await supabaseAdmin
      .from("position_level_mappings")
      .delete()
      .eq("position_id", id);

    if (deleteMappingError) {
      throw deleteMappingError;
    }

    if (position_levels.length > 0) {
      const mappingRows = position_levels.map((levelId, index) => ({
        position_id: id,
        position_level_id: levelId,
        is_default: index === 0,
        sort_order: index,
      }));

      const { error: insertMappingError } = await supabaseAdmin
        .from("position_level_mappings")
        .insert(mappingRows);

      if (insertMappingError) {
        throw insertMappingError;
      }
    }

    await writeActivityLog({
      module_name: "positions",
      action_type: "update",
      reference_table: "positions",
      reference_id: id,

      description: `แก้ไขตำแหน่ง ${data.position_code} - ${data.position_name}`,

      old_data: oldData,

      new_data: {
        position_code: data.position_code,
        position_name: data.position_name,
        short_name: data.short_name,
        description: data.description,
        position_group: data.position_group,
        job_id: data.job_id,
        position_family_id: data.position_family_id,
        position_levels,
        is_manager: data.is_manager,
        is_executive: data.is_executive,
        allow_multiple_assignment:data.allow_multiple_assignment,
        status: data.status,
        sort_order: data.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลตำแหน่งสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("UPDATE_POSITION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถแก้ไขข้อมูลตำแหน่งได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldPosition, error: oldPositionError } = await supabaseAdmin
      .from("positions")
      .select(`
        id,
        position_code,
        position_name,
        position_group,
        status,
        sort_order
      `)
      .eq("id", id)
      .single();

    if (oldPositionError) throw oldPositionError;

    const { error } = await supabaseAdmin
      .from("positions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "positions",
      action_type: "delete",
      reference_table: "positions",
      reference_id: oldPosition.id,
      description: `ลบตำแหน่ง ${oldPosition.position_code} - ${oldPosition.position_name}`,
      old_data: {
        position_code: oldPosition.position_code,
        position_name: oldPosition.position_name,
        position_group: oldPosition.position_group,
        status: oldPosition.status,
        sort_order: oldPosition.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลตำแหน่งสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_POSITION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบข้อมูลตำแหน่งได้",
      },
      { status: 500 }
    );
  }
}