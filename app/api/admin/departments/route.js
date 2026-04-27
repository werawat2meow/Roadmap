import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("departments")
      .select(`
        id,
        department_code,
        department_name,
        status,
        sort_order,
        created_at,
        branch_departments (
          branch_id,
          branches (
            id,
            branch_code,
            branch_name
          )
        )
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mappedData = (data || []).map((department) => {
      const branchRows = department.branch_departments || [];

      return {
        id: department.id,
        department_code: department.department_code,
        department_name: department.department_name,
        branch_ids: branchRows.map((row) => row.branch_id),
        branch_names: branchRows
          .map((row) => row.branches?.branch_name)
          .filter(Boolean),
        branch_codes: branchRows
          .map((row) => row.branches?.branch_code)
          .filter(Boolean),
        status: department.status,
        sort_order: department.sort_order,
        created_at: department.created_at,
      };
    });

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
            item.department_code?.toLowerCase().includes(search) ||
            item.department_name?.toLowerCase().includes(search) ||
            item.branch_names?.some((name) =>
              name?.toLowerCase().includes(search)
            ) ||
            item.branch_codes?.some((code) =>
              code?.toLowerCase().includes(search)
            )
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error("GET_DEPARTMENTS_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลแผนกได้" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const department_code = body?.department_code?.trim();
    const department_name = body?.department_name?.trim();
    const branch_ids = Array.isArray(body?.branch_ids) ? body.branch_ids : [];
    const status = body?.status || "active";

    if (!department_code || !department_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสแผนกและชื่อแผนก" },
        { status: 400 }
      );
    }

    if (!branch_ids.length) {
      return NextResponse.json(
        { error: "กรุณาเลือกสาขาอย่างน้อย 1 รายการ" },
        { status: 400 }
      );
    }

    const { data: existingDepartment } = await supabaseAdmin
      .from("departments")
      .select("id")
      .eq("department_code", department_code)
      .maybeSingle();

    if (existingDepartment) {
      return NextResponse.json(
        { error: "รหัสแผนกนี้มีอยู่แล้ว" },
        { status: 400 }
      );
    }

    const { data: department, error: departmentError } = await supabaseAdmin
      .from("departments")
      .insert([
        {
          department_code,
          department_name,
          status,
        },
      ])
      .select(`
        id,
        department_code,
        department_name,
        status,
        sort_order,
        created_at
      `)
      .single();

    if (departmentError) throw departmentError;

    const branchDepartmentPayload = branch_ids.map((branch_id) => ({
      branch_id,
      department_id: department.id,
      status: "active",
    }));

    const { error: relationError } = await supabaseAdmin
      .from("branch_departments")
      .insert(branchDepartmentPayload);

    if (relationError) throw relationError;

    const { data: fullDepartment, error: fetchError } = await supabaseAdmin
      .from("departments")
      .select(`
        id,
        department_code,
        department_name,
        status,
        sort_order,
        created_at,
        branch_departments (
          branch_id,
          branches (
            id,
            branch_code,
            branch_name
          )
        )
      `)
      .eq("id", department.id)
      .single();

    if (fetchError) throw fetchError;
    const branchRows = fullDepartment.branch_departments || [];
    
    await writeActivityLog({
      module_name: "departments",
      action_type: "create",
      reference_table: "departments",
      reference_id: fullDepartment.id,
      description: `เพิ่มแผนก ${fullDepartment.department_code} - ${fullDepartment.department_name}`,
      new_data: {
        department_code: fullDepartment.department_code,
        department_name: fullDepartment.department_name,
        status: fullDepartment.status,
        branch_ids: branchRows.map((row) => row.branch_id),
        branch_codes: branchRows
          .map((row) => row.branches?.branch_code)
          .filter(Boolean),
        branch_names: branchRows
          .map((row) => row.branches?.branch_name)
          .filter(Boolean),
      },
    });


    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลแผนกสำเร็จ",
      data: {
        id: fullDepartment.id,
        department_code: fullDepartment.department_code,
        department_name: fullDepartment.department_name,
        branch_ids: branchRows.map((row) => row.branch_id),
        branch_names: branchRows
          .map((row) => row.branches?.branch_name)
          .filter(Boolean),
        branch_codes: branchRows
          .map((row) => row.branches?.branch_code)
          .filter(Boolean),
        status: fullDepartment.status,
        sort_order: fullDepartment.sort_order,
        created_at: fullDepartment.created_at,
      },
    });
  } catch (error) {
    console.error("CREATE_DEPARTMENT_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถบันทึกข้อมูลแผนกได้" },
      { status: 500 }
    );
  }
}