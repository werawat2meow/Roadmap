import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* ==========================================================
 * PATCH
 * ========================================================== */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const levelCode = body?.level_code?.trim()?.toUpperCase();
    const levelName = body?.level_name?.trim();

    if (!levelCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสระดับทักษะ",
        },
        { status: 400 }
      );
    }

    if (!levelName) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อระดับทักษะ",
        },
        { status: 400 }
      );
    }

    /* ==========================================
     * Old Data
     * ========================================== */

    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("skill_levels")
        .select("*")
        .eq("id", id)
        .single();

    if (oldError || !oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลระดับทักษะ",
        },
        { status: 404 }
      );
    }

    /* ==========================================
     * Duplicate Code
     * ========================================== */

    const { data: duplicateCode } =
      await supabaseAdmin
        .from("skill_levels")
        .select("id")
        .eq("level_code", levelCode)
        .neq("id", id)
        .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสระดับทักษะนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ==========================================
     * Duplicate Name
     * ========================================== */

    const { data: duplicateName } =
      await supabaseAdmin
        .from("skill_levels")
        .select("id")
        .ilike("level_name", levelName)
        .neq("id", id)
        .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อระดับทักษะนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ==========================================
     * Update
     * ========================================== */

    const payload = {
      level_code: levelCode,
      level_name: levelName,
      score: Number(body?.score || 0),
      description: body?.description?.trim() || null,
      sort_order: Number(body?.sort_order || 0),
      status: body?.status || "active",
      updated_at: new Date().toISOString(),
    };

    const { data, error } =
      await supabaseAdmin
        .from("skill_levels")
        .update(payload)
        .eq("id", id)
        .select(
          `
            id,
            level_code,
            level_name,
            score,
            description,
            sort_order,
            status,
            created_at,
            updated_at
          `
        )
        .single();

    if (error) throw error;

    /* ==========================================
     * Activity Log
     * ========================================== */

    try {
      await writeActivityLog({
        module: "skill_levels",
        action: "UPDATE",
        description: `แก้ไขระดับทักษะ ${data.level_code} : ${data.level_name}`,
        reference_id: data.id,
        reference_code: data.level_code,
        old_data: oldData,
        new_data: data,
      });
    } catch (logError) {
      console.error(
        "WRITE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลสำเร็จ",
      data,
    });
  } catch (error) {
    console.error(
      "PATCH_SKILL_LEVEL_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Update skill level failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================================================
 * DELETE
 * ========================================================== */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("skill_levels")
        .select("*")
        .eq("id", id)
        .single();

    if (oldError || !oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลระดับทักษะ",
        },
        { status: 404 }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("skill_levels")
        .delete()
        .eq("id", id);

    if (error) throw error;

    try {
      await writeActivityLog({
        module: "skill_levels",
        action: "DELETE",
        description: `ลบระดับทักษะ ${oldData.level_code} : ${oldData.level_name}`,
        reference_id: oldData.id,
        reference_code: oldData.level_code,
        old_data: oldData,
        new_data: null,
      });
    } catch (logError) {
      console.error(
        "WRITE_ACTIVITY_LOG_ERROR:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_SKILL_LEVEL_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Delete skill level failed",
      },
      {
        status: 500,
      }
    );
  }
}