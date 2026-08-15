import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  getRawAccessibleIds,
  requireScopedAccess,
  resolveAccessibleIds,
} from "@/lib/auth/requireScopedAccess";

const uniq = (values = []) => [
  ...new Set((values || []).filter(Boolean).map(String)),
];

export async function GET(req) {
  try {
    const guard = await requireScopedAccess(
      "ems.org_structure",
      "view",
      { lineageScope: true }
    );

    if (!guard.ok) {
      return guard.response;
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode")?.trim() || "masters";

    if (mode === "employees") {
      return loadEmployeeOptions(searchParams, guard);
    }

    return loadMasterOptions(guard);
  } catch (error) {
    console.error("GET_ORG_STRUCTURE_OPTIONS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถโหลดตัวเลือกโครงสร้างองค์กรได้",
      },
      { status: 500 }
    );
  }
}

async function loadMasterOptions(guard) {
  let branchIds = [];
  let departmentIds = [];
  let divisionIds = [];
  let unitIds = [];
  let directCompanyIds = [];
  let directBranchGroupIds = [];

  if (!guard.hasAllScope) {
    [branchIds, departmentIds, divisionIds, unitIds] = await Promise.all([
      resolveAccessibleIds(guard.access, "branch", {
        permission: guard.permission,
      }),
      resolveAccessibleIds(guard.access, "department", {
        permission: guard.permission,
      }),
      resolveAccessibleIds(guard.access, "division", {
        permission: guard.permission,
      }),
      resolveAccessibleIds(guard.access, "unit", {
        permission: guard.permission,
      }),
    ]);

    directCompanyIds = getRawAccessibleIds(
      guard.access,
      "company",
      guard.permission
    );

    directBranchGroupIds = getRawAccessibleIds(
      guard.access,
      "branch_group",
      guard.permission
    );
  }

  let branchQuery = supabaseAdmin
    .from("branches")
    .select(`
      id,
      company_id,
      group_id,
      branch_code,
      branch_name,
      status,
      sort_order
    `)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("branch_code", { ascending: true });

  if (!guard.hasAllScope) {
    if (!branchIds.length) {
      branchQuery = branchQuery.eq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );
    } else {
      branchQuery = branchQuery.in("id", branchIds);
    }
  }

  const { data: branches, error: branchError } = await branchQuery;
  if (branchError) throw branchError;

  const companyIds = uniq([
    ...directCompanyIds,
    ...(branches || []).map((item) => item.company_id),
  ]);

  const branchGroupIds = uniq([
    ...directBranchGroupIds,
    ...(branches || []).map((item) => item.group_id),
  ]);

  let companyQuery = supabaseAdmin
    .from("companies")
    .select(`
      id,
      company_code,
      company_name_th,
      company_name_en,
      status,
      sort_order
    `)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("company_code", { ascending: true });

  if (!guard.hasAllScope) {
    if (!companyIds.length) {
      companyQuery = companyQuery.eq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );
    } else {
      companyQuery = companyQuery.in("id", companyIds);
    }
  }

  let groupQuery = supabaseAdmin
    .from("branch_groups")
    .select(`
      id,
      group_code,
      group_name,
      group_color,
      status,
      sort_order
    `)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("group_code", { ascending: true });

  if (!guard.hasAllScope) {
    if (!branchGroupIds.length) {
      groupQuery = groupQuery.eq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );
    } else {
      groupQuery = groupQuery.in("id", branchGroupIds);
    }
  }

  let departmentQuery = supabaseAdmin
    .from("departments")
    .select(`
      id,
      department_code,
      department_name,
      status,
      sort_order
    `)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("department_code", { ascending: true });

  if (!guard.hasAllScope) {
    if (!departmentIds.length) {
      departmentQuery = departmentQuery.eq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );
    } else {
      departmentQuery = departmentQuery.in("id", departmentIds);
    }
  }

  let divisionQuery = supabaseAdmin
    .from("divisions")
    .select(`
      id,
      department_id,
      division_code,
      division_name,
      status,
      sort_order
    `)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("division_code", { ascending: true });

  if (!guard.hasAllScope) {
    if (!divisionIds.length) {
      divisionQuery = divisionQuery.eq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );
    } else {
      divisionQuery = divisionQuery.in("id", divisionIds);
    }
  }

  let unitQuery = supabaseAdmin
    .from("units")
    .select(`
      id,
      division_id,
      unit_code,
      unit_name,
      status,
      sort_order
    `)
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("unit_code", { ascending: true });

  if (!guard.hasAllScope) {
    if (!unitIds.length) {
      unitQuery = unitQuery.eq(
        "id",
        "00000000-0000-0000-0000-000000000000"
      );
    } else {
      unitQuery = unitQuery.in("id", unitIds);
    }
  }

  const [
    companyResult,
    groupResult,
    departmentResult,
    divisionResult,
    unitResult,
    positionResult,
  ] = await Promise.all([
    companyQuery,
    groupQuery,
    departmentQuery,
    divisionQuery,
    unitQuery,
    supabaseAdmin
      .from("positions")
      .select(`
        id,
        position_code,
        position_name,
        status,
        sort_order
      `)
      .eq("status", "active")
      .order("sort_order", { ascending: true })
      .order("position_code", { ascending: true }),
  ]);

  for (const result of [
    companyResult,
    groupResult,
    departmentResult,
    divisionResult,
    unitResult,
    positionResult,
  ]) {
    if (result.error) throw result.error;
  }

  let branchDepartmentRows = [];

  if (guard.hasAllScope || (branchIds.length && departmentIds.length)) {
    let branchDepartmentQuery = supabaseAdmin
      .from("branch_departments")
      .select(`
        id,
        branch_id,
        department_id,
        status
      `)
      .eq("status", "active");

    if (!guard.hasAllScope) {
      branchDepartmentQuery = branchDepartmentQuery
        .in("branch_id", branchIds)
        .in("department_id", departmentIds);
    }

    const { data, error } = await branchDepartmentQuery;
    if (error) throw error;
    branchDepartmentRows = data || [];
  }

  return NextResponse.json({
    success: true,
    data: {
      companies: companyResult.data || [],
      branch_groups: groupResult.data || [],
      branches: branches || [],
      branch_departments: branchDepartmentRows,
      departments: departmentResult.data || [],
      divisions: divisionResult.data || [],
      units: unitResult.data || [],
      positions: positionResult.data || [],
      employees: [],
    },
  });
}

