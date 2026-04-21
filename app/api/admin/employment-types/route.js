import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("employment_types")
      .select(`
        id,
        type_code,
        type_name,
        status,
        sort_order,
        created_at
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedData = (data || []).map((item) => ({
      id: item.id,
      type_code: item.type_code,
      type_name: item.type_name,
      status: item.status,
      sort_order: item.sort_order,
      created_at: item.created_at,
    }));

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
      { success: false, error: error.message || "ไม่สามารถดึงข้อมูลประเภทการจ้างได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const type_code = body?.type_code?.trim();
    const type_name = body?.type_name?.trim();
    const status = body?.status || "active";

    if (!type_code || !type_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัสประเภทการจ้างและชื่อประเภทการจ้าง" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("employment_types")
      .select("id")
      .eq("type_code", type_code)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "รหัสประเภทการจ้างนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("employment_types")
      .insert([
        {
          type_code,
          type_name,
          status,
        },
      ])
      .select(`
        id,
        type_code,
        type_name,
        status,
        sort_order,
        created_at
      `)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "employment_types",
      action_type: "create",
      reference_table: "employment_types",
      reference_id: data.id,
      description: `เพิ่มประเภทการจ้าง ${data.type_code} - ${data.type_name}`,
      new_data: {
        type_code: data.type_code,
        type_name: data.type_name,
        status: data.status,
        sort_order: data.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลประเภทการจ้างสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("CREATE_EMPLOYMENT_TYPE_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถบันทึกข้อมูลประเภทการจ้างได้" },
      { status: 500 }
    );
  }
}