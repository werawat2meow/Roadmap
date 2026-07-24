import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload = {
      family_code: body.family_code
        ?.trim()
        ?.toUpperCase(),

      family_name: body.family_name
        ?.trim(),

      description:
        body.description?.trim() || null,

      sort_order:
        Number(body.sort_order) || 0,

      status:
        body.status || "active",

      updated_at:
        new Date().toISOString(),
    };

    if (!payload.family_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Family Code",
        },
        { status: 400 }
      );
    }

    if (!payload.family_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Family Name",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบ Family Code ซ้ำ
    const {
      data: duplicate,
      error: duplicateError,
    } = await supabaseAdmin
      .from("position_families")
      .select("id")
      .eq("family_code", payload.family_code)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Family Code นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("position_families")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "อัปเดต Position Family สำเร็จ",
      data,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
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

    // ตรวจสอบว่ามี Position ใช้งานอยู่หรือไม่
    const {
      count,
      error: countError,
    } = await supabaseAdmin
      .from("positions")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("position_family_id", id);

    if (countError) throw countError;

    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบได้ เนื่องจากมี Position ใช้งานอยู่",
        },
        {
          status: 400,
        }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("position_families")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "ลบ Position Family สำเร็จ",
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}