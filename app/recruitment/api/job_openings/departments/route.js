import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const branchId = searchParams.get("branch_id");
  const q = searchParams.get("q") || "";

  let query = supabaseAdmin
    .from("recruit_job_description")
    .select(`
      department_id,
      departments!inner (
        id,
        department_name,
        status,
        branch_departments!inner (
          branch_id
        )
      )
    `)
    .eq("departments.status", "active")
    .eq("departments.branch_departments.branch_id", branchId);

  if (q) {
    query = query.ilike(
      "departments.department_name",
      `%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // ป้องกันข้อมูล department ซ้ำ
  const uniqueDepartments = new Map();

  (data || []).forEach((row) => {
    const department = row.departments;

    if (department && !uniqueDepartments.has(department.id)) {
      uniqueDepartments.set(department.id, {
        id: department.id,
        label: department.department_name,
      });
    }
  });

  return NextResponse.json(
    Array.from(uniqueDepartments.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  );
}