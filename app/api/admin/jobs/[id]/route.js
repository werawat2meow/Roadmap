import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const job_code = body?.job_code?.trim()?.toUpperCase();
    const job_name = body?.job_name?.trim();
    const job_level = body?.job_level?.trim() || null;
    const job_description = body?.job_description?.trim() || null;
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);
    const management_level = body?.management_level?.trim() || null;
    const scope_type = body?.scope_type?.trim() || null;
    const can_approve_budget = !!body?.can_approve_budget;
    const can_manage_employees = !!body?.can_manage_employees;
    const job_color = body?.job_color || "#E2E8F0";
    const job_icon = body?.job_icon || null;

    if (!job_code || !job_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัส Job และชื่อ Job" },
        { status: 400 }
      );
    }

    const { data: oldJob, error: oldError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const { data, error } = await supabaseAdmin
      .from("jobs")
      .update({
        job_code,
        job_name,
        job_level,
        job_description,
        management_level,
        scope_type,
        can_approve_budget,
        can_manage_employees,
        job_color,
        job_icon,
        status,
        sort_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        job_code,
        job_name,
        job_level,
        job_description,
        management_level,
        scope_type,
        can_approve_budget,
        can_manage_employees,
        job_color,
        job_icon,
        status,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "รหัส Job นี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }
      throw error;
    }

    await writeActivityLog({
      module_name: "jobs",
      action_type: "update",
      reference_table: "jobs",
      reference_id: data.id,
      description: `แก้ไข Job ${data.job_code} - ${data.job_name}`,
      old_data: oldJob,
      new_data: {
        job_code:data.job_code,
        job_name:data.job_name,
        job_level:data.job_level,
        management_level:data.management_level,
        scope_type:data.scope_type,
        can_approve_budget:data.can_approve_budget,
        can_manage_employees:data.can_manage_employees,
        job_color:data.job_color,
        job_icon:data.job_icon,
        job_description:data.job_description,
        status:data.status
      },
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไข Job สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("UPDATE_JOB_ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถแก้ไข Job ได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldJob, error: oldError } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const { error } = await supabaseAdmin.from("jobs").delete().eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "jobs",
      action_type: "delete",
      reference_table: "jobs",
      reference_id: oldJob.id,
      description: `ลบ Job ${oldJob.job_code} - ${oldJob.job_name}`,
      old_data: oldJob,
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Job สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_JOB_ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถลบ Job ได้" },
      { status: 500 }
    );
  }
}