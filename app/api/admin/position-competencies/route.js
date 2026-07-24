import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   helper
========================= */

function mapPositionCompetency(item) {
  return {
    id: item.id,

    position_id: item.position_id,
    position_code:
      item.positions?.position_code || "",
    position_name:
      item.positions?.position_name || "",

    competency_id:
      item.competency_id,
    competency_code:
      item.competencies?.competency_code || "",
    competency_name:
      item.competencies?.competency_name || "",
    competency_type:
      item.competencies?.competency_type || "",

    required_level_id:
      item.required_level_id,

    required_level_code:
      item.competency_levels?.level_code || "",

    required_level_name:
      item.competency_levels?.level_name || "",

    importance_level:
      item.importance_level,

    status: item.status,

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
    const { searchParams } = new URL(req.url);

    const page =
      Number(
        searchParams.get("page") || 1
      );

    const pageSize =
      Number(
        searchParams.get("pageSize") || 20
      );

    const search =
      searchParams.get("search") || "";

    const positionId =
      searchParams.get("position_id") ||
      "";

    const competencyId =
      searchParams.get("competency_id") ||
      "";

    const requiredLevelId =
      searchParams.get(
        "required_level_id"
      ) || "";

    const importanceLevel =
      searchParams.get(
        "importance_level"
      ) || "";

    const status =
      searchParams.get("status") || "";

    const all =
      searchParams.get("all") ===
      "true";

    let query =
      supabaseAdmin
        .from(
          "position_competencies"
        )
        .select(
          `
id,
position_id,
competency_id,
required_level_id,
importance_level,
status,
sort_order,
created_at,
updated_at,

positions(
id,
position_code,
position_name
),

competencies(
id,
competency_code,
competency_name,
competency_type
),

competency_levels(
id,
level_code,
level_name
)
`,
          {
            count: "exact",
          }
        );

    if (search) {
      query = query.or(
        [
          `positions.position_code.ilike.%${search}%`,
          `positions.position_name.ilike.%${search}%`,
          `competencies.competency_code.ilike.%${search}%`,
          `competencies.competency_name.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (positionId) {
      query = query.eq(
        "position_id",
        positionId
      );
    }

    if (competencyId) {
      query = query.eq(
        "competency_id",
        competencyId
      );
    }

    if (requiredLevelId) {
      query = query.eq(
        "required_level_id",
        requiredLevelId
      );
    }

    if (importanceLevel) {
      query = query.eq(
        "importance_level",
        importanceLevel
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
          mapPositionCompetency
        ),

      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: all
          ? 1
          : Math.ceil(
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

    const position_id =
      body?.position_id || null;

    const competency_id =
      body?.competency_id || null;

    const required_level_id =
      body?.required_level_id || null;

    const importance_level =
      body?.importance_level || "medium";

    const status =
      body?.status || "active";

    const sort_order =
      Number(body?.sort_order || 0);

    /* =========================
       Validate
    ========================= */

    if (!position_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกตำแหน่ง",
        },
        { status: 400 }
      );
    }

    if (!competency_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Competency",
        },
        { status: 400 }
      );
    }

    if (!required_level_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกระดับ Competency",
        },
        { status: 400 }
      );
    }

    /* =========================
       Duplicate
    ========================= */

    const {
      data: duplicate,
    } = await supabaseAdmin
      .from(
        "position_competencies"
      )
      .select("id")
      .eq(
        "position_id",
        position_id
      )
      .eq(
        "competency_id",
        competency_id
      )
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Position Competency นี้มีอยู่แล้ว",
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
      .from(
        "position_competencies"
      )
      .insert({
        position_id,
        competency_id,
        required_level_id,
        importance_level,
        status,
        sort_order,
      })
      .select(
        `
id,
position_id,
competency_id,
required_level_id,
importance_level,
status,
sort_order,
created_at,
updated_at,

positions(
id,
position_code,
position_name
),

competencies(
id,
competency_code,
competency_name,
competency_type
),

competency_levels(
id,
level_code,
level_name
)
`
      )
      .single();

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,

      module:
        "Position Competencies",

      action: "CREATE",

      description:
        `เพิ่ม Position Competency ${data.positions?.position_name} - ${data.competencies?.competency_name}`,
    });

    /* =========================
       Response
    ========================= */

    return NextResponse.json({
      success: true,

      message:
        "เพิ่มข้อมูลสำเร็จ",

      data:
        mapPositionCompetency(
          data
        ),
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
