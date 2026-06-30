import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload = {
      category_code: body?.category_code?.trim()?.toUpperCase(),
      category_name: body?.category_name?.trim(),
      description: body?.description?.trim() || null,
      sort_order: Number(body?.sort_order || 1),
      is_active: body?.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (!payload.category_code || !payload.category_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Code และชื่อ Category" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "แก้ไข Benefit Category สำเร็จ",
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
      .from("benefit_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบ Benefit Category สำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "ลบข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}