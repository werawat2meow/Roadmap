import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

import { canAccessLineage } from "@/lib/workforce/unitPositionPlanning";

function uniqueById(items = []) {
  const map = new Map();

  for (const item of items) {
    if (!item?.id) continue;
    map.set(item.id, item);
  }

  return [...map.values()];
}

export async function GET() {
  try {
    const guard = await requireScopedAccess("ems.unit_positions", "view", {
      lineageScope: true,
    });

    const [
      companiesResult,
      groupsResult,
      branchesResult,
      mappingsResult,
      departmentsResult,
      divisionsResult,
      unitsResult,
      positionsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("companies")
        .select("id, company_code, company_name_th, company_name_en, status, sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("branch_groups")
        .select("id, group_code, group_name, group_color, status, sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("branches")
        .select("id, company_id, group_id, branch_code, branch_name, status, sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("branch_departments")
        .select("id, branch_id, department_id, status")
        .eq("status", "active"),

      supabaseAdmin
        .from("departments")
        .select("id, department_code, department_name, status, sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("divisions")
        .select("id, department_id, division_code, division_name, status, sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("units")
        .select("id, division_id, unit_code, unit_name, status, sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("positions")
        .select(`
          id,
          position_code,
          position_name,
          status,
          sort_order,
          position_level_mappings (
            is_default,
            sort_order,
            position_level:position_levels (
              id,
              level_code,
              level_name
            )
          )
        `)
        .eq("status", "active")
        .order("sort_order", { ascending: true }),
    ]);

    const results = [
      companiesResult,
      groupsResult,
      branchesResult,
      mappingsResult,
      departmentsResult,
      divisionsResult,
      unitsResult,
      positionsResult,
    ];

    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const companies = companiesResult.data || [];
    const branchGroups = groupsResult.data || [];
    const branches = branchesResult.data || [];
    const branchDepartments = mappingsResult.data || [];
    const departments = departmentsResult.data || [];
    const divisions = divisionsResult.data || [];
    const units = unitsResult.data || [];
    const positions = positionsResult.data || [];

    const branchMap = new Map(branches.map((item) => [item.id, item]));
    const departmentMap = new Map(departments.map((item) => [item.id, item]));

    const divisionsByDepartment = new Map();
    for (const division of divisions) {
      const list = divisionsByDepartment.get(division.department_id) || [];
      list.push(division);
      divisionsByDepartment.set(division.department_id, list);
    }

    const unitsByDivision = new Map();
    for (const unit of units) {
      const list = unitsByDivision.get(unit.division_id) || [];
      list.push(unit);
      unitsByDivision.set(unit.division_id, list);
    }

    const lineages = [];

    for (const mapping of branchDepartments) {
      const branch = branchMap.get(mapping.branch_id);
      const department = departmentMap.get(mapping.department_id);

      if (!branch || !department) continue;

      const departmentDivisions =
        divisionsByDepartment.get(department.id) || [];

      for (const division of departmentDivisions) {
        const divisionUnits = unitsByDivision.get(division.id) || [];

        for (const unit of divisionUnits) {
          const lineage = {
            company_id: branch.company_id,
            branch_group_id: branch.group_id || null,
            branch_id: branch.id,
            department_id: department.id,
            division_id: division.id,
            unit_id: unit.id,
          };

          if (!(await canAccessLineage(guard, lineage))) {
            continue;
          }

          lineages.push(lineage);
        }
      }
    }

    const allowed = {
      companyIds: new Set(lineages.map((item) => item.company_id).filter(Boolean)),
      groupIds: new Set(
        lineages.map((item) => item.branch_group_id).filter(Boolean)
      ),
      branchIds: new Set(lineages.map((item) => item.branch_id).filter(Boolean)),
      departmentIds: new Set(
        lineages.map((item) => item.department_id).filter(Boolean)
      ),
      divisionIds: new Set(
        lineages.map((item) => item.division_id).filter(Boolean)
      ),
      unitIds: new Set(lineages.map((item) => item.unit_id).filter(Boolean)),
    };

    return NextResponse.json({
      success: true,
      data: {
        lineages,
        companies: uniqueById(
          companies.filter((item) => allowed.companyIds.has(item.id))
        ),
        branch_groups: uniqueById(
          branchGroups.filter((item) => allowed.groupIds.has(item.id))
        ),
        branches: uniqueById(
          branches.filter((item) => allowed.branchIds.has(item.id))
        ),
        branch_departments: branchDepartments.filter(
          (item) =>
            allowed.branchIds.has(item.branch_id) &&
            allowed.departmentIds.has(item.department_id)
        ),
        departments: uniqueById(
          departments.filter((item) => allowed.departmentIds.has(item.id))
        ),
        divisions: uniqueById(
          divisions.filter((item) => allowed.divisionIds.has(item.id))
        ),
        units: uniqueById(units.filter((item) => allowed.unitIds.has(item.id))),
        positions,
      },
    });
  } catch (error) {
    console.error("GET_UNIT_POSITION_OPTIONS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถโหลดตัวเลือก Workforce Planning ได้",
      },
      { status: error?.status || 500 }
    );
  }
}
