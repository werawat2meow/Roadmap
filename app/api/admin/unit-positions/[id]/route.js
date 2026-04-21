import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const unit_id = body?.unit_id || null;
    const position_id = body?.position_id || null;
    const headcount_target = Number(body?.headcount_target ?? 0);
    const status = body?.status || "active";

    if (!unit_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกหน่วยงาน" },
        { status: 400 }
      );
    }

    if (!position_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกตำแหน่ง" },
        { status: 400 }
      );
    }

    if (headcount_target < 0) {
      return NextResponse.json(
        { error: "จำนวนอัตราต้องไม่น้อยกว่า 0" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("unit_positions")
      .select("id")
      .eq("unit_id", unit_id)
      .eq("position_id", position_id)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "หน่วยงานนี้มีตำแหน่งนี้อยู่แล้ว" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("unit_positions")
      .update({
        unit_id,
        position_id,
        headcount_target,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data, error } = await supabaseAdmin
      .from("unit_positions")
      .select(`
        id,
        unit_id,
        position_id,
        headcount_target,
        status,
        created_at,
        units (
          unit_name,
          divisions (
            division_name,
            departments (
              department_name
            )
          )
        ),
        positions (
          position_name,
          position_level
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลสำเร็จ",
      data: {
        id: data.id,
        unit_id: data.unit_id,
        position_id: data.position_id,
        unit_name: data.units?.unit_name || "-",
        division_name: data.units?.divisions?.division_name || "-",
        department_name: data.units?.divisions?.departments?.department_name || "-",
        position_name: data.positions?.position_name || "-",
        position_level: data.positions?.position_level || "",
        headcount_target: data.headcount_target ?? 0,
        status: data.status,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("UPDATE_UNIT_POSITION_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถอัพเดทข้อมูลได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("unit_positions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE_UNIT_POSITION_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถลบข้อมูลได้" },
      { status: 500 }
    );
  }
}