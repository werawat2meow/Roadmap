import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const NO_ACCESS_UUID =
  "00000000-0000-0000-0000-000000000000";

const SCOPE_CHUNK_SIZE = 1000;
const MAX_SCOPE_ROWS = 20000;

function success(data) {
  return NextResponse.json({
    success: true,
    data,
  });
}

function failure(message, status = 500, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

function uniqueIds(rows, key) {
  return [
    ...new Set(
      (rows || [])
        .map((row) => row?.[key])
        .filter(Boolean)
        .map(String)
    ),
  ];
}

function scopeQuery(query, ids, hasAllScope, column = "id") {
  if (hasAllScope) {
    return query;
  }

  if (!ids.length) {
    return query.eq(column, NO_ACCESS_UUID);
  }

  return query.in(column, ids);
}

async function loadScopedEmployeeOrganizationRows(guard) {
  if (guard.hasAllScope) {
    return [];
  }

  const rows = [];
  let offset = 0;

  while (offset < MAX_SCOPE_ROWS) {
    let query = supabaseAdmin
      .from("employees")
      .select(
        `
          id,
          company_id,
          branch_group_id,
          branch_id,
          department_id,
          division_id,
          unit_id
        `
      )
      .order("id", { ascending: true })
      .range(offset, offset + SCOPE_CHUNK_SIZE - 1);

    query = guard.applyEmployeeScope(query);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const chunk = Array.isArray(data) ? data : [];
    rows.push(...chunk);

    if (chunk.length < SCOPE_CHUNK_SIZE) {
      break;
    }

    offset += SCOPE_CHUNK_SIZE;
  }

  return rows;
}

export async function GET() {
  try {
    const guard = await requireScopedAccess(
      "ems.employee_organization",
      "view",
      {
        scopeType: "employee",
      }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const scopedRows = await loadScopedEmployeeOrganizationRows(guard);

    const companyIds = uniqueIds(scopedRows, "company_id");
    const branchGroupIds = uniqueIds(scopedRows, "branch_group_id");
    const branchIds = uniqueIds(scopedRows, "branch_id");
    const departmentIds = uniqueIds(scopedRows, "department_id");
    const divisionIds = uniqueIds(scopedRows, "division_id");
    const unitIds = uniqueIds(scopedRows, "unit_id");

    let companiesQuery = supabaseAdmin
      .from("companies")
      .select(
        "id,company_code,company_name_th,company_name_en,status,sort_order"
      )
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("company_code", { ascending: true });

    companiesQuery = scopeQuery(
      companiesQuery,
      companyIds,
      guard.hasAllScope
    );

    let branchGroupsQuery = supabaseAdmin
      .from("branch_groups")
      .select("id,group_code,group_name,group_color,status,sort_order")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("group_code", { ascending: true });

    branchGroupsQuery = scopeQuery(
      branchGroupsQuery,
      branchGroupIds,
      guard.hasAllScope
    );

    let branchesQuery = supabaseAdmin
      .from("branches")
      .select(
        "id,company_id,group_id,branch_code,branch_name,status,sort_order"
      )
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("branch_code", { ascending: true });

    branchesQuery = scopeQuery(
      branchesQuery,
      branchIds,
      guard.hasAllScope
    );

    let departmentsQuery = supabaseAdmin
      .from("departments")
      .select("id,department_code,department_name,status,sort_order")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("department_code", { ascending: true });

    departmentsQuery = scopeQuery(
      departmentsQuery,
      departmentIds,
      guard.hasAllScope
    );

    let divisionsQuery = supabaseAdmin
      .from("divisions")
      .select(
        "id,department_id,division_code,division_name,status,sort_order"
      )
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("division_code", { ascending: true });

    divisionsQuery = scopeQuery(
      divisionsQuery,
      divisionIds,
      guard.hasAllScope
    );

    let unitsQuery = supabaseAdmin
      .from("units")
      .select("id,division_id,unit_code,unit_name,status,sort_order")
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("unit_code", { ascending: true });

    unitsQuery = scopeQuery(
      unitsQuery,
      unitIds,
      guard.hasAllScope
    );

    let branchDepartmentsQuery = supabaseAdmin
      .from("branch_departments")
      .select("id,branch_id,department_id,status")
      .eq("status", "active");

    if (!guard.hasAllScope) {
      if (!branchIds.length || !departmentIds.length) {
        branchDepartmentsQuery = branchDepartmentsQuery.eq(
          "id",
          NO_ACCESS_UUID
        );
      } else {
        branchDepartmentsQuery = branchDepartmentsQuery
          .in("branch_id", branchIds)
          .in("department_id", departmentIds);
      }
    }

    const [
      companiesResult,
      branchGroupsResult,
      branchesResult,
      branchDepartmentsResult,
      departmentsResult,
      divisionsResult,
      unitsResult,
      positionLevelsResult,
      employmentTypesResult,
      employeeStatusesResult,
    ] = await Promise.all([
      companiesQuery,
      branchGroupsQuery,
      branchesQuery,
      branchDepartmentsQuery,
      departmentsQuery,
      divisionsQuery,
      unitsQuery,
      supabaseAdmin
        .from("position_levels")
        .select("id,level_code,level_name,status,sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("level_code", { ascending: true }),
      supabaseAdmin
        .from("employment_types")
        .select("id,type_code,type_name,status,sort_order")
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("type_code", { ascending: true }),
      supabaseAdmin
        .from("employee_statuses")
        .select(
          "id,status_code,status_name,color,is_working,is_headcount,status,sort_order"
        )
        .eq("status", "active")
        .order("sort_order", { ascending: true })
        .order("status_code", { ascending: true }),
    ]);

    const results = [
      companiesResult,
      branchGroupsResult,
      branchesResult,
      branchDepartmentsResult,
      departmentsResult,
      divisionsResult,
      unitsResult,
      positionLevelsResult,
      employmentTypesResult,
      employeeStatusesResult,
    ];

    const firstError = results.find((item) => item.error)?.error;

    if (firstError) {
      throw firstError;
    }

    return success({
      companies: companiesResult.data || [],
      branch_groups: branchGroupsResult.data || [],
      branches: branchesResult.data || [],
      branch_departments: branchDepartmentsResult.data || [],
      departments: departmentsResult.data || [],
      divisions: divisionsResult.data || [],
      units: unitsResult.data || [],
      position_levels: positionLevelsResult.data || [],
      employment_types: employmentTypesResult.data || [],
      employee_statuses: employeeStatusesResult.data || [],
    });
  } catch (error) {
    console.error(
      "GET /api/admin/employee-organization/options error:",
      error
    );

    return failure(
      "ไม่สามารถโหลดตัวเลือกพนักงานตามโครงสร้างองค์กรได้",
      500,
      {
        code: error?.code || null,
        message: error?.message || null,
        details: error?.details || null,
        hint: error?.hint || null,
      }
    );
  }
}
