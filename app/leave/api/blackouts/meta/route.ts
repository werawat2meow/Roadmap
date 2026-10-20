import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  const [branches, departments, divisions, units] =
    await Promise.all([
      supabaseAdmin.from("branches").select("id, branch_name").order("branch_name"),
      supabaseAdmin.from("departments").select("id, department_name").order("department_name"),
      supabaseAdmin.from("divisions").select("id, division_name").order("division_name"),
      supabaseAdmin.from("units").select("id, unit_name").order("unit_name"),
    ]);

  const error =
    branches.error ||
    departments.error ||
    divisions.error ||
    units.error;

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      branches: branches.data || [],
      departments: departments.data || [],
      divisions: divisions.data || [],
      units: units.data || [],
    },
  });
}