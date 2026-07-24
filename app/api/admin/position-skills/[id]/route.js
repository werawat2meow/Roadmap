import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   PATCH: แก้ไขทักษะประจำตำแหน่ง
========================================================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบรหัสรายการทักษะประจำตำแหน่ง",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       โหลดข้อมูลเดิม
    ========================= */
    const { data: oldItem, error: oldItemError } =
      await supabaseAdmin
        .from("position_skills")
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
            updated_at,

            positions (
              id,
              position_code,
              position_name,
              position_level
            ),

            skills (
              id,
              skill_code,
              skill_name
            )
          `
        )
        .eq("id", id)
        .maybeSingle();

    if (oldItemError) {
      throw oldItemError;
    }

    if (!oldItem) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลทักษะประจำตำแหน่ง",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       เตรียมค่าที่จะแก้ไข
    ========================= */
    const positionId =
      body?.position_id !== undefined
        ? String(body.position_id || "").trim()
        : oldItem.position_id;

    const skillId =
      body?.skill_id !== undefined
        ? String(body.skill_id || "").trim()
        : oldItem.skill_id;

    const requiredLevel =
      body?.required_level !== undefined
        ? Number.parseInt(body.required_level, 10)
        : Number(oldItem.required_level || 1);

    const importanceLevel =
      body?.importance_level !== undefined
        ? String(body.importance_level || "")
            .trim()
            .toLowerCase()
        : oldItem.importance_level;

    const isMandatory =
      body?.is_mandatory !== undefined
        ? body.is_mandatory === true ||
          body.is_mandatory === "true"
        : Boolean(oldItem.is_mandatory);

    const description =
      body?.description !== undefined
        ? String(body.description || "").trim() || null
        : oldItem.description;

    const status =
      body?.status !== undefined
        ? String(body.status || "").trim().toLowerCase()
        : oldItem.status;

    const sortOrder =
      body?.sort_order !== undefined
        ? Number.parseInt(body.sort_order, 10)
        : Number(oldItem.sort_order || 0);

    /* =========================
       Validation
    ========================= */
    if (!positionId) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกตำแหน่ง",
        },
        {
          status: 400,
        }
      );
    }

    if (!skillId) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกทักษะ",
        },
        {
          status: 400,
        }
      );
    }

    if (
      Number.isNaN(requiredLevel) ||
      requiredLevel < 1 ||
      requiredLevel > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ระดับทักษะต้องอยู่ระหว่าง 1 ถึง 5",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !["low", "medium", "high", "critical"].includes(
        importanceLevel
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "ระดับความสำคัญไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "สถานะไม่ถูกต้อง",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       ตรวจสอบตำแหน่ง
    ========================= */
    const { data: position, error: positionError } =
      await supabaseAdmin
        .from("positions")
        .select(
          `
            id,
            position_code,
            position_name,
            position_level
          `
        )
        .eq("id", positionId)
        .maybeSingle();

    if (positionError) {
      throw positionError;
    }

    if (!position) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลตำแหน่ง",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       ตรวจสอบทักษะ
    ========================= */
    const { data: skill, error: skillError } =
      await supabaseAdmin
        .from("skills")
        .select(`
          id,
          skill_code,
          skill_name
        `)
        .eq("id", skillId)
        .maybeSingle();

    if (skillError) {
      throw skillError;
    }

    if (!skill) {
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

    /* =========================
       ตรวจสอบข้อมูลซ้ำ

       ตำแหน่งเดียวกันห้ามมี Skill ซ้ำ
       แต่ต้องยกเว้น Record ปัจจุบัน
    ========================= */
    const { data: duplicate, error: duplicateError } =
      await supabaseAdmin
        .from("position_skills")
        .select("id")
        .eq("position_id", positionId)
        .eq("skill_id", skillId)
        .neq("id", id)
        .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: `ตำแหน่ง ${position.position_name} มีทักษะ ${skill.skill_name} อยู่แล้ว`,
        },
        {
          status: 409,
        }
      );
    }

    const payload = {
      position_id: positionId,
      skill_id: skillId,
      required_level: requiredLevel,
      importance_level: importanceLevel,
      is_mandatory: isMandatory,
      description,
      status,
      sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
      updated_at: new Date().toISOString(),
    };

    /* =========================
       Update
    ========================= */
    const { data, error } = await supabaseAdmin
      .from("position_skills")
      .update(payload)
      .eq("id", id)
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
          updated_at,

          positions (
            id,
            position_code,
            position_name,
            position_level,
            position_family_id,

            position_families (
              id,
              family_code,
              family_name
            )
          ),

          skills (
            id,
            skill_code,
            skill_name,
            category_id,

            skill_categories (
              id,
              category_code,
              category_name
            )
          )
        `
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            success: false,
            error: "ตำแหน่งนี้มีทักษะดังกล่าวอยู่แล้ว",
          },
          {
            status: 409,
          }
        );
      }

      throw error;
    }

    /* =========================
       Activity Log
    ========================= */
    try {
      await writeActivityLog({
        module: "POSITION_SKILLS",
        action: "UPDATE",
        entityType: "position_skills",
        entityId: id,
        description: `แก้ไขทักษะ ${skill.skill_name} ของตำแหน่ง ${position.position_name}`,
        oldData: oldItem,
        newData: payload,
        req,
      });
    } catch (logError) {
      console.error(
        "writeActivityLog position-skills PATCH error:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขทักษะประจำตำแหน่งสำเร็จ",
      data: mapPositionSkill(data),
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/position-skills/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถแก้ไขทักษะประจำตำแหน่งได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   DELETE: ลบทักษะออกจากตำแหน่ง
========================================================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบรหัสรายการทักษะประจำตำแหน่ง",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       โหลดข้อมูลก่อนลบ
    ========================= */
    const { data: oldItem, error: oldItemError } =
      await supabaseAdmin
        .from("position_skills")
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
            updated_at,

            positions (
              id,
              position_code,
              position_name,
              position_level
            ),

           skills (
              id,
              skill_code,
              skill_name
            )
          `
        )
        .eq("id", id)
        .maybeSingle();

    if (oldItemError) {
      throw oldItemError;
    }

    if (!oldItem) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลทักษะประจำตำแหน่ง",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       Delete
    ========================= */
    const { error: deleteError } = await supabaseAdmin
      .from("position_skills")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    const positionName =
      oldItem.positions?.position_name || "ไม่ระบุตำแหน่ง";

    const skillName =
      oldItem.skills?.skill_name || "ไม่ระบุทักษะ";

    /* =========================
       Activity Log
    ========================= */
    try {
      await writeActivityLog({
        module: "POSITION_SKILLS",
        action: "DELETE",
        entityType: "position_skills",
        entityId: id,
        description: `ลบทักษะ ${skillName} ออกจากตำแหน่ง ${positionName}`,
        oldData: oldItem,
        newData: null,
        req,
      });
    } catch (logError) {
      console.error(
        "writeActivityLog position-skills DELETE error:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message: "ลบทักษะออกจากตำแหน่งสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/position-skills/[id] error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถลบทักษะออกจากตำแหน่งได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   Helper: จัดรูปแบบข้อมูล
========================================================= */
function mapPositionSkill(item) {
  return {
    id: item.id,

    position_id: item.position_id,
    position_code: item.positions?.position_code || "",
    position_name: item.positions?.position_name || "",
    position_level: item.positions?.position_level || "",

    position_family_id:
      item.positions?.position_family_id || null,
    position_family_code:
      item.positions?.position_families?.family_code || "",
    position_family_name:
      item.positions?.position_families?.family_name || "",

    skill_id: item.skill_id,
    skill_code: item.skills?.skill_code || "",
    skill_name: item.skills?.skill_name || "",

    skill_category_id: item.skills?.category_id || null,
    skill_category_code:
      item.skills?.skill_categories?.category_code || "",
    skill_category_name:
      item.skills?.skill_categories?.category_name || "",

    required_level: Number(item.required_level || 1),
    importance_level: item.importance_level || "medium",
    is_mandatory: Boolean(item.is_mandatory),
    description: item.description || "",
    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),

    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}