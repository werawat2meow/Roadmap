import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const profitCenterSelect = `
  id,
  profit_center_code,
  profit_center_name,
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

function mapProfitCenter(item) {
  return {
    id: item.id,

    profit_center_code: item.profit_center_code,
    profit_center_name: item.profit_center_name,

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

    const profit_center_code =
      body?.profit_center_code?.trim()?.toUpperCase();

    const profit_center_name =
      body?.profit_center_name?.trim();

    const business_unit_id =
      body?.business_unit_id || null;

    const status =
      body?.status || "active";

    const sort_order =
      Number(body?.sort_order || 0);

    if (!profit_center_code || !profit_center_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสและชื่อ Profit Center",
        },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } =
      await supabaseAdmin
        .from("profit_centers")
        .select("id")
        .eq("profit_center_code", profit_center_code)
        .neq("id", id)
        .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัส Profit Center นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const { data: oldData, error: oldError } =
      await supabaseAdmin
        .from("profit_centers")
        .select(profitCenterSelect)
        .eq("id", id)
        .single();

    if (oldError) throw oldError;

    const payload = {
      profit_center_code,
      profit_center_name,
      business_unit_id,
      status,
      sort_order,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("profit_centers")
      .update(payload)
      .eq("id", id)
      .select(profitCenterSelect)
      .single();

    if (error) throw error;

    const mappedOldData = mapProfitCenter(oldData);
    const mappedData = mapProfitCenter(data);

    await writeActivityLog({
      module_name: "profit_centers",
      action_type: "update",
      reference_table: "profit_centers",
      reference_id: data.id,
      description: `แก้ไข Profit Center ${data.profit_center_code} - ${data.profit_center_name}`,
      old_data: mappedOldData,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดท Profit Center สำเร็จ",
      data: mappedData,
    });

  } catch (error) {
    console.error("UPDATE_PROFIT_CENTER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถแก้ไข Profit Center ได้",
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

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("profit_centers")
      .select(profitCenterSelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const { error } = await supabaseAdmin
      .from("profit_centers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    const mappedOldData = mapProfitCenter(oldData);

    await writeActivityLog({
      module_name: "profit_centers",
      action_type: "delete",
      reference_table: "profit_centers",
      reference_id: oldData.id,
      description: `ลบ Profit Center ${oldData.profit_center_code} - ${oldData.profit_center_name}`,
      old_data: mappedOldData,
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Profit Center สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_PROFIT_CENTER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "ไม่สามารถลบ Profit Center ได้",
      },
      { status: 500 }
    );
  }
}