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

    level_number: item.level_number,

    description:
      item.description || "",

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
   PATCH
========================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } = await params;

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
          error:
            "กรุณาระบุ Level Code",
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
          error:
            "กรุณาระบุ Level Name",
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
          error:
            "กรุณาระบุ Level Number",
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
      .from(
        "competency_levels"
      )
      .select("id")
      .or(
        `level_code.eq.${level_code},level_name.eq.${level_name},level_number.eq.${level_number}`
      )
      .neq("id", id)
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
       Update
    ========================= */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "competency_levels"
      )
      .update({
        level_code,
        level_name,
        level_number,
        description,
        status,
        sort_order,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,
      module:
        "Competency Levels",
      action: "UPDATE",
      description: `แก้ไข Competency Level ${data.level_code} - ${data.level_name}`,
    });

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขข้อมูลสำเร็จ",
      data:
        mapCompetencyLevel(data),
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
    const { id } = await params;

    /* =========================
       Load Old Data
    ========================= */

    const {
      data: oldItem,
      error: oldError,
    } = await supabaseAdmin
      .from("competency_levels")
      .select("*")
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
        .from("competency_levels")
        .delete()
        .eq("id", id);

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,
      module: "Competency Levels",
      action: "DELETE",
      description: `ลบ Competency Level ${oldItem.level_code} - ${oldItem.level_name}`,
    });

    /* =========================
       Response
    ========================= */

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลสำเร็จ",
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