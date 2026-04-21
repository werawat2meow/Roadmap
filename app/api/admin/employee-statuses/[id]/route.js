import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   PATCH: update employee status
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const status_code = body?.status_code?.trim().toUpperCase();
    const status_name = body?.status_name?.trim();
    const color = body?.color || "green";
    const status = body?.status || "active";

    if (!status_code || !status_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสสถานะและชื่อสถานะพนักงาน",
        },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("employee_statuses")
      .select("id")
      .eq("status_code", status_code)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสสถานะพนักงานนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const { data: oldStatus, error: oldStatusError } = await supabaseAdmin
      .from("employee_statuses")
      .select(`
        id,
        status_code,
        status_name,
        color,
        sort_order,
        status
      `)
      .eq("id", id)
      .single();

    if (oldStatusError) throw oldStatusError;

    const { error: updateError } = await supabaseAdmin
      .from("employee_statuses")
      .update({
        status_code,
        status_name,
        color,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data, error } = await supabaseAdmin
      .from("employee_statuses")
      .select(`
        id,
        status_code,
        status_name,
        color,
        sort_order,
        status,
        created_at
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "employee_statuses",
      action_type: "update",
      reference_table: "employee_statuses",
      reference_id: data.id,
      description: `แก้ไขสถานะพนักงาน ${data.status_code} - ${data.status_name}`,
      old_data: {
        status_code: oldStatus.status_code,
        status_name: oldStatus.status_name,
        color: oldStatus.color,
        status: oldStatus.status,
        sort_order: oldStatus.sort_order,
      },
      new_data: {
        status_code: data.status_code,
        status_name: data.status_name,
        color: data.color,
        status: data.status,
        sort_order: data.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลสถานะพนักงานสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_STATUS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถอัพเดทข้อมูลสถานะพนักงานได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE: delete employee status
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldStatus, error: oldStatusError } = await supabaseAdmin
      .from("employee_statuses")
      .select(`
        id,
        status_code,
        status_name,
        color,
        sort_order,
        status
      `)
      .eq("id", id)
      .single();

    if (oldStatusError) throw oldStatusError;

    const { error } = await supabaseAdmin
      .from("employee_statuses")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "employee_statuses",
      action_type: "delete",
      reference_table: "employee_statuses",
      reference_id: oldStatus.id,
      description: `ลบสถานะพนักงาน ${oldStatus.status_code} - ${oldStatus.status_name}`,
      old_data: {
        status_code: oldStatus.status_code,
        status_name: oldStatus.status_name,
        color: oldStatus.color,
        status: oldStatus.status,
        sort_order: oldStatus.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลสถานะพนักงานสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_EMPLOYEE_STATUS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบข้อมูลสถานะพนักงานได้",
      },
      { status: 500 }
    );
  }
}