import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select(`
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
      branch_id,
      department_id,
      division_id,
      unit_id,
      employee_photo_url,
      branches(branch_name),
      departments(department_name),
      divisions(division_name),
      units(unit_name),
      positions(
        position_name,
        position_level_mappings(
          position_levels(level_code)
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  const mapped = (data || []).map((item: any) => {
    const positionLevel =
      item.positions?.position_level_mappings?.find(
        (m: any) => m.position_levels,
      )?.position_levels?.level_code ||
      item.positions?.position_level_mappings?.[0]?.position_levels?.level_code ||
      "";

    return {
      id: item.id,
      employeeCode: item.employee_code,
      email: item.email ?? "",
      name: `${item.first_name_th || ""} ${item.last_name_th || ""}`.trim(),
      firstNameEn: item.first_name_en || "",
      lastNameEn: item.last_name_en || "",
      avatar:
        item.employee_photo_url ||
        (item.nick_name ? item.nick_name.slice(0, 2).toUpperCase() : ""),
      branch: item.branches?.branch_name || "",
      branchId: item.branch_id,
      department: item.departments?.department_name || "",
      departmentId: item.department_id,
      division: item.divisions?.division_name || "",
      divisionId: item.division_id,
      unit: item.units?.unit_name || "",
      unitId: item.unit_id,
      role: item.positions?.position_name || "",
      level: positionLevel,
      status: item.status || "Active",
      hireDate: item.hire_date || null,
    };
  });

  return NextResponse.json({ success: true, data: mapped });
}