import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const unit_code = body?.unit_code?.trim();
    const unit_name = body?.unit_name?.trim();
    const division_id = body?.division_id || null;
    const status = body?.status || "active";

    if (!unit_code || !unit_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสหน่วยและชื่อหน่วย" },
        { status: 400 }
      );
    }

    if (!division_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกฝ่าย" },
        { status: 400 }
      );
    }

    const { data: existingUnit } = await supabaseAdmin
      .from("units")
      .select("id")
      .eq("unit_code", unit_code)
      .neq("id", id)
      .maybeSingle();

    if (existingUnit) {
      return NextResponse.json(
        { error: "รหัสหน่วยนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: oldUnit, error: oldUnitError } = await supabaseAdmin
      .from("units")
      .select(`
        id,
        unit_code,
        unit_name,
        division_id,
        status,
        sort_order,
        divisions (
          division_name,
          departments (
            department_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (oldUnitError) throw oldUnitError;

    const { error: updateError } = await supabaseAdmin
      .from("units")
      .update({
        unit_code,
        unit_name,
        division_id,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data, error } = await supabaseAdmin
      .from("units")
      .select(`
        id,
        unit_code,
        unit_name,
        division_id,
        status,
        sort_order,
        created_at,
        divisions (
          division_name,
          departments (
            department_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "units",
      action_type: "update",
      reference_table: "units",
      reference_id: data.id,
      description: `แก้ไขหน่วย ${data.unit_code} - ${data.unit_name}`,
      old_data: {
        unit_code: oldUnit.unit_code,
        unit_name: oldUnit.unit_name,
        division_id: oldUnit.division_id,
        division_name: oldUnit.divisions?.division_name || "",
        department_name:
          oldUnit.divisions?.departments?.department_name || "",
        status: oldUnit.status,
        sort_order: oldUnit.sort_order,
      },
      new_data: {
        unit_code: data.unit_code,
        unit_name: data.unit_name,
        division_id: data.division_id,
        division_name: data.divisions?.division_name || "",
        department_name:
          data.divisions?.departments?.department_name || "",
        status: data.status,
        sort_order: data.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลหน่วยสำเร็จ",
      data: {
        id: data.id,
        unit_code: data.unit_code,
        unit_name: data.unit_name,
        division_id: data.division_id,
        division_name: data.divisions?.division_name || "-",
        department_name:data.divisions?.departments?.department_name || "-",
        status: data.status,
        sort_order: data.sort_order,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("UPDATE_UNIT_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถอัพเดทข้อมูลหน่วยได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldUnit, error: oldUnitError } = await supabaseAdmin
      .from("units")
      .select(`
        id,
        unit_code,
        unit_name,
        division_id,
        status,
        sort_order,
        divisions (
          division_name,
          departments (
            department_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (oldUnitError) throw oldUnitError;

    const { error } = await supabaseAdmin
      .from("units")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "units",
      action_type: "delete",
      reference_table: "units",
      reference_id: oldUnit.id,
      description: `ลบหน่วย ${oldUnit.unit_code} - ${oldUnit.unit_name}`,
      old_data: {
        unit_code: oldUnit.unit_code,
        unit_name: oldUnit.unit_name,
        division_id: oldUnit.division_id,
        division_name: oldUnit.divisions?.division_name || "",
        department_name:
          oldUnit.divisions?.departments?.department_name || "",
        status: oldUnit.status,
        sort_order: oldUnit.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลหน่วยสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_UNIT_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถลบข้อมูลหน่วยได้" },
      { status: 500 }
    );
  }
}