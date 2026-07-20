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
    business_unit_code: item.business_units?.business_unit_code || "",
    business_unit_name: item.business_units?.business_unit_name || "-",
    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

/* =========================
   GET
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("cost_centers")
      .select(costCenterSelect)
      .order("sort_order", { ascending: true })
      .order("cost_center_code", { ascending: true });

    if (error) throw error;

    const mappedData = (data || []).map(mapCostCenter);

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
            item.cost_center_code?.toLowerCase().includes(search) ||
            item.cost_center_name?.toLowerCase().includes(search) ||
            item.business_unit_code?.toLowerCase().includes(search) ||
            item.business_unit_name?.toLowerCase().includes(search)
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_COST_CENTERS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถโหลด Cost Center ได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   POST
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const cost_center_code = body?.cost_center_code?.trim()?.toUpperCase();
    const cost_center_name = body?.cost_center_name?.trim();
    const business_unit_id = body?.business_unit_id || null;
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);

    if (!cost_center_code || !cost_center_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสและชื่อ Cost Center",
        },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("cost_centers")
      .select("id")
      .eq("cost_center_code", cost_center_code)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัส Cost Center นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const payload = {
      cost_center_code,
      cost_center_name,
      business_unit_id,
      status,
      sort_order,
    };

    const { data, error } = await supabaseAdmin
      .from("cost_centers")
      .insert([payload])
      .select(costCenterSelect)
      .single();

    if (error) throw error;

    const mappedData = mapCostCenter(data);

    await writeActivityLog({
      module_name: "cost_centers",
      action_type: "create",
      reference_table: "cost_centers",
      reference_id: data.id,
      description: `เพิ่ม Cost Center ${data.cost_center_code} - ${data.cost_center_name}`,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Cost Center สำเร็จ",
      data: mappedData,
    });
  } catch (error) {
    console.error("CREATE_COST_CENTER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถบันทึก Cost Center ได้",
      },
      { status: 500 }
    );
  }
}