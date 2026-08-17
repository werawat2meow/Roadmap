import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* ==========================================================
 * GET
 * ========================================================== */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const all = searchParams.get("all") === "true";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(
      Number(searchParams.get("pageSize") || 20),
      1
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("skill_levels")
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
        `,
        {
          count: "exact",
        }
      )
      .order("sort_order", { ascending: true })
      .order("level_code", { ascending: true });

    if (search) {
      query = query.or(
        [
          `level_code.ilike.%${search}%`,
          `level_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (!all) {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      pagination: {
        page,
        pageSize: all ? data?.length || 0 : pageSize,
        total: count || 0,
        totalPages: all
          ? 1
          : Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("GET_SKILL_LEVELS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Load skill levels failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* ==========================================================
 * POST
 * ========================================================== */
export async function POST(req) {
  try {
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

    const { data: duplicateCode } = await supabaseAdmin
      .from("skill_levels")
      .select("id")
      .eq("level_code", levelCode)
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

    const { data: duplicateName } = await supabaseAdmin
      .from("skill_levels")
      .select("id")
      .ilike("level_name", levelName)
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

    const payload = {
      level_code: levelCode,
      level_name: levelName,
      score: Number(body?.score || 0),
      description: body?.description?.trim() || null,
      sort_order: Number(body?.sort_order || 0),
      status: body?.status || "active",
    };

    const { data, error } = await supabaseAdmin
      .from("skill_levels")
      .insert(payload)
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

    try {
      await writeActivityLog({
        module: "skill_levels",
        action: "CREATE",
        description: `สร้างระดับทักษะ ${data.level_code} : ${data.level_name}`,
        reference_id: data.id,
        reference_code: data.level_code,
        old_data: null,
        new_data: data,
      });
    } catch (logError) {
      console.error("WRITE_ACTIVITY_LOG_ERROR:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "เพิ่มระดับทักษะสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("POST_SKILL_LEVEL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Create skill level failed",
      },
      {
        status: 500,
      }
    );
  }
}