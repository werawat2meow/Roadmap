import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const group_code = body?.group_code?.trim()?.toUpperCase();
    const group_name = body?.group_name?.trim();
    const group_color = body?.group_color?.trim() || "#E2E8F0";
    const sort_order = Number(body?.sort_order || 0);
    const status = body?.status || "active";

    if (!group_code || !group_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสกลุ่มและชื่อกลุ่มสังกัด" },
        { status: 400 }
      );
    }

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("branch_groups")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const { data, error } = await supabaseAdmin
      .from("branch_groups")
      .update({
        group_code,
        group_name,
        group_color,
        sort_order,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "รหัสกลุ่มสังกัดนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }

      throw error;
    }

    await writeActivityLog({
      module_name: "branch_groups",
      action_type: "update",
      reference_table: "branch_groups",
      reference_id: id,
      description: `แก้ไขกลุ่มสังกัด ${data.group_code} - ${data.group_name}`,
      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("UPDATE_BRANCH_GROUP_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถแก้ไขข้อมูลกลุ่มสังกัดได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // ตรวจสอบว่ามี Branch ใช้งานอยู่หรือไม่
    const { count, error: countError } = await supabaseAdmin
      .from("branches")
      .select("*", {
        head: true,
        count: "exact",
      })
      .eq("group_id", id);

    if (countError) throw countError;

    if (count > 0) {
      return NextResponse.json(
        {
          error: `ไม่สามารถลบได้ เนื่องจากมี ${count} สังกัด ใช้งานกลุ่มนี้อยู่`,
        },
        { status: 400 }
      );
    }

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("branch_groups")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const { error } = await supabaseAdmin
      .from("branch_groups")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "branch_groups",
      action_type: "delete",
      reference_table: "branch_groups",
      reference_id: id,
      description: `ลบกลุ่มสังกัด ${oldData.group_code} - ${oldData.group_name}`,
      old_data: oldData,
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_BRANCH_GROUP_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถลบข้อมูลกลุ่มสังกัดได้" },
      { status: 500 }
    );
  }
}