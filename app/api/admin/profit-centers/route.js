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
   GET
========================= */

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search =
      searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("profit_centers")
      .select(profitCenterSelect)
      .order("sort_order", { ascending: true })
      .order("profit_center_code", { ascending: true });

    if (error) throw error;

    const mappedData = (data || []).map(mapProfitCenter);

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
            item.profit_center_code
              ?.toLowerCase()
              .includes(search) ||
            item.profit_center_name
              ?.toLowerCase()
              .includes(search) ||
            item.business_unit_code
              ?.toLowerCase()
              .includes(search) ||
            item.business_unit_name
              ?.toLowerCase()
              .includes(search)
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_PROFIT_CENTERS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถโหลด Profit Center ได้",
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

    const payload = {
      profit_center_code,
      profit_center_name,
      business_unit_id,
      status,
      sort_order,
    };

    const { data, error } = await supabaseAdmin
      .from("profit_centers")
      .insert([payload])
      .select(profitCenterSelect)
      .single();

    if (error) throw error;

    const mappedData = mapProfitCenter(data);

    await writeActivityLog({
      module_name: "profit_centers",
      action_type: "create",
      reference_table: "profit_centers",
      reference_id: data.id,
      description: `เพิ่ม Profit Center ${data.profit_center_code} - ${data.profit_center_name}`,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Profit Center สำเร็จ",
      data: mappedData,
    });

  } catch (error) {
    console.error("CREATE_PROFIT_CENTER_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถบันทึก Profit Center ได้",
      },
      { status: 500 }
    );
  }
}