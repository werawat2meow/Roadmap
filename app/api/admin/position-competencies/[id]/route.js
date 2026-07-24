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
   PATCH
========================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } = params;

    const body =
      await req.json();

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
      Number(
        body?.sort_order || 0
      );

    /* =========================
       Validate
    ========================= */

    if (!position_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกตำแหน่ง",
        },
        {
          status: 400,
        }
      );
    }

    if (!competency_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือก Competency",
        },
        {
          status: 400,
        }
      );
    }

    if (!required_level_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกระดับ Competency",
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
    } =
      await supabaseAdmin
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
        .neq("id", id)
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
       Update
    ========================= */

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "position_competencies"
        )
        .update({
          position_id,
          competency_id,
          required_level_id,
          importance_level,
          status,
          sort_order,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id)
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

    if (error)
      throw error;

    /* =========================
       Activity
    ========================= */

    await writeActivityLog({
      req,

      module:
        "Position Competencies",

      action:
        "UPDATE",

      description:
        `แก้ไข Position Competency ${data.positions?.position_name} - ${data.competencies?.competency_name}`,
    });

    return NextResponse.json({
      success: true,

      message:
        "แก้ไขข้อมูลสำเร็จ",

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
          "Update Failed",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================
   DELETE
========================= */

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } = params;

    /* =========================
       Load Old Data
    ========================= */

    const {
      data: oldItem,
      error: oldError,
    } = await supabaseAdmin
      .from("position_competencies")
      .select(`
id,
position_id,
competency_id,
required_level_id,
importance_level,
status,
sort_order,

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
`)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldItem) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูล",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       Delete
    ========================= */

    const { error } =
      await supabaseAdmin
        .from(
          "position_competencies"
        )
        .delete()
        .eq("id", id);

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,

      module:
        "Position Competencies",

      action:
        "DELETE",

      description:
        `ลบ Position Competency ${oldItem.positions?.position_name} - ${oldItem.competencies?.competency_name}`,
    });

    /* =========================
       Response
    ========================= */

    return NextResponse.json({
      success: true,
      message:
        "ลบข้อมูลสำเร็จ",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Delete Failed",
      },
      {
        status: 500,
      }
    );
  }
}
