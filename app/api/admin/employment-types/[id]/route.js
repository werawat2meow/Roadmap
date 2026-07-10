import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const employmentTypeSelect = `
  id,
  type_code,
  type_name,
  status,
  sort_order,
  probation_required,
  probation_days,
  auto_confirm_after_probation,
  default_employee_status_id,
  created_at,
  updated_at
`;

function mapEmploymentType(item) {
  return {
    id: item.id,
    type_code: item.type_code,
    type_name: item.type_name,
    status: item.status || "active",
    sort_order: item.sort_order || 0,
    probation_required: !!item.probation_required,
    probation_days: Number(item.probation_days || 0),
    default_employee_status_id: item.default_employee_status_id || "",
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const type_code = body?.type_code?.trim()?.toUpperCase();
    const type_name = body?.type_name?.trim();
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);
    const probation_required = !!body?.probation_required;
    const probation_days = probation_required ? Number(body?.probation_days || 0): 0;
    const auto_confirm_after_probation = probation_required && !!body?.auto_confirm_after_probation;
    const default_employee_status_id = body?.default_employee_status_id || null;

    if (!type_code || !type_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัสประเภทการจ้างและชื่อประเภทการจ้าง" },
        { status: 400 }
      );
    }

    if (probation_required && ![30, 60, 90, 120].includes(probation_days)) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือกระยะเวลาทดลองงาน 30, 60, 90 หรือ 120 วัน" },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("employment_types")
      .select("id")
      .eq("type_code", type_code)
      .neq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        { success: false, error: "รหัสประเภทการจ้างนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: oldType, error: oldTypeError } = await supabaseAdmin
      .from("employment_types")
      .select(employmentTypeSelect)
      .eq("id", id)
      .single();

    if (oldTypeError) throw oldTypeError;

    const payload = {
      type_code,
      type_name,
      status,
      sort_order,
      probation_required,
      probation_days,
      auto_confirm_after_probation,
      default_employee_status_id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("employment_types")
      .update(payload)
      .eq("id", id)
      .select(employmentTypeSelect)
      .single();

    if (error) throw error;

    const mappedOldType = mapEmploymentType(oldType);
    const mappedType = mapEmploymentType(data);

    await writeActivityLog({
      module_name: "employment_types",
      action_type: "update",
      reference_table: "employment_types",
      reference_id: data.id,
      description: `แก้ไขประเภทการจ้าง ${data.type_code} - ${data.type_name}`,
      old_data: mappedOldType,
      new_data: mappedType,
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดทข้อมูลประเภทการจ้างสำเร็จ",
      data: mappedType,
    });
  } catch (error) {
    console.error("UPDATE_EMPLOYMENT_TYPE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถอัพเดทข้อมูลประเภทการจ้างได้",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldType, error: oldTypeError } = await supabaseAdmin
      .from("employment_types")
      .select(employmentTypeSelect)
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
      old_data: mapEmploymentType(oldType),
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลประเภทการจ้างสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_EMPLOYMENT_TYPE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบข้อมูลประเภทการจ้างได้",
      },
      { status: 500 }
    );
  }
}