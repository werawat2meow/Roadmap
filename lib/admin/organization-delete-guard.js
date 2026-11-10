import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const dependencies = {
  branch: [{ table: "branch_departments", field: "branch_id", label: "แผนก" }, { table: "employees", field: "branch_id", label: "พนักงาน" }],
  department: [{ table: "divisions", field: "department_id", label: "ฝ่าย" }, { table: "employees", field: "department_id", label: "พนักงาน" }],
  division: [{ table: "units", field: "division_id", label: "หน่วย" }, { table: "employees", field: "division_id", label: "พนักงาน" }],
  unit: [{ table: "employees", field: "unit_id", label: "พนักงาน" }],
};

export async function blockOrganizationDeleteWhenInUse(level, id) {
  for (const dependency of dependencies[level] || []) {
    const { data, error } = await supabaseAdmin
      .from(dependency.table)
      .select("id")
      .eq(dependency.field, id)
      .limit(1);
    if (error) throw error;
    if (data?.length) {
      return NextResponse.json({ success: false, error: `ลบไม่ได้ เพราะยังมี${dependency.label}ที่ใช้งานรายการนี้อยู่ กรุณาจัดการ${dependency.label}ก่อน` }, { status: 409 });
    }
  }
  return null;
}
