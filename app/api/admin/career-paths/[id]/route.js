import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   GET BY ID
========================= */

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("career_paths")
      .select(`
        id,
        path_code,
        path_name,
        position_family_id,
        description,
        is_active,
        sort_order,
        created_at,
        updated_at,

        position_families (
          id,
          family_code,
          family_name
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET Career Path Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================
   PATCH
========================= */

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    const body = await req.json();

    const pathCode = body?.path_code?.trim().toUpperCase();
    const pathName = body?.path_name?.trim();

    if (!pathCode) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Career Path Code",
        },
        { status: 400 }
      );
    }

    if (!pathName) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Career Path Name",
        },
        { status: 400 }
      );
    }

    if (!body.position_family_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Position Family",
        },
        { status: 400 }
      );
    }

    /* =========================
       Old Data
    ========================= */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("career_paths")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    /* =========================
       Duplicate
    ========================= */

    const { data: duplicate } =
      await supabaseAdmin
        .from("career_paths")
        .select("id")
        .eq("path_code", pathCode)
        .neq("id", id)
        .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Career Path Code นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       Payload
    ========================= */

    const payload = {
      path_code: pathCode,
      path_name: pathName,
      position_family_id:
        body.position_family_id,
      description:
        body.description?.trim() || null,
      is_active:
        body.is_active === undefined
          ? true
          : body.is_active,
      sort_order:
        Number(body.sort_order) || 0,
      updated_at:
        new Date().toISOString(),
    };

    /* =========================
       Update
    ========================= */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("career_paths")
      .update(payload)
      .eq("id", id)
      .select(`
        *,
        position_families(
          id,
          family_code,
          family_name
        )
      `)
      .single();

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      module_name: "Career Paths",
      action_type: "UPDATE",
      reference_table: "career_paths",
      reference_id: id,
      description: `แก้ไข Career Path ${data.path_code} : ${data.path_name}`,
      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไข Career Path สำเร็จ",
      data,
    });
  } catch (error) {
    console.error(
      "PATCH Career Path Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
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

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    /* =========================
       Old Data
    ========================= */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("career_paths")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Career Path",
        },
        {
          status: 404,
        }
      );
    }

    /* =========================
       Check Career Path Steps
    ========================= */

    const {
      count: stepCount,
      error: stepError,
    } = await supabaseAdmin
      .from("career_path_steps")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("career_path_id", id);

    if (stepError) throw stepError;

    if ((stepCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบได้ เนื่องจาก Career Path นี้มี Step อยู่",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       Delete
    ========================= */

    const { error } = await supabaseAdmin
      .from("career_paths")
      .delete()
      .eq("id", id);

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      module_name: "Career Paths",
      action_type: "DELETE",
      reference_table: "career_paths",
      reference_id: id,
      description: `ลบ Career Path ${oldData.path_code} : ${oldData.path_name}`,
      old_data: oldData,
      new_data: null,
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Career Path สำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE Career Path Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}