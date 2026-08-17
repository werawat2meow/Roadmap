import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   helper
========================= */

function mapCompetencyLevel(item) {
  return {
    id: item.id,

    level_code: item.level_code,

    level_name: item.level_name,

    level_number:
      item.level_number,

    description:
      item.description || "",

    status:
      item.status,

    sort_order:
      item.sort_order,

    created_at:
      item.created_at,

    updated_at:
      item.updated_at,
  };
}

/* =========================
   GET
========================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const page = Number(
      searchParams.get("page") || 1
    );

    const pageSize = Number(
      searchParams.get("pageSize") || 20
    );

    const search =
      searchParams.get("search") || "";

    const status =
      searchParams.get("status") || "";

    const all =
      searchParams.get("all") === "true";

    let query = supabaseAdmin
      .from("competency_levels")
      .select("*", {
        count: "exact",
      });

    if (search) {
      query = query.or(
        `level_code.ilike.%${search}%,level_name.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    query = query.order(
      "sort_order",
      {
        ascending: true,
      }
    );

    if (!all) {
      const from =
        (page - 1) * pageSize;

      const to =
        from + pageSize - 1;

      query = query.range(
        from,
        to
      );
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,

      data:
        (data || []).map(
          mapCompetencyLevel
        ),

      pagination: all
        ? undefined
        : {
            page,
            pageSize,
            total:
              count || 0,
            totalPages: Math.ceil(
              (count || 0) /
                pageSize
            ),
          },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Load Failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================
   POST
========================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const level_code =
      body?.level_code
        ?.trim()
        ?.toUpperCase();

    const level_name =
      body?.level_name?.trim();

    const level_number = Number(
      body?.level_number || 0
    );

    const description =
      body?.description?.trim() ||
      null;

    const status =
      body?.status || "active";

    const sort_order = Number(
      body?.sort_order || 0
    );

    /* =========================
       Validate
    ========================= */

    if (!level_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุ Level Code",
        },
        {
          status: 400,
        }
      );
    }

    if (!level_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุ Level Name",
        },
        {
          status: 400,
        }
      );
    }

    if (level_number <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุ Level Number",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       Duplicate
    ========================= */

    const {
      data: duplicate,
    } = await supabaseAdmin
      .from("competency_levels")
      .select("id")
      .or(
        `level_code.eq.${level_code},level_name.eq.${level_name},level_number.eq.${level_number}`
      )
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Level Code, Level Name หรือ Level Number นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       Insert
    ========================= */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("competency_levels")
      .insert({
        level_code,
        level_name,
        level_number,
        description,
        status,
        sort_order,
      })
      .select("*")
      .single();

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,
      module: "Competency Levels",
      action: "CREATE",
      description: `เพิ่ม Competency Level ${data.level_code} - ${data.level_name}`,
    });

    /* =========================
       Response
    ========================= */

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลสำเร็จ",
      data: mapCompetencyLevel(data),
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Create Failed",
      },
      {
        status: 500,
      }
    );
  }
}