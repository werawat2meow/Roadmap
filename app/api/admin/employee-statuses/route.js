import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   GET: list employee statuses
========================= */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("employee_statuses")
      .select(`
        id,
        status_code,
        status_name,
        color,
        sort_order,
        status,
        created_at
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedData = (data || []).map((item) => ({
      id: item.id,
      status_code: item.status_code,
      status_name: item.status_name,
      color: item.color,
      sort_order: item.sort_order,
      status: item.status,
      created_at: item.created_at,
    }));

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
            item.status_code?.toLowerCase().includes(search) ||
            item.status_name?.toLowerCase().includes(search) ||
            item.color?.toLowerCase().includes(search)
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_EMPLOYEE_STATUSES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถดึงข้อมูลสถานะพนักงานได้",
      },
      { status: 500 }
    );
  }
}

/* =========================
   POST: create employee status
========================= */
export async function POST(req) {
  try {
    const body = await req.json();

    const status_code = body?.status_code?.trim().toUpperCase();
    const status_name = body?.status_name?.trim();
    const color = body?.color || "green";
    const status = body?.status || "active";

    if (!status_code || !status_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสสถานะและชื่อสถานะพนักงาน",
        },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("employee_statuses")
      .select("id")
      .eq("status_code", status_code)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสสถานะพนักงานนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("employee_statuses")
      .insert([
        {
          status_code,
          status_name,
          color,
          status,
        },
      ])
      .select(`
        id,
        status_code,
        status_name,
        color,
        sort_order,
        status,
        created_at
      `)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "employee_statuses",
      action_type: "create",
      reference_table: "employee_statuses",
      reference_id: data.id,
      description: `เพิ่มสถานะพนักงาน ${data.status_code} - ${data.status_name}`,
      new_data: {
        status_code: data.status_code,
        status_name: data.status_name,
        color: data.color,
        status: data.status,
        sort_order: data.sort_order,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลสถานะพนักงานสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("CREATE_EMPLOYEE_STATUS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถบันทึกข้อมูลสถานะพนักงานได้",
      },
      { status: 500 }
    );
  }
}