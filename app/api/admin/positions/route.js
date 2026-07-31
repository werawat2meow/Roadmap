import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const all = searchParams.get("all") === "true";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("positions")
      .select(
        `
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
        updated_at,

        jobs (
          id,
          job_code,
          job_name
        ),

        position_families (
          id,
          family_code,
          family_name
        ),

        position_level_mappings (
          id,
          is_default,
          sort_order,

          position_level:position_levels (
            id,
            level_code,
            level_name,
            sort_order
          )
        )
      `,
        { count: "exact" }
      )
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
      });

    /* =========================================================
     * Search
     * ========================================================= */

    if (search) {
      const keyword = `%${search}%`;

      query = query.or(
        [
          `position_code.ilike.${keyword}`,
          `position_name.ilike.${keyword}`,
          `short_name.ilike.${keyword}`,
          `description.ilike.${keyword}`,
          `position_group.ilike.${keyword}`,
        ].join(",")
      );
    }

    /* =========================================================
     * Pagination
     * ========================================================= */

    if (!all) {
      query = query.range(from, to);
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) {
      throw error;
    }
        /* =========================================================
     * Response Mapping
     * ========================================================= */

    const mappedData = (data || []).map((item) => {
      const levels =
        item.position_level_mappings
          ?.map((mapping) => ({
            id: mapping.position_level?.id,
            level_code: mapping.position_level?.level_code,
            level_name: mapping.position_level?.level_name,
            sort_order: mapping.position_level?.sort_order ?? 9999,
            is_default: mapping.is_default,
          }))
          .filter((level) => level.id)
          .sort((a, b) => a.sort_order - b.sort_order) || [];

      const defaultLevel =
        levels.find((level) => level.is_default) || levels[0] || null;

      return {
        id: item.id,

        position_code: item.position_code,

        position_name: item.position_name,

        short_name: item.short_name,

        description: item.description,

        position_group: item.position_group,

        job_id: item.job_id,

        job: item.jobs
          ? {
              id: item.jobs.id,
              code: item.jobs.job_code,
              name: item.jobs.job_name,
            }
          : null,

        position_family_id: item.position_family_id,

        family: item.position_families
          ? {
              id: item.position_families.id,
              code: item.position_families.family_code,
              name: item.position_families.family_name,
            }
          : null,

        // Default Level (Enterprise)
        default_level: defaultLevel,

        // ทุกระดับที่ตำแหน่งนี้รองรับ
        levels,

        is_manager: item.is_manager,

        is_executive: item.is_executive,

        allow_multiple_assignment:
          item.allow_multiple_assignment,

        status: item.status,

        sort_order: item.sort_order,

        created_at: item.created_at,

        updated_at: item.updated_at,
      };
    });

    /* =========================================================
     * Response
     * ========================================================= */

    return NextResponse.json({
      success: true,
      data: mappedData,

      pagination: all
        ? undefined
        : {
            page,
            pageSize,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize),
          },
    });
  } catch (error) {
    console.error("GET_POSITIONS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถดึงข้อมูลตำแหน่งได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const position_code = body?.position_code?.trim();
    const position_name = body?.position_name?.trim();
    const short_name = body?.short_name?.trim() || null;
    const description = body?.description?.trim() || null;
    const position_group = body?.position_group?.trim() || null;
    const position_family_id = body?.position_family_id || null;
    const job_id = body?.job_id || null;
    const position_levels = Array.isArray(body?.position_levels)? body.position_levels.filter(Boolean): [];
    const is_manager = body?.is_manager ?? false;
    const is_executive = body?.is_executive ?? false;
    const allow_multiple_assignment = body?.allow_multiple_assignment ?? false;
    const status = body?.status || "active";

    /* =========================================================
     * Basic Field Validation
     * ========================================================= */

    if (!position_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสตำแหน่ง",
        },
        { status: 400 }
      );
    }

    if (!position_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อตำแหน่ง",
        },
        { status: 400 }
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

    /* =========================================================
     * Validate Position Levels in Family
     * ========================================================= */

    const { data: familyLevels, error: familyLevelError } = await supabaseAdmin
      .from("position_family_levels")
      .select("position_level_id")
      .eq("position_family_id", position_family_id);

    if (familyLevelError) {
      throw familyLevelError;
    }

    if (familyLevels.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "กลุ่มสายงานนี้ยังไม่ได้กำหนดระดับตำแหน่ง",
        },
        { status: 400 }
      );
    }

    const allowedLevelIds = new Set(
      (familyLevels || []).map((item) => item.position_level_id)
    );

    const invalidLevels = position_levels.filter(
      (levelId) => !allowedLevelIds.has(levelId)
    );

    if (invalidLevels.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ระดับตำแหน่งที่เลือก ไม่ได้อยู่ในกลุ่มสายงานที่เลือก",
        },
        { status: 400 }
      );
    }

    /* =========================================================
     * Duplicate Position Code
     * ========================================================= */

    const { data: duplicate } = await supabaseAdmin
      .from("positions")
      .select("id")
      .eq("position_code", position_code)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสตำแหน่งนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* =========================================================
     * Insert Position
     * ========================================================= */

    const { data, error } = await supabaseAdmin
      .from("positions")
      .insert([
        {
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
        },
      ])
      .select(
        `
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
          created_at
        `
      )
      .single();

    if (error) {
      throw error;
    }

    /* =========================================================
     * Insert Position Level Mappings
     * ========================================================= */

    if (position_levels.length > 0) {
      const mappingRows = position_levels.map((levelId, index) => ({
        position_id: data.id,
        position_level_id: levelId,
        is_default: index === 0,
        sort_order: index,
      }));

      const { error: mappingError } = await supabaseAdmin
        .from("position_level_mappings")
        .insert(mappingRows);

      if (mappingError) {
        // Rollback Position
        await supabaseAdmin.from("positions").delete().eq("id", data.id);

        throw mappingError;
      }
    }

    /* =========================================================
     * Activity Log
     * ========================================================= */

    await writeActivityLog({
      module_name: "positions",
      action_type: "create",
      reference_table: "positions",
      reference_id: data.id,

      description: `เพิ่มตำแหน่ง ${data.position_code} - ${data.position_name}`,

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
        allow_multiple_assignment: data.allow_multiple_assignment,
        status: data.status,
        sort_order: data.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลตำแหน่งสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("CREATE_POSITION_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถบันทึกข้อมูลตำแหน่งได้",
      },
      { status: 500 }
    );
  }
}