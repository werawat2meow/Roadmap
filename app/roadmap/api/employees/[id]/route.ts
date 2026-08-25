import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("employees")
    .select(
      `
    id,
    employee_code,
    email,
    first_name_th,
    last_name_th,
    first_name_en,
    last_name_en,
    nick_name,
    status,
    hire_date,
    employee_photo_url,
    branch_id,
    department_id,
    division_id,
    unit_id,
    branches(branch_name),
    departments(department_name),
    divisions(division_name),
    units(unit_name),
    positions(
      position_name,
      position_level_mappings(
        position_levels(
          level_name,
          level_code
        )
      )
    )
  `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 },
    );
  }

  const emp = data as any;
  const { data: compensationData, error: compensationError } =
    await supabaseAdmin
      .from("employee_compensations")
      .select("base_salary")
      .eq("employee_id", id)
      .eq("status", "active")
      .order("effective_from", { ascending: false })
      .limit(1);

  if (compensationError) {
    return NextResponse.json(
      { success: false, error: compensationError.message },
      { status: 500 },
    );
  }

  const currentSalary =
    compensationData?.[0]?.base_salary !== undefined
      ? Number(compensationData[0].base_salary)
      : 0;
  const positionLevel =
    emp.positions?.position_level_mappings?.find(
      (mapping: any) => mapping?.is_default,
    )?.position_levels ||
    emp.positions?.position_level_mappings?.[0]?.position_levels;

  // const level = positionLevel?.level_code || positionLevel?.level_name || "";

  return NextResponse.json({
    success: true,
    data: {
      id: emp.id,
      employeeCode: emp.employee_code,
      email: emp.email ?? "",
      name: `${emp.first_name_th || ""} ${emp.last_name_th || ""}`.trim(),
      firstNameEn: emp.first_name_en || "",
      lastNameEn: emp.last_name_en || "",
      nickName: emp.nick_name || "",
      avatar:
        emp.employee_photo_url ||
        (emp.nick_name
          ? emp.nick_name.slice(0, 2).toUpperCase()
          : emp.first_name_th?.slice(0, 2)),
      branch: emp.branches?.branch_name || "",
      branchId: emp.branch_id || "",
      department: emp.departments?.department_name || "",
      departmentId: emp.department_id || "",
      division: emp.divisions?.division_name || "",
      divisionId: emp.division_id || "",
      unit: emp.units?.unit_name || "",
      unitId: emp.unit_id || "",
      role: emp.positions?.position_name || "",
      currentSalary,
      level: positionLevel?.level_code || "",
      status: emp.status || "Active",
      hireDate: emp.hire_date || null,
    },
  });
}
