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
   GET
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("business_units")
      .select(businessUnitSelect)
      .order("sort_order", { ascending: true })
      .order("business_unit_code", { ascending: true });

    if (error) throw error;

    const mappedData = (data || []).map(mapBusinessUnit);

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
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
    console.error("GET_BUSINESS_UNITS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถโหลด Business Unit ได้",
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

    const payload = {
      business_unit_code,
      business_unit_name,
      status,
      sort_order,
    };

    const { data, error } = await supabaseAdmin
      .from("business_units")
      .insert([payload])
      .select(businessUnitSelect)
      .single();

    if (error) throw error;

    const mappedData = mapBusinessUnit(data);

    await writeActivityLog({
      module_name: "business_units",
      action_type: "create",
      reference_table: "business_units",
      reference_id: data.id,
      description: `เพิ่ม Business Unit ${data.business_unit_code} - ${data.business_unit_name}`,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Business Unit สำเร็จ",
      data: mappedData,
    });
  } catch (error) {
    console.error("CREATE_BUSINESS_UNIT_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถบันทึก Business Unit ได้",
      },
      { status: 500 }
    );
  }
}