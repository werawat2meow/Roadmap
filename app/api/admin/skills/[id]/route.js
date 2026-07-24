import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* ==========================================================
 * GET
 * Get Skill Detail
 * ========================================================== */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("skills")
      .select(
        `
          id,
          category_id,
          skill_code,
          skill_name,
          description,
          status,
          sort_order,
          created_at,
          updated_at,

          skill_categories(
            id,
            category_code,
            category_name
          )
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลทักษะ",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_SKILL_DETAIL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Load skill failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================================================
 * PATCH
 * Update Skill
 * ========================================================== */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    const body = await req.json();

    const skillCode = body?.skill_code?.trim()?.toUpperCase();
    const skillName = body?.skill_name?.trim();

    if (!skillCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    if (!skillName) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Load Current Skill
    // ==========================================
    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("skills")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลทักษะ",
        },
        {
          status: 404,
        }
      );
    }
        // ==========================================
    // Duplicate Skill Code
    // ==========================================
    const { data: duplicateCode } = await supabaseAdmin
      .from("skills")
      .select("id")
      .eq("skill_code", skillCode)
      .neq("id", id)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสทักษะนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Duplicate Skill Name
    // ==========================================
    const { data: duplicateName } = await supabaseAdmin
      .from("skills")
      .select("id")
      .ilike("skill_name", skillName)
      .neq("id", id)
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อทักษะนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const payload = {
      category_id: body?.category_id || null,

      skill_code: skillCode,

      skill_name: skillName,

      description: body?.description?.trim() || null,

      status: body?.status || "active",

      sort_order: Number(body?.sort_order || 0),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("skills")
      .update(payload)
      .eq("id", id)
      .select(
        `
          id,
          category_id,
          skill_code,
          skill_name,
          description,
          status,
          sort_order,
          created_at,
          updated_at,

          skill_categories(
            id,
            category_code,
            category_name
          )
        `
      )
      .single();

    if (error) {
      throw error;
    }

    // ==========================================
    // Activity Log
    // ==========================================
    try {
      await writeActivityLog({
        module: "skills",
        action: "UPDATE",
        description: `แก้ไขทักษะ ${data.skill_code} : ${data.skill_name}`,
        reference_id: data.id,
        reference_code: data.skill_code,
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
      message: "แก้ไขทักษะสำเร็จ",
      data,
    });

  } catch (error) {
    console.error("PATCH_SKILL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Update skill failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================================================
 * DELETE
 * Delete Skill
 * ========================================================== */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // โหลดข้อมูลเดิมก่อนลบ
    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("skills")
        .select("*")
        .eq("id", id)
        .single();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลทักษะ",
        },
        {
          status: 404,
        }
      );
    }
        // ==========================================
    // Check Assignment
    // ==========================================
    const { count: assignmentCount, error: assignmentError } =
      await supabaseAdmin
        .from("position_skill_assignments")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("skill_id", id);

    if (assignmentError) {
      throw assignmentError;
    }

    if ((assignmentCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบทักษะได้ เนื่องจากมีการกำหนดให้ตำแหน่งงานแล้ว",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Delete
    // ==========================================
    const { error } = await supabaseAdmin
      .from("skills")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    // ==========================================
    // Activity Log
    // ==========================================
    try {
      await writeActivityLog({
        module: "skills",
        action: "DELETE",
        description: `ลบทักษะ ${oldData.skill_code} : ${oldData.skill_name}`,
        reference_id: oldData.id,
        reference_code: oldData.skill_code,
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
      message: "ลบทักษะสำเร็จ",
    });

  } catch (error) {
    console.error("DELETE_SKILL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Delete skill failed",
      },
      {
        status: 500,
      }
    );
  }
}