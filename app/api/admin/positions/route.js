import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   GET: list positions
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const all = searchParams.get("all") === "true";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabaseAdmin
      .from("positions")
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
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

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

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
            item.position_code?.toLowerCase().includes(search) ||
            item.position_name?.toLowerCase().includes(search) ||
            item.position_group?.toLowerCase().includes(search) ||
            item.position_level?.toLowerCase().includes(search)
          );
        })
      : mappedData;

    const total = filteredData.length;

    if (all) {
      return NextResponse.json({
        success: true,
        data: filteredData,
      });
    }

    const paginatedData = filteredData.slice(from, to + 1);

    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
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