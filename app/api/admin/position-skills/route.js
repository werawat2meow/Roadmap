import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   GET: รายการทักษะประจำตำแหน่ง
========================================================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = String(searchParams.get("search") || "").trim();
    const positionId = String(
      searchParams.get("position_id") || ""
    ).trim();
    const skillId = String(searchParams.get("skill_id") || "").trim();
    const status = String(searchParams.get("status") || "").trim();

    const all = searchParams.get("all") === "true";

    const page = Math.max(
      Number.parseInt(searchParams.get("page") || "1", 10),
      1
    );

    const pageSize = Math.max(
      Number.parseInt(searchParams.get("pageSize") || "20", 10),
      1
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("vw_position_skills")
      .select("*", {
        count: "exact",
      })
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
    });

    if (positionId) {
      query = query.eq("position_id", positionId);
    }

    if (skillId) {
      query = query.eq("skill_id", skillId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        [
          `description.ilike.%${search}%`,
          `position_code.ilike.%${search}%`,
          `position_name.ilike.%${search}%`,
          `skill_code.ilike.%${search}%`,
          `skill_name.ilike.%${search}%`,
          `position_family_name.ilike.%${search}%`,
          `skill_category_name.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (!all) {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const items = (data || []).map((item) => ({
      id: item.id,

      position_id: item.position_id,
      position_code: item.position_code,
      position_name: item.position_name,
      position_level: item.position_level,

      position_family_id: item.position_family_id,
      position_family_code: item.position_family_code,
      position_family_name: item.position_family_name,

      skill_id: item.skill_id,
      skill_code: item.skill_code,
      skill_name: item.skill_name,

      skill_category_id: item.category_id,
      skill_category_code: item.skill_category_code,
      skill_category_name: item.skill_category_name,

      required_level: Number(item.required_level || 1),
      importance_level: item.importance_level || "medium",
      is_mandatory: Boolean(item.is_mandatory),
      description: item.description || "",
      status: item.status || "active",
      sort_order: Number(item.sort_order || 0),

      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page: all ? 1 : page,
        pageSize: all ? items.length : pageSize,
        total: Number(count || 0),
        totalPages: all
          ? 1
          : Math.max(Math.ceil(Number(count || 0) / pageSize), 1),
      },
    });
  } catch (error) {
    console.error("GET /api/admin/position-skills error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถโหลดข้อมูลทักษะประจำตำแหน่งได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST: เพิ่มทักษะให้ตำแหน่ง
========================================================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const positionId = String(body?.position_id || "").trim();
    const skillId = String(body?.skill_id || "").trim();

    const requiredLevel = Math.max(
      Number.parseInt(body?.required_level || "1", 10),
      1
    );

    const importanceLevel = String(
      body?.importance_level || "medium"
    )
      .trim()
      .toLowerCase();

    const isMandatory =
      body?.is_mandatory === true ||
      body?.is_mandatory === "true";

    const description =
      String(body?.description || "").trim() || null;

    const status = String(body?.status || "active")
      .trim()
      .toLowerCase();

    const sortOrder = Number.parseInt(
      body?.sort_order || "0",
      10
    );

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

    const { data: position, error: positionError } =
      await supabaseAdmin
        .from("positions")
        .select("id, position_code, position_name")
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

    const { data: skill, error: skillError } =
      await supabaseAdmin
        .from("skills")
        .select("id, skill_code, skill_name")
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

    /*
      ป้องกันไม่ให้ตำแหน่งเดียวกันมี Skill เดิมซ้ำ
    */
    const { data: duplicate, error: duplicateError } =
      await supabaseAdmin
        .from("position_skills")
        .select("id")
        .eq("position_id", positionId)
        .eq("skill_id", skillId)
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

    const { data, error } = await supabaseAdmin
      .from("position_skills")
      .insert(payload)
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
          position_level_mappings (
            is_default,
            sort_order,

            position_level:position_levels (
              id,
              level_code,
              level_name
            )
          ),

          skills (
            id,
            skill_code,
            skill_name
          )
        `
      )
      .single();

    if (error) {
      /*
        รองรับกรณีมี Unique Constraint ในฐานข้อมูล
      */
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

    try {
      await writeActivityLog({
        module: "POSITION_SKILLS",
        action: "CREATE",
        entityType: "position_skills",
        entityId: data.id,
        description: `เพิ่มทักษะ ${skill.skill_name} ให้ตำแหน่ง ${position.position_name}`,
        newData: payload,
        req,
      });
    } catch (logError) {
      console.error(
        "writeActivityLog position-skills error:",
        logError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มทักษะประจำตำแหน่งสำเร็จ",
        data: {
          id: data.id,

          position_id: data.position_id,
          position_code: data.positions?.position_code || "",
          position_name: data.positions?.position_name || "",
          position_level: data.positions?.position_level || "",

          skill_id: data.skill_id,
          skill_code: data.skills?.skill_code || "",
          skill_name: data.skills?.skill_name || "",

          required_level: Number(data.required_level || 1),
          importance_level: data.importance_level || "medium",
          is_mandatory: Boolean(data.is_mandatory),
          description: data.description || "",
          status: data.status || "active",
          sort_order: Number(data.sort_order || 0),

          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/admin/position-skills error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "ไม่สามารถเพิ่มทักษะประจำตำแหน่งได้",
      },
      {
        status: 500,
      }
    );
  }
}