async function loadEmployeeOptions(searchParams, guard) {
  const search = cleanSearch(searchParams.get("search"));
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") || 50), 1),
    100
  );

  const filters = {
    company_id: searchParams.get("company_id")?.trim() || "",
    branch_group_id: searchParams.get("branch_group_id")?.trim() || "",
    branch_id: searchParams.get("branch_id")?.trim() || "",
    department_id: searchParams.get("department_id")?.trim() || "",
    division_id: searchParams.get("division_id")?.trim() || "",
    unit_id: searchParams.get("unit_id")?.trim() || "",
    position_id: searchParams.get("position_id")?.trim() || "",
  };

  let query = supabaseAdmin
    .from("employees")
    .select(`
      id,
      employee_code,
      first_name_th,
      last_name_th,
      first_name_en,
      last_name_en,
      employee_photo_url,
      company_id,
      branch_group_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      status
    `)
    .eq("status", "active")
    .order("employee_code", { ascending: true })
    .limit(limit);

  query = guard.applyEmployeeScope(query);

  Object.entries(filters).forEach(([column, value]) => {
    if (value) query = query.eq(column, value);
  });

  if (search) {
    query = query.or(
      [
        `employee_code.ilike.%${search}%`,
        `first_name_th.ilike.%${search}%`,
        `last_name_th.ilike.%${search}%`,
        `first_name_en.ilike.%${search}%`,
        `last_name_en.ilike.%${search}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: {
      employees: data || [],
    },
  });
}

function cleanSearch(value) {
  return String(value || "")
    .trim()
    .replace(/[(),]/g, " ")
    .slice(0, 100);
}


/**
 * 
 * 
 *    อยู่ในตารางนี้  สร้างหน้า Org-structure 
 * 
 * 
 * 
 * 
 * 
 * 
 *  */