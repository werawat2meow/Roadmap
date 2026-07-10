import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const glMappingSelect = `
  id,
  gl_code,
  gl_name,
  mapping_type,
  business_unit_id,
  cost_center_id,
  profit_center_id,
  status,
  sort_order,
  created_at,
  updated_at,
  business_units (
    business_unit_code,
    business_unit_name
  ),
  cost_centers (
    cost_center_code,
    cost_center_name
  ),
  profit_centers (
    profit_center_code,
    profit_center_name
  )
`;

function mapGlMapping(item) {
  return {
    id: item.id,
    gl_code: item.gl_code,
    gl_name: item.gl_name,
    mapping_type: item.mapping_type || "salary",

    business_unit_id: item.business_unit_id || "",
    business_unit_code: item.business_units?.business_unit_code || "",
    business_unit_name: item.business_units?.business_unit_name || "-",

    cost_center_id: item.cost_center_id || "",
    cost_center_code: item.cost_centers?.cost_center_code || "",
    cost_center_name: item.cost_centers?.cost_center_name || "-",

    profit_center_id: item.profit_center_id || "",
    profit_center_code: item.profit_centers?.profit_center_code || "",
    profit_center_name: item.profit_centers?.profit_center_name || "-",

    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const gl_code = body?.gl_code?.trim()?.toUpperCase();
    const gl_name = body?.gl_name?.trim();
    const mapping_type = body?.mapping_type || "salary";
    const business_unit_id = body?.business_unit_id || null;
    const cost_center_id = body?.cost_center_id || null;
    const profit_center_id = body?.profit_center_id || null;
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);

    if (!gl_code || !gl_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัส GL และชื่อ GL" },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("gl_mappings")
      .select("id")
      .eq("gl_code", gl_code)
      .eq("mapping_type", mapping_type)
      .neq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        { success: false, error: "รหัส GL และประเภท Mapping นี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("gl_mappings")
      .select(glMappingSelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const payload = {
      gl_code,
      gl_name,
      mapping_type,
      business_unit_id,
      cost_center_id,
      profit_center_id,
      status,
      sort_order,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("gl_mappings")
      .update(payload)
      .eq("id", id)
      .select(glMappingSelect)
      .single();

    if (error) throw error;

    const mappedOldData = mapGlMapping(oldData);
    const mappedData = mapGlMapping(data);

    await writeActivityLog({
      module_name: "gl_mappings",
      action_type: "update",
      reference_table: "gl_mappings",
      reference_id: data.id,
      description: `แก้ไข GL Mapping ${data.gl_code} - ${data.gl_name}`,
      old_data: mappedOldData,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดท GL Mapping สำเร็จ",
      data: mappedData,
    });
  } catch (error) {
    console.error("UPDATE_GL_MAPPING_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถแก้ไข GL Mapping ได้",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("gl_mappings")
      .select(glMappingSelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const { error } = await supabaseAdmin
      .from("gl_mappings")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "gl_mappings",
      action_type: "delete",
      reference_table: "gl_mappings",
      reference_id: oldData.id,
      description: `ลบ GL Mapping ${oldData.gl_code} - ${oldData.gl_name}`,
      old_data: mapGlMapping(oldData),
    });

    return NextResponse.json({
      success: true,
      message: "ลบ GL Mapping สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_GL_MAPPING_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบ GL Mapping ได้",
      },
      { status: 500 }
    );
  }
}