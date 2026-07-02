import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("branch_groups")
      .select(`
        id,
        group_code,
        group_name,
        group_color,
        sort_order,
        status,
        created_at,
        updated_at
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const filteredData = search
      ? (data || []).filter((item) => {
          return (
            item.group_code?.toLowerCase().includes(search) ||
            item.group_name?.toLowerCase().includes(search) ||
            item.status?.toLowerCase().includes(search)
          );
        })
      : data || [];

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_BRANCH_GROUPS_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลกลุ่มสังกัดได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const group_code = body?.group_code?.trim()?.toUpperCase();
    const group_name = body?.group_name?.trim();
    const group_color = body?.group_color?.trim() || "#E2E8F0";
    const sort_order = Number(body?.sort_order || 0);
    const status = body?.status || "active";

    if (!group_code || !group_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสกลุ่มและชื่อกลุ่มสังกัด" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("branch_groups")
      .insert([
        {
          group_code,
          group_name,
          group_color,
          sort_order,
          status,
        },
      ])
      .select(`
        id,
        group_code,
        group_name,
        group_color,
        sort_order,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "รหัสกลุ่มสังกัดนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }

      throw error;
    }

    await writeActivityLog({
      module_name: "branch_groups",
      action_type: "create",
      reference_table: "branch_groups",
      reference_id: data.id,
      description: `เพิ่มกลุ่มสังกัด ${data.group_code} - ${data.group_name}`,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มกลุ่มสังกัดสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("CREATE_BRANCH_GROUP_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลกลุ่มสังกัดได้" },
      { status: 500 }
    );
  }
}