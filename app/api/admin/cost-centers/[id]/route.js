import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const costCenterSelect = `
  id,
  cost_center_code,
  cost_center_name,
  business_unit_id,
  status,
  sort_order,
  created_at,
  updated_at,
  business_units (
    business_unit_code,
    business_unit_name
  )
`;

function mapCostCenter(item) {
  return {
    id: item.id,
    cost_center_code: item.cost_center_code,
    cost_center_name: item.cost_center_name,
    business_unit_id: item.business_unit_id || "",

    business_unit_code:
      item.business_units?.business_unit_code || "",

    business_unit_name:
      item.business_units?.business_unit_name || "-",

    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),

    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

/* =========================
   PATCH
========================= */

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const cost_center_code =
      body?.cost_center_code?.trim()?.toUpperCase();

    const cost_center_name =
      body?.cost_center_name?.trim();

    const business_unit_id =
      body?.business_unit_id || null;

    const status =
      body?.status || "active";

    const sort_order =
      Number(body?.sort_order || 0);

    if (!cost_center_code || !cost_center_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสและชื่อ Cost Center",
        },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("cost_centers")
      .select("id")
      .eq("cost_center_code", cost_center_code)
      .neq("id", id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัส Cost Center นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("cost_centers")
        .select(costCenterSelect)
        .eq("id", id)
        .single();

    if (oldError) throw oldError;

    const payload = {
      cost_center_code,
      cost_center_name,
      business_unit_id,
      status,
      sort_order,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("cost_centers")
      .update(payload)
      .eq("id", id)
      .select(costCenterSelect)
      .single();

    if (error) throw error;

    const oldMapped = mapCostCenter(oldData);
    const mapped = mapCostCenter(data);

    await writeActivityLog({
      module_name: "cost_centers",
      action_type: "update",
      reference_table: "cost_centers",
      reference_id: id,
      description: `แก้ไข Cost Center ${mapped.cost_center_code} - ${mapped.cost_center_name}`,
      old_data: oldMapped,
      new_data: mapped,
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดท Cost Center สำเร็จ",
      data: mapped,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถแก้ไข Cost Center ได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE
========================= */

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("cost_centers")
        .select(costCenterSelect)
        .eq("id", id)
        .single();

    if (oldError) throw oldError;

    const { error } = await supabaseAdmin
      .from("cost_centers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "cost_centers",
      action_type: "delete",
      reference_table: "cost_centers",
      reference_id: id,
      description: `ลบ Cost Center ${oldData.cost_center_code} - ${oldData.cost_center_name}`,
      old_data: mapCostCenter(oldData),
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Cost Center สำเร็จ",
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถลบ Cost Center ได้",
      },
      { status: 500 }
    );
  }
}