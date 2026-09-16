import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

import {
  createActionGuard,
  jsonError,
} from "../_helpers";

async function loadScopedMaster({
  table,
  select,
  scopeType,
  orderBy,
  statusColumn = "status",
}) {
  const guard = await createActionGuard("view", scopeType);
  if (!guard.ok) {
    return { response: guard.response, data: null };
  }

  let query = supabaseAdmin
    .from(table)
    .select(select)
    .limit(5000);

  if (statusColumn) {
    query = query.eq(statusColumn, "active");
  }

  query = guard.applyScope(query, "id");

  if (orderBy) {
    query = query.order(orderBy, { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw error;

  return { response: null, data: data || [] };
}

export async function GET() {
  try {
    const pageGuard = await createActionGuard("view", "employee");
    if (!pageGuard.ok) return pageGuard.response;

    const [
      companiesResult,
      groupsResult,
      branchesResult,
      departmentsResult,
      divisionsResult,
      unitsResult,
    ] = await Promise.all([
      loadScopedMaster({
        table: "companies",
        select: "id, company_code, company_name_th, company_name_en, status, sort_order",
        scopeType: "company",
        orderBy: "sort_order",
      }),
      loadScopedMaster({
        table: "branch_groups",
        select: "id, group_code, group_name, group_color, status, sort_order",
        scopeType: "branch_group",
        orderBy: "sort_order",
      }),
      loadScopedMaster({
        table: "branches",
        select: "id, company_id, group_id, branch_code, branch_name, status, sort_order",
        scopeType: "branch",
        orderBy: "sort_order",
      }),
      loadScopedMaster({
        table: "departments",
        select: "id, department_code, department_name, status, sort_order",
        scopeType: "department",
        orderBy: "sort_order",
      }),
      loadScopedMaster({
        table: "divisions",
        select: "id, department_id, division_code, division_name, status, sort_order",
        scopeType: "division",
        orderBy: "sort_order",
      }),
      loadScopedMaster({
        table: "units",
        select: "id, division_id, unit_code, unit_name, status, sort_order",
        scopeType: "unit",
        orderBy: "sort_order",
      }),
    ]);

    const scopedResults = [
      companiesResult,
      groupsResult,
      branchesResult,
      departmentsResult,
      divisionsResult,
      unitsResult,
    ];

    const denied = scopedResults.find((item) => item.response);
    if (denied) return denied.response;

    const branches = branchesResult.data || [];
    const departments = departmentsResult.data || [];

    let branchDepartments = [];

    if (branches.length && departments.length) {
      const branchIds = branches.map((item) => item.id);
      const departmentIds = departments.map((item) => item.id);

      const { data, error } = await supabaseAdmin
        .from("branch_departments")
        .select("id, branch_id, department_id, status")
        .in("branch_id", branchIds)
        .in("department_id", departmentIds)
        .eq("status", "active")
        .limit(5000);

      if (error) throw error;
      branchDepartments = data || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        companies: companiesResult.data,
        branchGroups: groupsResult.data,
        branches,
        departments,
        branchDepartments,
        divisions: divisionsResult.data,
        units: unitsResult.data,
      },
    });
  } catch (error) {
    console.error("EMPLOYEE_BUSINESS_STRUCTURE_OPTIONS_ERROR:", error);
    return jsonError(
      error?.message || "ไม่สามารถโหลดข้อมูลตัวเลือกโครงสร้างบริหารได้",
      500
    );
  }
}
