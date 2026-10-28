import { NextResponse } from "next/server";

import { mergeLookupParents } from "@/app/recruitment/lib/reportApproveEmp.mjs";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const [
      companiesResult,
      branchesResult,
      branchDepartmentsResult,
      divisionsResult,
      unitsResult,
      unitPositionsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select("id, company_name_th")
        .order("company_name_th", { ascending: true }),
      supabaseAdmin
        .from("branches")
        .select("id, branch_name, company_id")
        .order("branch_name", { ascending: true }),
      supabaseAdmin.from("branch_departments").select(`
        branch_id,
        department_id,
        departments (id, department_name)
      `),
      supabaseAdmin
        .from("divisions")
        .select("id, division_name, department_id")
        .order("division_name", { ascending: true }),
      supabaseAdmin
        .from("units")
        .select("id, unit_name, division_id")
        .order("unit_name", { ascending: true }),
      supabaseAdmin.from("unit_positions").select(`
        unit_id,
        position_id,
        positions (id, position_name)
      `),
    ]);

    const error = [
      companiesResult.error,
      branchesResult.error,
      branchDepartmentsResult.error,
      divisionsResult.error,
      unitsResult.error,
      unitPositionsResult.error,
    ].find(Boolean);
    if (error) throw error;

    const departments = mergeLookupParents(
      branchDepartmentsResult.data,
      "departments",
      "branch_id",
      "branch_ids",
    );
    const positions = mergeLookupParents(
      unitPositionsResult.data,
      "positions",
      "unit_id",
      "unit_ids",
    );

    return NextResponse.json({
      success: true,
      data: {
        companies: companiesResult.data || [],
        branches: branchesResult.data || [],
        departments,
        divisions: divisionsResult.data || [],
        units: unitsResult.data || [],
        positions,
      },
    });
  } catch (error) {
    console.error("Approved employee report filters error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "ไม่สามารถโหลดตัวกรองรายงานได้",
      },
      { status: 500 },
    );
  }
}
