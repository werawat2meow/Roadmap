import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const type_code = body?.type_code?.trim();
    const type_name = body?.type_name?.trim();
    const status = body?.status || "active";

    if (!type_code || !type_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัสประเภทการจ้างและชื่อประเภทการจ้าง" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("employment_types")
      .select("id")
      .eq("type_code", type_code)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "รหัสประเภทการจ้างนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: oldType, error: oldTypeError } = await supabaseAdmin
      .from("employment_types")
      .select(`
        id,
        type_code,
        type_name,
        status,
        sort_order
      `)
      .eq("id", id)
      .single();

    if (oldTypeError) throw oldTypeError;

    const { error: updateError } = await supabaseAdmin
      .from("employment_types")
      .update({
        type_code,
        type_name,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data, error } = await supabaseAdmin
      .from("employment_types")
      .select(`
        id,
        type_code,
        type_name,
        status,
        sort_order,
        created_at
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "employment_types",
      action_type: "update",
      reference_table: "employment_types",
      reference_id: data.id,
      description: `แก้ไขประเภทการจ้าง ${data.type_code} - ${data.type_name}`,
      old_data: {
        type_code: oldType.type_code,
        type_name: oldType.type_name,
        status: oldType.status,
        sort_order: oldType.sort_order,
      },
      new_data: {
        type_code: data.type_code,
        type_name: data.type_name,
        status: data.status,
        sort_order: data.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลประเภทการจ้างสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("UPDATE_EMPLOYMENT_TYPE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถอัพเดทข้อมูลประเภทการจ้างได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldType, error: oldTypeError } = await supabaseAdmin
      .from("employment_types")
      .select(`
        id,
        type_code,
        type_name,
        status,
        sort_order
      `)
      .eq("id", id)
      .single();

    if (oldTypeError) throw oldTypeError;

    const { error } = await supabaseAdmin
      .from("employment_types")
      .delete()
      .eq("id", id);

    if (error) throw error;


    await writeActivityLog({
      module_name: "employment_types",
      action_type: "delete",
      reference_table: "employment_types",
      reference_id: oldType.id,
      description: `ลบประเภทการจ้าง ${oldType.type_code} - ${oldType.type_name}`,
      old_data: {
        type_code: oldType.type_code,
        type_name: oldType.type_name,
        status: oldType.status,
        sort_order: oldType.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลประเภทการจ้างสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_EMPLOYMENT_TYPE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถลบข้อมูลประเภทการจ้างได้" },
      { status: 500 }
    );
  }
}