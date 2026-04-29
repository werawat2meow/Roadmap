import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const all = searchParams.get("all") === "true";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("divisions")
      .select(
        `
          id,
          division_code,
          division_name,
          department_id,
          status,
          sort_order,
          created_at,
          departments (
            department_name
          )
        `,
        { count: "exact" }
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (search) {
      const keyword = `%${search}%`;

      const { data: departmentRows, error: departmentError } =
        await supabaseAdmin
          .from("departments")
          .select("id")
          .ilike("department_name", keyword);

      if (departmentError) throw departmentError;

      const departmentIds = (departmentRows || []).map((item) => item.id);

      const orConditions = [
        `division_code.ilike.${keyword}`,
        `division_name.ilike.${keyword}`,
      ];

      if (departmentIds.length > 0) {
        orConditions.push(`department_id.in.(${departmentIds.join(",")})`);
      }

      query = query.or(orConditions.join(","));
    }

    if (!all) {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const mappedData = (data || []).map((division) => ({
      id: division.id,
      division_code: division.division_code,
      division_name: division.division_name,
      department_id: division.department_id,
      department_name: division.departments?.department_name || "-",
      status: division.status,
      sort_order: division.sort_order,
      created_at: division.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: mappedData,
      pagination: all
        ? undefined
        : {
            page,
            pageSize,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pageSize),
          },
    });
  } catch (error) {
    console.error("GET_DIVISIONS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: "ไม่สามารถดึงข้อมูลฝ่ายได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const division_code = body?.division_code?.trim();
    const division_name = body?.division_name?.trim();
    const department_id = body?.department_id || null;
    const status = body?.status || "active";

    if (!division_code || !division_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสฝ่ายและชื่อฝ่าย" },
        { status: 400 }
      );
    }

    if (!department_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกแผนก" },
        { status: 400 }
      );
    }

    const { data: existingDivision } = await supabaseAdmin
      .from("divisions")
      .select("id")
      .eq("division_code", division_code)
      .maybeSingle();

    if (existingDivision) {
      return NextResponse.json(
        { error: "รหัสฝ่ายนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: division, error: insertError } = await supabaseAdmin
      .from("divisions")
      .insert([
        {
          division_code,
          division_name,
          department_id,
          status,
        },
      ])
      .select(`
        id,
        division_code,
        division_name,
        department_id,
        status,
        sort_order,
        created_at,
        departments (
          department_name
        )
      `)
      .single();

    if (insertError) throw insertError;

    await writeActivityLog({
      module_name: "divisions",
      action_type: "create",
      reference_table: "divisions",
      reference_id: division.id,
      description: `เพิ่มฝ่าย ${division.division_code} - ${division.division_name}`,
      new_data: {
        division_code: division.division_code,
        division_name: division.division_name,
        department_id: division.department_id,
        department_name: division.departments?.department_name || "",
        status: division.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลฝ่ายสำเร็จ",
      data: {
        id: division.id,
        division_code: division.division_code,
        division_name: division.division_name,
        department_id: division.department_id,
        department_name: division.departments?.department_name || "-",
        status: division.status,
        sort_order: division.sort_order,
        created_at: division.created_at,
      },
    });
  } catch (error) {
    console.error("CREATE_DIVISION_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลฝ่ายได้" },
      { status: 500 }
    );
  }
}