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
    mapping_type: item.mapping_type || "",
    business_unit_id: item.business_unit_id || "",
    business_unit_name: item.business_units?.business_unit_name || "-",
    cost_center_id: item.cost_center_id || "",
    cost_center_name: item.cost_centers?.cost_center_name || "-",
    profit_center_id: item.profit_center_id || "",
    profit_center_name: item.profit_centers?.profit_center_name || "-",
    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("gl_mappings")
      .select(glMappingSelect)
      .order("sort_order", { ascending: true })
      .order("gl_code", { ascending: true });

    if (error) throw error;

    const mappedData = (data || []).map(mapGlMapping);

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
            item.gl_code?.toLowerCase().includes(search) ||
            item.gl_name?.toLowerCase().includes(search) ||
            item.mapping_type?.toLowerCase().includes(search) ||
            item.business_unit_name?.toLowerCase().includes(search) ||
            item.cost_center_name?.toLowerCase().includes(search) ||
            item.profit_center_name?.toLowerCase().includes(search)
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_GL_MAPPINGS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถโหลด GL Mapping ได้",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
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
        {
          success: false,
          error: "กรุณากรอกรหัส GL และชื่อ GL",
        },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("gl_mappings")
      .select("id")
      .eq("gl_code", gl_code)
      .eq("mapping_type", mapping_type)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัส GL และประเภท Mapping นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const payload = {
      gl_code,
      gl_name,
      mapping_type,
      business_unit_id,
      cost_center_id,
      profit_center_id,
      status,
      sort_order,
    };

    const { data, error } = await supabaseAdmin
      .from("gl_mappings")
      .insert([payload])
      .select(glMappingSelect)
      .single();

    if (error) throw error;

    const mappedData = mapGlMapping(data);

    await writeActivityLog({
      module_name: "gl_mappings",
      action_type: "create",
      reference_table: "gl_mappings",
      reference_id: data.id,
      description: `เพิ่ม GL Mapping ${data.gl_code} - ${data.gl_name}`,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่ม GL Mapping สำเร็จ",
      data: mappedData,
    });
  } catch (error) {
    console.error("CREATE_GL_MAPPING_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถบันทึก GL Mapping ได้",
      },
      { status: 500 }
    );
  }
}