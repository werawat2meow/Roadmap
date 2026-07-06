import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload = {
      type_code: body?.type_code?.trim()?.toUpperCase(),
      type_name: body?.type_name?.trim(),
      description: body?.description?.trim() || null,
      sort_order: Number(body?.sort_order || 1),
      is_active: body?.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (!payload.type_code || !payload.type_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Code และชื่อ Benefit Type" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_types")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "แก้ไข Benefit Type สำเร็จ",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "แก้ไขข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("benefit_types")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบ Benefit Type สำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "ลบข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}