import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload = {
      level_code: body.level_code?.trim()?.toUpperCase(),
      level_name: body.level_name?.trim(),
      description: body.description?.trim() || null,
      sort_order: Number(body.sort_order) || 0,
      status: body.status || "active",
      updated_at: new Date().toISOString(),
    };

    if (!payload.level_code) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Level Code" },
        { status: 400 }
      );
    }

    if (!payload.level_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Level Name" },
        { status: 400 }
      );
    }

    // ดึงข้อมูลเดิมไว้เทียบ (old_data) ก่อน update
    const { data: oldData, error: oldDataError } = await supabaseAdmin
      .from("position_levels")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (oldDataError) throw oldDataError;

    if (!oldData) {
      return NextResponse.json(
        { success: false, error: "ไม่พบข้อมูล Position Level" },
        { status: 404 }
      );
    }

    // ตรวจสอบ Level Code ซ้ำ
    const {
      data: duplicate,
      error: duplicateError,
    } = await supabaseAdmin
      .from("position_levels")
      .select("id")
      .eq("level_code", payload.level_code)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        { success: false, error: "Level Code นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("position_levels")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "position-levels",
      action_type: "update",
      reference_table: "position_levels",
      reference_id: data.id,
      description: `แก้ไขระดับตำแหน่ง ${data.level_code} - ${data.level_name}`,
      old_data: {
        level_code: oldData.level_code,
        level_name: oldData.level_name,
        description: oldData.description,
        sort_order: oldData.sort_order,
        status: oldData.status,
      },
      new_data: {
        level_code: data.level_code,
        level_name: data.level_name,
        description: data.description,
        sort_order: data.sort_order,
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดต Position Level สำเร็จ",
      data,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldData, error: oldDataError } = await supabaseAdmin
      .from("position_levels")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (oldDataError) throw oldDataError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูล Position Level",
        },
        { status: 404 }
      );
    }


    const { count: familyLevelCount, error: familyLevelError } =
      await supabaseAdmin
        .from("position_family_levels")
        .select("*", { count: "exact", head: true })
        .eq("position_level_id", id);

    if (familyLevelError) throw familyLevelError;

    if ((familyLevelCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบได้ เนื่องจากยังมี Position Family ใช้งาน Position Level นี้อยู่",
        },
        { status: 400 }
      );
    }

    const { count: bandCount, error: bandError } = await supabaseAdmin
      .from("position_level_bands")
      .select("*", { count: "exact", head: true })
      .eq("position_level_id", id);

    if (bandError) throw bandError;

    if ((bandCount || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบได้ เนื่องจากยังมี Position Level Bands อยู่",
        },
        { status: 400 }
      );
    }


    const { error: deleteError } = await supabaseAdmin
      .from("position_levels")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    await writeActivityLog({
      module_name: "position-levels",
      action_type: "delete",
      reference_table: "position_levels",
      reference_id: id,
      description: `ลบระดับตำแหน่ง ${oldData.level_code} - ${oldData.level_name}`,
      old_data: {
        level_code: oldData.level_code,
        level_name: oldData.level_name,
        description: oldData.description,
        sort_order: oldData.sort_order,
        status: oldData.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Position Level สำเร็จ",
    });
  } catch (err) {
    console.error("DELETE Position Level Error:", JSON.stringify(err, null, 2));
    console.error("===== DELETE ERROR =====");
    console.error(err);
    console.error("message:", err?.message);
    console.error("code:", err?.code);
    console.error("details:", err?.details);
    console.error("hint:", err?.hint);
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}