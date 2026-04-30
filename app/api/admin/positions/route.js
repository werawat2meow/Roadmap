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
      .select(
        `
          id,
          position_code,
          position_name,
          position_group,
          position_level,
          status,
          sort_order,
          created_at
        `,
        { count: "exact" }
      )
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
      position_level: item.position_level,
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
    const position_level = body?.position_level?.trim() || null;
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
          position_level,
          status,
        },
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

    await writeActivityLog({
      module_name: "positions",
      action_type: "create",
      reference_table: "positions",
      reference_id: data.id,
      description: `เพิ่มตำแหน่ง ${data.position_code} - ${data.position_name}`,
      new_data: {
        position_code: data.position_code,
        position_name: data.position_name,
        position_group: data.position_group,
        position_level: data.position_level,
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