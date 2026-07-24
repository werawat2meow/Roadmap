import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* ==========================================================
 * GET
 * Skill Category Detail
 * ========================================================== */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("skill_categories")
      .select(`
        id,
        category_code,
        category_name,
        description,
        status,
        sort_order,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบหมวดหมู่ทักษะ",
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
    console.error(
      "GET_SKILL_CATEGORY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Load skill category failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================================================
 * PATCH
 * Update Skill Category
 * ========================================================== */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const categoryCode =
      body?.category_code?.trim()?.toUpperCase();

    const categoryName =
      body?.category_name?.trim();

    if (!categoryCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสหมวดหมู่ทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    if (!categoryName) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อหมวดหมู่ทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Load Old Data
    // ==========================================
    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("skill_categories")
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
          error: "ไม่พบหมวดหมู่ทักษะ",
        },
        {
          status: 404,
        }
      );
    }
        // ==========================================
    // Duplicate Category Code
    // ==========================================
    const { data: duplicateCode } = await supabaseAdmin
      .from("skill_categories")
      .select("id")
      .eq("category_code", categoryCode)
      .neq("id", id)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสหมวดหมู่ทักษะนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    // ==========================================
    // Duplicate Category Name
    // ==========================================
    const { data: duplicateName } = await supabaseAdmin
      .from("skill_categories")
      .select("id")
      .ilike("category_name", categoryName)
      .neq("id", id)
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อหมวดหมู่ทักษะนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const payload = {
      category_code: categoryCode,
      category_name: categoryName,
      description: body?.description?.trim() || null,
      status: body?.status || "active",
      sort_order: Number(body?.sort_order || 0),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("skill_categories")
      .update(payload)
      .eq("id", id)
      .select(`
        id,
        category_code,
        category_name,
        description,
        status,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      throw error;
    }

    // ==========================================
    // Activity Log
    // ==========================================
    try {
      await writeActivityLog({
        module: "skill_categories",
        action: "UPDATE",
        description: `แก้ไขหมวดหมู่ทักษะ ${data.category_code} : ${data.category_name}`,
        reference_id: data.id,
        reference_code: data.category_code,
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
      message: "แก้ไขหมวดหมู่ทักษะสำเร็จ",
      data,
    });

  } catch (error) {
    console.error(
      "PATCH_SKILL_CATEGORY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Update skill category failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================================================
 * DELETE
 * Delete Skill Category
 * ========================================================== */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // โหลดข้อมูลเดิมก่อนลบ
    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("skill_categories")
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
          error: "ไม่พบหมวดหมู่ทักษะ",
        },
        {
          status: 404,
        }
      );
    }
        // ==========================================
    // Check Skill Usage
    // ==========================================
    const { count: skillCount, error: skillError } =
      await supabaseAdmin
        .from("skills")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("category_id", id);

    if (skillError) {
      throw skillError;
    }

    if ((skillCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบหมวดหมู่ทักษะได้ เนื่องจากยังมีทักษะที่ใช้งานอยู่",
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
      .from("skill_categories")
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
        module: "skill_categories",
        action: "DELETE",
        description: `ลบหมวดหมู่ทักษะ ${oldData.category_code} : ${oldData.category_name}`,
        reference_id: oldData.id,
        reference_code: oldData.category_code,
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
      message: "ลบหมวดหมู่ทักษะสำเร็จ",
    });

  } catch (error) {
    console.error(
      "DELETE_SKILL_CATEGORY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Delete skill category failed",
      },
      {
        status: 500,
      }
    );
  }
}