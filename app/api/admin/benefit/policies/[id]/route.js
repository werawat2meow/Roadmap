import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload = {
      policy_code: body?.policy_code?.trim()?.toUpperCase(),
      policy_name: body?.policy_name?.trim(),
      description: body?.description?.trim() || null,
      effective_from: body?.effective_from || null,
      effective_to: body?.effective_to || null,
      sort_order: Number(body?.sort_order || 1),
      is_active: body?.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (!payload.policy_code || !payload.policy_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Code และชื่อ Policy" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_policies")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "แก้ไข Benefit Policy สำเร็จ",
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
      .from("benefit_policies")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบ Benefit Policy สำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "ลบข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}