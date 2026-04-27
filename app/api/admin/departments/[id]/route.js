import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const department_code = body?.department_code?.trim();
    const department_name = body?.department_name?.trim();
    const branch_ids = Array.isArray(body?.branch_ids) ? body.branch_ids : [];
    const status = body?.status || "active";

    if (!department_code || !department_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสแผนกและชื่อแผนก" },
        { status: 400 }
      );
    }

    if (!branch_ids.length) {
      return NextResponse.json(
        { error: "กรุณาเลือกสาขาอย่างน้อย 1 รายการ" },
        { status: 400 }
      );
    }

    const { data: existingDepartment } = await supabaseAdmin
      .from("departments")
      .select("id")
      .eq("department_code", department_code)
      .neq("id", id)
      .maybeSingle();

    if (existingDepartment) {
      return NextResponse.json(
        { error: "รหัสแผนกนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: oldDepartment, error: oldDepartmentError } = await supabaseAdmin
      .from("departments")
      .select(`
        id,
        department_code,
        department_name,
        status,
        branch_departments (
          branch_id,
          branches (
            id,
            branch_code,
            branch_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (oldDepartmentError) throw oldDepartmentError;

    const { error: updateError } = await supabaseAdmin
      .from("departments")
      .update({
        department_code,
        department_name,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { error: deleteRelationError } = await supabaseAdmin
      .from("branch_departments")
      .delete()
      .eq("department_id", id);

    if (deleteRelationError) throw deleteRelationError;

    const relationPayload = branch_ids.map((branch_id) => ({
      branch_id,
      department_id: id,
      status: "active",
    }));

    const { error: insertRelationError } = await supabaseAdmin
      .from("branch_departments")
      .insert(relationPayload);

    if (insertRelationError) throw insertRelationError;

    const { data, error } = await supabaseAdmin
      .from("departments")
      .select(`
        id,
        department_code,
        department_name,
        status,
        sort_order,
        created_at,
        branch_departments (
          branch_id,
          branches (
            id,
            branch_code,
            branch_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    const branchRows = data.branch_departments || [];
    
    await writeActivityLog({
      module_name: "departments",
      action_type: "update",
      reference_table: "departments",
      reference_id: data.id,
      description: `แก้ไขแผนก ${data.department_code} - ${data.department_name}`,
      old_data: {
        department_code: oldDepartment.department_code,
        department_name: oldDepartment.department_name,
        status: oldDepartment.status,
        branch_ids: (oldDepartment.branch_departments || []).map((row) => row.branch_id),
        branch_codes: (oldDepartment.branch_departments || [])
          .map((row) => row.branches?.branch_code)
          .filter(Boolean),
        branch_names: (oldDepartment.branch_departments || [])
          .map((row) => row.branches?.branch_name)
          .filter(Boolean),
      },
      new_data: {
        department_code: data.department_code,
        department_name: data.department_name,
        status: data.status,
        branch_ids: branchRows.map((row) => row.branch_id),
        branch_codes: branchRows
          .map((row) => row.branches?.branch_code)
          .filter(Boolean),
        branch_names: branchRows
          .map((row) => row.branches?.branch_name)
          .filter(Boolean),
      },
    });


    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลแผนกสำเร็จ",
      data: {
        id: data.id,
        department_code: data.department_code,
        department_name: data.department_name,
        branch_ids: branchRows.map((row) => row.branch_id),
        branch_names: branchRows
          .map((row) => row.branches?.branch_name)
          .filter(Boolean),
        branch_codes: branchRows
          .map((row) => row.branches?.branch_code)
          .filter(Boolean),
        status: data.status,
        sort_order: data.sort_order,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("UPDATE_DEPARTMENT_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถอัพเดทข้อมูลแผนกได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldDepartment, error: oldDepartmentError } = await supabaseAdmin
      .from("departments")
      .select(`
        id,
        department_code,
        department_name,
        status,
        branch_departments (
          branch_id,
          branches (
            id,
            branch_code,
            branch_name
          )
        )
      `)
      .eq("id", id)
      .single();

    if (oldDepartmentError) throw oldDepartmentError;

    const { error } = await supabaseAdmin
      .from("departments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "departments",
      action_type: "delete",
      reference_table: "departments",
      reference_id: oldDepartment.id,
      description: `ลบแผนก ${oldDepartment.department_code} - ${oldDepartment.department_name}`,
      old_data: {
        department_code: oldDepartment.department_code,
        department_name: oldDepartment.department_name,
        status: oldDepartment.status,
        branch_ids: (oldDepartment.branch_departments || []).map((row) => row.branch_id),
        branch_codes: (oldDepartment.branch_departments || [])
          .map((row) => row.branches?.branch_code)
          .filter(Boolean),
        branch_names: (oldDepartment.branch_departments || [])
          .map((row) => row.branches?.branch_name)
          .filter(Boolean),
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลแผนกสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_DEPARTMENT_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถลบข้อมูลแผนกได้" },
      { status: 500 }
    );
  }
}