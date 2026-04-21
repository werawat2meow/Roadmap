import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   PATCH: update employee
========================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const first_name_th = body?.first_name_th?.trim();
    const last_name_th = body?.last_name_th?.trim();
    const first_name_en = body?.first_name_en?.trim() || null;
    const last_name_en = body?.last_name_en?.trim() || null;
    const nick_name = body?.nick_name?.trim() || null;
    const gender = body?.gender || null;
    const phone = body?.phone?.trim() || null;
    const email = body?.email?.trim() || null;
    const employee_photo_url = body?.employee_photo_url?.trim() || null;
    const nationality = body?.nationality || null;
    const hire_date = body?.hire_date || null;
    const employment_type = body?.employment_type || null;
    const employee_status_id = body?.employee_status_id || null;
    const status = body?.status || "active";

    const branch_id = body?.branch_id || null;
    const department_id = body?.department_id || null;
    const division_id = body?.division_id || null;
    const unit_id = body?.unit_id || null;
    const position_id = body?.position_id || null;

    if (!first_name_th || !last_name_th) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อและนามสกุล" },
        { status: 400 }
      );
    }

    if (!hire_date) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกวันที่เริ่มงาน" },
        { status: 400 }
      );
    }

    if (!branch_id || !department_id || !division_id || !unit_id || !position_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกสาขา แผนก ฝ่าย หน่วยงาน และตำแหน่งให้ครบ",
        },
        { status: 400 }
      );
    }

    if (!nationality) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสัญชาติ" },
        { status: 400 }
      );
    }

    if (!employee_status_id) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกสถานะพนักงาน" },
        { status: 400 }
      );
    }

    const { data: oldEmployee, error: oldEmployeeError } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (oldEmployeeError) throw oldEmployeeError;

    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        nick_name,
        gender,
        phone,
        email,
        employee_photo_url,
        nationality,
        hire_date,
        employment_type,
        employee_status_id,
        status,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    const { data, error } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        employee_code,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        nick_name,
        gender,
        phone,
        email,
        employee_photo_url,
        nationality,
        hire_date,
        employment_type,
        status,
        employee_status_id,
        branch_id,
        department_id,
        division_id,
        unit_id,
        position_id,
        created_at,
        employee_statuses (
          status_name,
          color
        ),
        branches (
          branch_name
        ),
        departments (
          department_name
        ),
        divisions (
          division_name
        ),
        units (
          unit_name
        ),
        positions (
          position_name,
          position_level
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "employees",
      action_type: "update",
      reference_table: "employees",
      reference_id: data.id,
      description: `แก้ไขข้อมูลพนักงาน ${data.first_name_th} ${data.last_name_th} (${data.employee_code})`,
      old_data: oldEmployee,
      new_data: {
        employee_code: data.employee_code,
        first_name_th: data.first_name_th,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en,
        last_name_en: data.last_name_en,
        nick_name: data.nick_name,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        employee_photo_url: data.employee_photo_url,
        nationality: data.nationality,
        hire_date: data.hire_date,
        employment_type: data.employment_type,
        employee_status_id: data.employee_status_id,
        status: data.status,
        branch_id: data.branch_id,
        department_id: data.department_id,
        division_id: data.division_id,
        unit_id: data.unit_id,
        position_id: data.position_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลพนักงานสำเร็จ",
      data: {
        id: data.id,
        employee_code: data.employee_code,
        first_name_th: data.first_name_th,
        last_name_th: data.last_name_th,
        first_name_en: data.first_name_en || "",
        last_name_en: data.last_name_en || "",
        full_name_th: `${data.first_name_th || ""} ${data.last_name_th || ""}`.trim(),
        nick_name: data.nick_name || "",
        gender: data.gender || "",
        phone: data.phone || "",
        email: data.email || "",
        employee_photo_url: data.employee_photo_url || "",
        nationality: data.nationality || "",
        hire_date: data.hire_date || "",
        employment_type: data.employment_type || "",
        status: data.status,
        employee_status_id: data.employee_status_id || "",
        employee_status_name: data.employee_statuses?.status_name || "-",
        employee_status_color: data.employee_statuses?.color || "slate",
        branch_id: data.branch_id || "",
        department_id: data.department_id || "",
        division_id: data.division_id || "",
        unit_id: data.unit_id || "",
        position_id: data.position_id || "",
        branch_name: data.branches?.branch_name || "-",
        department_name: data.departments?.department_name || "-",
        division_name: data.divisions?.division_name || "-",
        unit_name: data.units?.unit_name || "-",
        position_name: data.positions?.position_name || "-",
        position_level: data.positions?.position_level || "",
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถอัพเดทข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE: delete employee
========================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldEmployee, error: oldEmployeeError } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();

    if (oldEmployeeError) throw oldEmployeeError;

    const { error } = await supabaseAdmin
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "employees",
      action_type: "delete",
      reference_table: "employees",
      reference_id: oldEmployee.id,
      description: `ลบข้อมูลพนักงาน ${oldEmployee.first_name_th} ${oldEmployee.last_name_th} (${oldEmployee.employee_code})`,
      old_data: oldEmployee,
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลพนักงานสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_EMPLOYEE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบข้อมูลพนักงานได้",
      },
      { status: 500 }
    );
  }
}