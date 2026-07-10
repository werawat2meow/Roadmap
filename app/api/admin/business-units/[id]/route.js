import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const businessUnitSelect = `
  id,
  business_unit_code,
  business_unit_name,
  status,
  sort_order,
  created_at,
  updated_at
`;

function mapBusinessUnit(item) {
  return {
    id: item.id,
    business_unit_code: item.business_unit_code,
    business_unit_name: item.business_unit_name,
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

    const business_unit_code = body?.business_unit_code
      ?.trim()
      ?.toUpperCase();

    const business_unit_name = body?.business_unit_name?.trim();

    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);

    if (!business_unit_code || !business_unit_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสและชื่อ Business Unit",
        },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("business_units")
      .select("id")
      .eq("business_unit_code", business_unit_code)
      .neq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัส Business Unit นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const { data: oldBusinessUnit, error: oldError } = await supabaseAdmin
      .from("business_units")
      .select(businessUnitSelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const payload = {
      business_unit_code,
      business_unit_name,
      status,
      sort_order,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("business_units")
      .update(payload)
      .eq("id", id)
      .select(businessUnitSelect)
      .single();

    if (error) throw error;

    const mappedOld = mapBusinessUnit(oldBusinessUnit);
    const mappedNew = mapBusinessUnit(data);

    await writeActivityLog({
      module_name: "business_units",
      action_type: "update",
      reference_table: "business_units",
      reference_id: data.id,
      description: `แก้ไข Business Unit ${data.business_unit_code} - ${data.business_unit_name}`,
      old_data: mappedOld,
      new_data: mappedNew,
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดท Business Unit สำเร็จ",
      data: mappedNew,
    });
  } catch (error) {
    console.error("UPDATE_BUSINESS_UNIT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถแก้ไข Business Unit ได้",
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

    const { data: oldBusinessUnit, error: oldError } = await supabaseAdmin
      .from("business_units")
      .select(businessUnitSelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    // ตรวจสอบว่ามีพนักงานใช้งานอยู่หรือไม่
    const { count, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("business_unit_id", id);

    if (employeeError) throw employeeError;

    if (count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบได้ เนื่องจากมีพนักงานใช้งานอยู่ ${count} คน`,
        },
        { status: 400 }
      );
    }

    // ตรวจสอบ Cost Center
    const { count: costCenterCount, error: ccError } = await supabaseAdmin
      .from("cost_centers")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("business_unit_id", id);

    if (ccError) throw ccError;

    if (costCenterCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Business Unit นี้มี Cost Center อยู่",
        },
        { status: 400 }
      );
    }

    // ตรวจสอบ Profit Center
    const { count: profitCenterCount, error: pcError } = await supabaseAdmin
      .from("profit_centers")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("business_unit_id", id);

    if (pcError) throw pcError;

    if (profitCenterCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Business Unit นี้มี Profit Center อยู่",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("business_units")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "business_units",
      action_type: "delete",
      reference_table: "business_units",
      reference_id: oldBusinessUnit.id,
      description: `ลบ Business Unit ${oldBusinessUnit.business_unit_code} - ${oldBusinessUnit.business_unit_name}`,
      old_data: mapBusinessUnit(oldBusinessUnit),
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Business Unit สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_BUSINESS_UNIT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบ Business Unit ได้",
      },
      { status: 500 }
    );
  }
}