import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   GET: list positions
========================= */
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
      .select(`
        id,
        position_code,
        position_name,
        position_group,
        position_level,
        position_family_id,
        status,
        sort_order,
        created_at,

        position_families (
            id,
            family_code,
            family_name
        ),

        position_level_mappings (
            position_level:position_levels (
                id,
                level_code,
                level_name,
                sort_order
            )
        )
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (search) {
      const keyword = `%${search}%`;

      query = query.or(
        [
          `position_code.ilike.${keyword}`,
          `position_name.ilike.${keyword}`,
          `position_group.ilike.${keyword}`,
          `position_level.ilike.${keyword}`,
        ].join(",")
      );
    }

    if (!all) {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const mappedData = (data || []).map((item) => ({
      id: item.id,

      position_code: item.position_code,

      position_name: item.position_name,

      position_group: item.position_group,

      // ใช้ของเดิมก่อน
      position_level: item.position_level,

      position_family_id: item.position_family_id,

      family: item.position_families
        ? {
            id: item.position_families.id,
            code: item.position_families.family_code,
            name: item.position_families.family_name,
          }
        : null,

      levels:
        item.position_level_mappings
          ?.map((x) => x.position_level)
          .filter(Boolean)
          .sort((a, b) => a.sort_order - b.sort_order) || [],

      status: item.status,

      sort_order: item.sort_order,

      created_at: item.created_at,
    }));

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
        error: error.message || "ไม่สามารถดึงข้อมูลตำแหน่งได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create position
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const position_code = body?.position_code?.trim();
    const position_name = body?.position_name?.trim();
    const position_group = body?.position_group?.trim() || null;
    const position_family_id = body?.position_family_id || null;
    const position_levels = Array.isArray(body?.position_levels)? body.position_levels : [];
    const status = body?.status || "active";

    if (!position_code || !position_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสตำแหน่งและชื่อตำแหน่ง",
        },
        { status: 400 }
      );
    }

    const { data: existingPosition } = await supabaseAdmin
      .from("positions")
      .select("id")
      .eq("position_code", position_code)
      .maybeSingle();

    if (existingPosition) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสตำแหน่งนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("positions")
      .insert([
        {
          position_code,
          position_name,
          position_group,
          position_family_id,
          position_level,
          status,
        }
      ])
      .select(`
        id,
        position_code,
        position_name,
        position_group,
        position_level,
        status,
        sort_order,
        created_at
      `)
      .single();

    if (error) throw error;


    if (position_levels.length > 0) {

    await supabaseAdmin
      .from("position_level_mappings")
      .insert(
        position_levels.map((levelId) => ({
          position_id: data.id,
          position_level_id: levelId,
        }))
      );
    }

    await writeActivityLog({
      module_name: "positions",
      action_type: "create",
      reference_table: "positions",
      reference_id: data.id,
      description: `เพิ่มตำแหน่ง ${data.position_code} - ${data.position_name}`,
      new_data: {
        new_data: {
          position_code: data.position_code,
          position_name: data.position_name,
          position_group: data.position_group,

          position_family_id,

          // ของเดิม
          position_level: data.position_level,

          // ของใหม่
          position_levels,

          status: data.status,
          sort_order: data.sort_order,
        }
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