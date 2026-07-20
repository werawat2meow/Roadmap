import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const LEVELS = ["basic", "intermediate", "advanced", "expert"];

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("position_required_skills")
      .select(`
        id,
        position_id,
        skill_id,
        required_level,
        is_required,
        remark,
        created_at,
        updated_at,
        skills (
          id,
          skill_code,
          skill_name,
          skill_category,
          status
        )
      `)
      .eq("position_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error("GET_POSITION_REQUIRED_SKILLS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Load position required skills failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const skillId = body?.skill_id;
    const requiredLevel = body?.required_level || "basic";

    if (!skillId) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือก Skill" },
        { status: 400 }
      );
    }

    if (!LEVELS.includes(requiredLevel)) {
      return NextResponse.json(
        { success: false, error: "ระดับ Skill ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const payload = {
      position_id: id,
      skill_id: skillId,
      required_level: requiredLevel,
      is_required: body?.is_required ?? true,
      remark: body?.remark?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("position_required_skills")
      .upsert(payload, {
        onConflict: "position_id,skill_id",
      })
      .select(`
        id,
        position_id,
        skill_id,
        required_level,
        is_required,
        remark,
        created_at,
        updated_at,
        skills (
          id,
          skill_code,
          skill_name,
          skill_category,
          status
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "บันทึก Required Skill สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("POST_POSITION_REQUIRED_SKILL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Save position required skill failed",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();

    const rowId = body?.id;
    const requiredLevel = body?.required_level || "basic";

    if (!rowId) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Required Skill ID" },
        { status: 400 }
      );
    }

    if (!LEVELS.includes(requiredLevel)) {
      return NextResponse.json(
        { success: false, error: "ระดับ Skill ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const payload = {
      required_level: requiredLevel,
      is_required: body?.is_required ?? true,
      remark: body?.remark?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("position_required_skills")
      .update(payload)
      .eq("id", rowId)
      .select(`
        id,
        position_id,
        skill_id,
        required_level,
        is_required,
        remark,
        created_at,
        updated_at,
        skills (
          id,
          skill_code,
          skill_name,
          skill_category,
          status
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "อัพเดท Required Skill สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("PATCH_POSITION_REQUIRED_SKILL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Update position required skill failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const rowId = searchParams.get("id");

    if (!rowId) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Required Skill ID" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("position_required_skills")
      .delete()
      .eq("id", rowId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบ Required Skill สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_POSITION_REQUIRED_SKILL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Delete position required skill failed",
      },
      { status: 500 }
    );
  }
}