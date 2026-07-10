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
    auto_confirm_after_probation: !!item.auto_confirm_after_probation,
    default_employee_status_id: item.default_employee_status_id || "",
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("employment_types")
      .select(employmentTypeSelect)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedData = (data || []).map(mapEmploymentType);

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
            item.type_code?.toLowerCase().includes(search) ||
            item.type_name?.toLowerCase().includes(search)
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_EMPLOYMENT_TYPES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลประเภทการจ้างได้",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const type_code = body?.type_code?.trim()?.toUpperCase();
    const type_name = body?.type_name?.trim();
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);
    const default_employee_status_id = body?.default_employee_status_id || null;
    const probation_required = !!body?.probation_required;
    const probation_days = probation_required ? Number(body?.probation_days || 0) : 0;

    const auto_confirm_after_probation =
      probation_required && !!body?.auto_confirm_after_probation;

    if (!type_code || !type_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสประเภทการจ้างและชื่อประเภทการจ้าง",
        },
        { status: 400 }
      );
    }

    if (probation_required && ![30, 60, 90, 120].includes(probation_days)) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกระยะเวลาทดลองงาน 30, 60, 90 หรือ 120 วัน",
        },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("employment_types")
      .select("id")
      .eq("type_code", type_code)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        { success: false, error: "รหัสประเภทการจ้างนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const payload = {
      type_code,
      type_name,
      status,
      sort_order,
      probation_required,
      probation_days,
      auto_confirm_after_probation,
      default_employee_status_id,
    };

    const { data, error } = await supabaseAdmin
      .from("employment_types")
      .insert([payload])
      .select(employmentTypeSelect)
      .single();

    if (error) throw error;

    const mappedData = mapEmploymentType(data);

    await writeActivityLog({
      module_name: "employment_types",
      action_type: "create",
      reference_table: "employment_types",
      reference_id: data.id,
      description: `เพิ่มประเภทการจ้าง ${data.type_code} - ${data.type_name}`,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลประเภทการจ้างสำเร็จ",
      data: mappedData,
    });
  } catch (error) {
    console.error("CREATE_EMPLOYMENT_TYPE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถบันทึกข้อมูลประเภทการจ้างได้",
      },
      { status: 500 }
    );
  }
}