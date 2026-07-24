import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   helper
========================= */

function mapCompetency(item) {
  return {
    id: item.id,

    competency_code:
      item.competency_code,

    competency_name:
      item.competency_name,

    competency_type:
      item.competency_type || "",

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
   PATCH
========================= */

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } = params;

    const body = await req.json();

    const competency_code =
      body?.competency_code
        ?.trim()
        ?.toUpperCase();

    const competency_name =
      body?.competency_name?.trim();

    const competency_type =
      body?.competency_type?.trim() ||
      null;

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

    if (!competency_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุ Competency Code",
        },
        {
          status: 400,
        }
      );
    }

    if (!competency_name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาระบุ Competency Name",
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
      .from("competencies")
      .select("id")
      .or(
        `competency_code.eq.${competency_code},competency_name.eq.${competency_name}`
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Competency Code หรือ Competency Name นี้มีอยู่แล้ว",
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
      .from("competencies")
      .update({
        competency_code,
        competency_name,
        competency_type,
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
      module: "Competencies",
      action: "UPDATE",
      description: `แก้ไข Competency ${data.competency_code} - ${data.competency_name}`,
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลสำเร็จ",
      data: mapCompetency(data),
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
      .from("competencies")
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
        .from("competencies")
        .delete()
        .eq("id", id);

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,
      module: "Competencies",
      action: "DELETE",
      description: `ลบ Competency ${oldItem.competency_code} - ${oldItem.competency_name}`,
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