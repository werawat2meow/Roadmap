import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const SELECT_FIELDS = `
  id,
  employee_id,
  management_level,
  scope_type,
  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,
  supervisor_employee_id,
  is_primary,
  status,
  sort_order,
  created_at,
  updated_at,
  employees!management_assignments_employee_id_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en
  ),
  supervisor:employees!management_assignments_supervisor_employee_id_fkey (
    id,
    employee_code,
    first_name_th,
    last_name_th
  ),
  companies (
    id,
    company_code,
    company_name_th,
    company_name_en
  ),
  branch_groups (
    id,
    group_code,
    group_name,
    group_color
  ),
  branches (
    id,
    branch_code,
    branch_name
  ),
  departments (
    id,
    department_code,
    department_name,
    department_color
  ),
  divisions (
    id,
    division_code,
    division_name
  ),
  units (
    id,
    unit_code,
    unit_name
  )
`;

const mapAssignment = (item) => ({
  id: item.id,
  employee_id: item.employee_id,
  employee_code: item.employees?.employee_code || "",
  employee_name:
    `${item.employees?.first_name_th || ""} ${item.employees?.last_name_th || ""}`.trim() ||
    `${item.employees?.first_name_en || ""} ${item.employees?.last_name_en || ""}`.trim() ||
    "-",

  management_level: item.management_level,
  scope_type: item.scope_type,

  company_id: item.company_id || "",
  company_name:
    item.companies?.company_name_th || item.companies?.company_name_en || "",

  branch_group_id: item.branch_group_id || "",
  branch_group_name: item.branch_groups?.group_name || "",
  branch_group_color: item.branch_groups?.group_color || "#E2E8F0",

  branch_id: item.branch_id || "",
  branch_name: item.branches?.branch_name || "",

  department_id: item.department_id || "",
  department_name: item.departments?.department_name || "",
  department_color: item.departments?.department_color || "#E2E8F0",

  division_id: item.division_id || "",
  division_name: item.divisions?.division_name || "",

  unit_id: item.unit_id || "",
  unit_name: item.units?.unit_name || "",

  supervisor_employee_id: item.supervisor_employee_id || "",
  supervisor_name:
    `${item.supervisor?.first_name_th || ""} ${item.supervisor?.last_name_th || ""}`.trim() ||
    "",

  is_primary: item.is_primary,
  status: item.status,
  sort_order: item.sort_order,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const validatePayload = (payload) => {
  if (!payload.employee_id) return "กรุณาเลือกพนักงาน";
  if (!payload.management_level) return "กรุณาเลือกระดับผู้บริหาร";
  if (!payload.scope_type) return "กรุณาเลือกขอบเขตการดูแล";

  if (payload.scope_type === "company" && !payload.company_id) {
    return "กรุณาเลือกบริษัท";
  }

  if (payload.scope_type === "branch_group" && !payload.branch_group_id) {
    return "กรุณาเลือกกรุ๊ปสังกัด";
  }

  if (payload.scope_type === "branch" && !payload.branch_id) {
    return "กรุณาเลือกสังกัด";
  }

  if (payload.scope_type === "department" && !payload.department_id) {
    return "กรุณาเลือกแผนก";
  }

  if (payload.scope_type === "division" && !payload.division_id) {
    return "กรุณาเลือกฝ่าย";
  }

  if (payload.scope_type === "unit" && !payload.unit_id) {
    return "กรุณาเลือกหน่วยงาน";
  }

  if (payload.management_level === "P12" && payload.scope_type !== "all") {
    return "P12 ควรใช้ขอบเขต all เพื่อดูแลภาพรวมทั้งหมด";
  }

  return "";
};

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("management_assignments")
      .select(SELECT_FIELDS)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const payload = {
      employee_id: body?.employee_id || null,
      management_level: body?.management_level?.trim(),
      scope_type: body?.scope_type?.trim(),

      company_id: body?.company_id || null,
      branch_group_id: body?.branch_group_id || null,
      branch_id: body?.branch_id || null,
      department_id: body?.department_id || null,
      division_id: body?.division_id || null,
      unit_id: body?.unit_id || null,

      supervisor_employee_id: body?.supervisor_employee_id || null,
      is_primary: body?.is_primary ?? true,
      status: body?.status || "active",
      sort_order: Number(body?.sort_order || 0),
      updated_at: new Date().toISOString(),
    };

    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("management_assignments")
      .update(payload)
      .eq("id", id)
      .select(SELECT_FIELDS)
      .single();

    if (error) throw error;

    const oldMapped = mapAssignment(oldData);
    const newMapped = mapAssignment(data);

    await writeActivityLog({
      module_name: "management_assignments",
      action_type: "update",
      reference_table: "management_assignments",
      reference_id: data.id,
      description: `แก้ไขสายบังคับบัญชา ${newMapped.employee_name} (${newMapped.management_level})`,
      old_data: oldMapped,
      new_data: newMapped,
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขสายบังคับบัญชาสำเร็จ",
      data: newMapped,
    });
  } catch (error) {
    console.error("UPDATE_MANAGEMENT_ASSIGNMENT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถแก้ไขสายบังคับบัญชาได้",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("management_assignments")
      .select(SELECT_FIELDS)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const oldMapped = mapAssignment(oldData);

    const { error } = await supabaseAdmin
      .from("management_assignments")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "management_assignments",
      action_type: "delete",
      reference_table: "management_assignments",
      reference_id: oldData.id,
      description: `ลบสายบังคับบัญชา ${oldMapped.employee_name} (${oldMapped.management_level})`,
      old_data: oldMapped,
    });

    return NextResponse.json({
      success: true,
      message: "ลบสายบังคับบัญชาสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_MANAGEMENT_ASSIGNMENT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบสายบังคับบัญชาได้",
      },
      { status: 500 }
    );
  }
}