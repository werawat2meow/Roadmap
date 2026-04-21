import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const division_code = body?.division_code?.trim();
    const division_name = body?.division_name?.trim();
    const department_id = body?.department_id || null;
    const status = body?.status || "active";

    if (!division_code || !division_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสฝ่ายและชื่อฝ่าย" },
        { status: 400 }
      );
    }

    if (!department_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกแผนก" },
        { status: 400 }
      );
    }

    const { data: existingDivision } = await supabaseAdmin
      .from("divisions")
      .select("id")
      .eq("division_code", division_code)
      .neq("id", id)
      .maybeSingle();

    if (existingDivision) {
      return NextResponse.json(
        { error: "รหัสฝ่ายนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: oldDivision, error: oldDivisionError } = await supabaseAdmin
      .from("divisions")
      .select(`
        id,
        division_code,
        division_name,
        department_id,
        status,
        departments (
          department_name
        )
      `)
      .eq("id", id)
      .single();

    if (oldDivisionError) throw oldDivisionError;

    const { error: updateError } = await supabaseAdmin
      .from("divisions")
      .update({
        division_code,
        division_name,
        department_id,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data, error } = await supabaseAdmin
      .from("divisions")
      .select(`
        id,
        division_code,
        division_name,
        department_id,
        status,
        sort_order,
        created_at,
        departments (
          department_name
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "divisions",
      action_type: "update",
      reference_table: "divisions",
      reference_id: data.id,
      description: `แก้ไขฝ่าย ${data.division_code} - ${data.division_name}`,
      old_data: {
        division_code: oldDivision.division_code,
        division_name: oldDivision.division_name,
        department_id: oldDivision.department_id,
        department_name: oldDivision.departments?.department_name || "",
        status: oldDivision.status,
      },
      new_data: {
        division_code: data.division_code,
        division_name: data.division_name,
        department_id: data.department_id,
        department_name: data.departments?.department_name || "",
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลฝ่ายสำเร็จ",
      data: {
        id: data.id,
        division_code: data.division_code,
        division_name: data.division_name,
        department_id: data.department_id,
        department_name: data.departments?.department_name || "-",
        status: data.status,
        sort_order: data.sort_order,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("UPDATE_DIVISION_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถอัพเดทข้อมูลฝ่ายได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldDivision, error: oldDivisionError } = await supabaseAdmin
      .from("divisions")
      .select(`
        id,
        division_code,
        division_name,
        department_id,
        status,
        departments (
          department_name
        )
      `)
      .eq("id", id)
      .single();

    if (oldDivisionError) throw oldDivisionError;

    const { error } = await supabaseAdmin
      .from("divisions")
      .delete()
      .eq("id", id);

    if (error) throw error;


    await writeActivityLog({
      module_name: "divisions",
      action_type: "delete",
      reference_table: "divisions",
      reference_id: oldDivision.id,
      description: `ลบฝ่าย ${oldDivision.division_code} - ${oldDivision.division_name}`,
      old_data: {
        division_code: oldDivision.division_code,
        division_name: oldDivision.division_name,
        department_id: oldDivision.department_id,
        department_name: oldDivision.departments?.department_name || "",
        status: oldDivision.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลฝ่ายสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_DIVISION_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถลบข้อมูลฝ่ายได้" },
      { status: 500 }
    );
  }
}