import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("skills")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET_SKILL_DETAIL_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Load skill failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const skillCode = body?.skill_code?.trim()?.toUpperCase();
    const skillName = body?.skill_name?.trim();

    if (!skillCode) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัส Skill" },
        { status: 400 }
      );
    }

    if (!skillName) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อ Skill" },
        { status: 400 }
      );
    }

    const payload = {
      skill_code: skillCode,
      skill_name: skillName,
      skill_category: body?.skill_category?.trim() || null,
      status: body?.status || "active",
      sort_order: Number(body?.sort_order || 0),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("skills")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "อัพเดท Skill สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("PATCH_SKILL_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Update skill failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("skills")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบ Skill สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_SKILL_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Delete skill failed" },
      { status: 500 }
    );
  }
}