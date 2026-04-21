import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const { data, error } = await supabaseAdmin
      .from("branches")
      .select(`
        id,
        branch_code,
        branch_name,
        company_id,
        phone,
        status,
        sort_order,
        created_at,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedData = (data || []).map((branch) => ({
      id: branch.id,
      branch_code: branch.branch_code,
      branch_name: branch.branch_name,
      company_id: branch.company_id,
      company_name:
        branch.companies?.company_name_th ||
        branch.companies?.company_name_en ||
        "-",
      company_code: branch.companies?.company_code || "",
      phone: branch.phone,
      status: branch.status,
      sort_order: branch.sort_order,
      created_at: branch.created_at,
    }));

    const filteredData = search ? mappedData.filter((item) => {
          const keyword = search.toLowerCase();
          return (
            item.branch_code?.toLowerCase().includes(keyword) ||
            item.branch_name?.toLowerCase().includes(keyword) ||
            item.company_name?.toLowerCase().includes(keyword) ||
            item.company_code?.toLowerCase().includes(keyword)
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_BRANCHES_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลสังกัดได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const branch_code = body?.branch_code?.trim();
    const branch_name = body?.branch_name?.trim();
    const company_id = body?.company_id || null;
    const phone = body?.phone?.trim() || null;
    const status = body?.status || "active";

    if (!branch_code || !branch_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสสังกัดและชื่อสังกัด" },
        { status: 400 }
      );
    }

    if (!company_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกบริษัท" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("branches")
      .insert([
        {
          branch_code,
          branch_name,
          company_id,
          phone,
          status,
        },
      ])
      .select(`
        id,
        branch_code,
        branch_name,
        company_id,
        phone,
        status,
        sort_order,
        created_at,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "รหัสสังกัดนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }

      throw error;
    }

    await writeActivityLog({
      module_name: "branches",
      action_type: "create",
      reference_table: "branches",
      reference_id: data.id,
      description: `เพิ่มสังกัด ${data.branch_code} - ${data.branch_name}`,
      new_data: {
        branch_code: data.branch_code,
        branch_name: data.branch_name,
        company_id: data.company_id,
        company_code: data.companies?.company_code || "",
        company_name:
          data.companies?.company_name_th ||
          data.companies?.company_name_en ||
          "",
        phone: data.phone,
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มสังกัดสำเร็จ",
      data: {
        id: data.id,
        branch_code: data.branch_code,
        branch_name: data.branch_name,
        company_id: data.company_id,
        company_name:
          data.companies?.company_name_th ||
          data.companies?.company_name_en ||
          "-",
        company_code: data.companies?.company_code || "",
        phone: data.phone,
        status: data.status,
        sort_order: data.sort_order,
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("CREATE_BRANCH_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลสังกัดได้" },
      { status: 500 }
    );
  }
}