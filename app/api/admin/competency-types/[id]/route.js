import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";


export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    const body = await req.json();

    const payload = {
      type_code: body?.type_code?.trim()?.toUpperCase(),
      type_name: body?.type_name?.trim(),
      description: body?.description?.trim() || null,
      status: body?.status || "active",
      sort_order: Number(body?.sort_order || 0),
    };

    if (!payload.type_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Type Code",
        },
        { status: 400 }
      );
    }

    if (!payload.type_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Type Name",
        },
        { status: 400 }
      );
    }

    /* ==========================
     * Old Data
     * ========================== */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("competency_types")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Competency Type",
        },
        { status: 404 }
      );
    }

    /* ==========================
     * Duplicate Type Code
     * ========================== */

    const {
      data: duplicate,
    } = await supabaseAdmin
      .from("competency_types")
      .select("id")
      .eq("type_code", payload.type_code)
      .neq("id", id)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Type Code นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ==========================
     * Update
     * ========================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("competency_types")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    /* ==========================
     * Activity Log
     * ========================== */

    await writeActivityLog({
      action: "UPDATE",
      module: "Competency Types",
      description: `แก้ไข Competency Type : ${data.type_code} - ${data.type_name}`,
      table_name: "competency_types",
      record_id: data.id,
      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      data,
      message: "แก้ไข Competency Type สำเร็จ",
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "แก้ไข Competency Type ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    /* ==========================
     * Old Data
     * ========================== */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("competency_types")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบ Competency Type",
        },
        {
          status: 404,
        }
      );
    }

    /* ==========================
     * Delete
     * ========================== */

    const { error } = await supabaseAdmin
      .from("competency_types")
      .delete()
      .eq("id", id);

    if (error) throw error;

    /* ==========================
     * Activity Log
     * ========================== */

    await writeActivityLog({
      action: "DELETE",
      module: "Competency Types",
      description: `ลบ Competency Type : ${oldData.type_code} - ${oldData.type_name}`,
      table_name: "competency_types",
      record_id: oldData.id,
      old_data: oldData,
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Competency Type สำเร็จ",
    });

  } catch (err) {
    console.error(err);

    // Foreign Key Constraint
    if (
      err.code === "23503" ||
      err.message?.includes("foreign key")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบได้ เนื่องจากมี Competency ใช้งานประเภทนี้อยู่",
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "ลบ Competency Type ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}
