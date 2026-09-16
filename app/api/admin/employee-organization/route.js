import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const SUMMARY_CHUNK_SIZE = 1000;
const MAX_SUMMARY_ROWS = 20000;

const LIST_SELECT = `
  id,
  employee_code,

  first_name_th,
  middle_name_th,
  last_name_th,
  first_name_en,
  middle_name_en,
  last_name_en,
  nickname_th,
  nickname_en,
  employee_photo_url,

  company_id,
  branch_group_id,
  branch_id,
  department_id,
  division_id,
  unit_id,

  position_family_id,
  position_level_id,
  position_id,

  employment_type_id,
  employee_status_id,
  start_work_date,
  resignation_date,
  status,

  companies:companies!employees_company_id_fkey (
    id,
    company_code,
    company_name_th,
    company_name_en
  ),

  branch_groups:branch_groups!employees_branch_group_id_fkey (
    id,
    group_code,
    group_name,
    group_color
  ),

  branches:branches!employees_branch_id_fkey (
    id,
    branch_code,
    branch_name
  ),

  departments:departments!employees_department_id_fkey (
    id,
    department_code,
    department_name
  ),

  divisions:divisions!employees_division_id_fkey (
    id,
    division_code,
    division_name
  ),

  units:units!employees_unit_id_fkey (
    id,
    unit_code,
    unit_name
  ),

  position_families:position_families!employees_position_family_id_fkey (
    id,
    family_code,
    family_name
  ),

  position_levels:position_levels!employees_position_level_id_fkey (
    id,
    level_code,
    level_name
  ),

  positions:positions!employees_position_id_fkey (
    id,
    position_code,
    position_name
  ),

  employment_types:employment_types!employees_employment_type_id_fkey (
    id,
    type_code,
    type_name,
    status
  ),

  employee_statuses:employee_statuses!employees_employee_status_id_fkey (
    id,
    status_code,
    status_name,
    color,
    is_working,
    is_headcount,
    status
  )
`;

const SUMMARY_SELECT = LIST_SELECT;

function jsonSuccess(data, extra = {}) {
  return NextResponse.json({
    success: true,
    data,
    ...extra,
  });
}

function jsonError(message, status = 500, details = null) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function cleanSearch(value) {
  return cleanText(value)
    .replace(/[(),]/g, " ")
    .replace(/[%*]/g, "")
    .trim();
}

function nullableId(value) {
  const normalized = cleanText(value);
  return normalized || null;
}

function parseBoolean(value, fallback = false) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(
    String(value).trim().toLowerCase()
  );
}

function positiveInteger(value, fallback, max = null) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  const result = Math.max(Math.trunc(numberValue), 1);
  return max ? Math.min(result, max) : result;
}

function isUuid(value) {
  if (!value) return false;

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value).trim()
  );
}

function validateUuidFilters(filters) {
  const labels = {
    company_id: "บริษัท",
    branch_group_id: "กรุ๊ปสังกัด",
    branch_id: "สังกัด",
    department_id: "แผนก",
    division_id: "ฝ่าย",
    unit_id: "หน่วยงาน",
    position_level_id: "ระดับตำแหน่ง",
    position_id: "ตำแหน่ง",
    employment_type_id: "ประเภทการจ้าง",
    employee_status_id: "สถานะพนักงาน",
  };

  for (const [key, label] of Object.entries(labels)) {
    if (filters[key] && !isUuid(filters[key])) {
      return `${label} ไม่ถูกต้อง`;
    }
  }

  return null;
}

function applyFilters(query, filters) {
  let nextQuery = query;

  if (filters.search) {
    nextQuery = nextQuery.or(
      [
        `employee_code.ilike.%${filters.search}%`,
        `first_name_th.ilike.%${filters.search}%`,
        `middle_name_th.ilike.%${filters.search}%`,
        `last_name_th.ilike.%${filters.search}%`,
        `first_name_en.ilike.%${filters.search}%`,
        `middle_name_en.ilike.%${filters.search}%`,
        `last_name_en.ilike.%${filters.search}%`,
        `nickname_th.ilike.%${filters.search}%`,
        `nickname_en.ilike.%${filters.search}%`,
      ].join(",")
    );
  }

  const directFilters = [
    "company_id",
    "branch_group_id",
    "branch_id",
    "department_id",
    "division_id",
    "unit_id",
    "position_level_id",
    "position_id",
    "employment_type_id",
    "employee_status_id",
  ];

  for (const key of directFilters) {
    if (filters[key]) {
      nextQuery = nextQuery.eq(key, filters[key]);
    }
  }

  if (filters.status) {
    nextQuery = nextQuery.eq("status", filters.status);
  }

  return nextQuery;
}

function relationName(record, relation, codeKey, nameKeys) {
  const item = record?.[relation];

  if (!item) {
    return {
      code: "",
      name: "",
      label: "",
    };
  }

  const code = cleanText(item?.[codeKey]);
  const name = nameKeys
    .map((key) => cleanText(item?.[key]))
    .find(Boolean) || "";

  return {
    code,
    name,
    label: code && name ? `${code} - ${name}` : name || code,
  };
}

function getOrgNodeInfo(record, type) {
  switch (type) {
    case "company": {
      const value = relationName(
        record,
        "companies",
        "company_code",
        ["company_name_th", "company_name_en"]
      );

      return {
        id: record?.company_id || null,
        label: value.label || "ไม่ระบุบริษัท",
      };
    }

    case "branch_group": {
      const value = relationName(
        record,
        "branch_groups",
        "group_code",
        ["group_name"]
      );

      return {
        id: record?.branch_group_id || null,
        label: value.label || "ไม่ระบุกรุ๊ปสังกัด",
      };
    }

    case "branch": {
      const value = relationName(
        record,
        "branches",
        "branch_code",
        ["branch_name"]
      );

      return {
        id: record?.branch_id || null,
        label: value.label || "ไม่ระบุสังกัด",
      };
    }

    case "department": {
      const value = relationName(
        record,
        "departments",
        "department_code",
        ["department_name"]
      );

      return {
        id: record?.department_id || null,
        label: value.label || "ไม่ระบุแผนก",
      };
    }

    case "division": {
      const value = relationName(
        record,
        "divisions",
        "division_code",
        ["division_name"]
      );

      return {
        id: record?.division_id || null,
        label: value.label || "ไม่ระบุฝ่าย",
      };
    }

    case "unit": {
      const value = relationName(
        record,
        "units",
        "unit_code",
        ["unit_name"]
      );

      return {
        id: record?.unit_id || null,
        label: value.label || "ไม่ระบุหน่วยงาน",
      };
    }

    default:
      return {
        id: null,
        label: "-",
      };
  }
}

function buildOrganizationTree(rows) {
  const levels = [
    "company",
    "branch_group",
    "branch",
    "department",
    "division",
    "unit",
  ];

  const roots = [];
  const rootMap = new Map();

  const filterKeyByLevel = {
    company: "company_id",
    branch_group: "branch_group_id",
    branch: "branch_id",
    department: "department_id",
    division: "division_id",
    unit: "unit_id",
  };

  for (const row of rows) {
    let children = roots;
    let map = rootMap;
    let path = "root";
    const pathFilters = {};

    for (const level of levels) {
      const info = getOrgNodeInfo(row, level);
      const rawId = info.id || "none";
      const key = `${path}/${level}:${rawId}`;
      const filterKey = filterKeyByLevel[level];

      if (filterKey && info.id) {
        pathFilters[filterKey] = info.id;
      }

      let node = map.get(key);

      if (!node) {
        node = {
          key,
          type: level,
          id: info.id,
          title: info.label,
          filters: { ...pathFilters },
          count: 0,
          children: [],
          _childrenMap: new Map(),
        };

        map.set(key, node);
        children.push(node);
      }

      node.count += 1;
      children = node.children;
      map = node._childrenMap;
      path = key;
    }
  }

  const cleanNodes = (nodes) =>
    nodes
      .map((node) => ({
        key: node.key,
        type: node.type,
        id: node.id,
        title: node.title,
        filters: node.filters,
        count: node.count,
        children: cleanNodes(node.children),
      }))
      .sort((a, b) =>
        String(a.title || "").localeCompare(
          String(b.title || ""),
          "th"
        )
      );

  return cleanNodes(roots);
}

function buildSummary(rows) {
  const summary = {
    total: rows.length,
    working: 0,
    probation: 0,
    resigned: 0,
    inactive: 0,
    company_count: 0,
    branch_count: 0,
    department_count: 0,
    unit_count: 0,
  };

  const companyIds = new Set();
  const branchIds = new Set();
  const departmentIds = new Set();
  const unitIds = new Set();

  for (const row of rows) {
    const statusCode = cleanText(
      row?.employee_statuses?.status_code
    ).toUpperCase();

    if (row?.employee_statuses?.is_working === true) {
      summary.working += 1;
    }

    if (statusCode === "PROBATION") {
      summary.probation += 1;
    }

    if (statusCode === "RESIGNED") {
      summary.resigned += 1;
    }

    if (
      row?.employee_statuses?.is_working === false &&
      statusCode !== "RESIGNED"
    ) {
      summary.inactive += 1;
    }

    if (row?.company_id) companyIds.add(String(row.company_id));
    if (row?.branch_id) branchIds.add(String(row.branch_id));
    if (row?.department_id) departmentIds.add(String(row.department_id));
    if (row?.unit_id) unitIds.add(String(row.unit_id));
  }

  summary.company_count = companyIds.size;
  summary.branch_count = branchIds.size;
  summary.department_count = departmentIds.size;
  summary.unit_count = unitIds.size;

  return summary;
}

async function loadSummaryRows(guard, filters) {
  const rows = [];
  let offset = 0;
  let truncated = false;

  while (offset < MAX_SUMMARY_ROWS) {
    let query = supabaseAdmin
      .from("employees")
      .select(SUMMARY_SELECT)
      .order("employee_code", { ascending: true })
      .range(offset, offset + SUMMARY_CHUNK_SIZE - 1);

    query = guard.applyEmployeeScope(query);
    query = applyFilters(query, filters);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const chunk = Array.isArray(data) ? data : [];
    rows.push(...chunk);

    if (chunk.length < SUMMARY_CHUNK_SIZE) {
      break;
    }

    offset += SUMMARY_CHUNK_SIZE;
  }

  if (rows.length >= MAX_SUMMARY_ROWS) {
    truncated = true;
  }

  return {
    rows,
    truncated,
  };
}

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);

    const page = positiveInteger(
      searchParams.get("page"),
      DEFAULT_PAGE
    );

    const pageSize = positiveInteger(
      searchParams.get("pageSize"),
      DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE
    );

    const includeSummary = parseBoolean(
      searchParams.get("include_summary"),
      true
    );

    const filters = {
      search: cleanSearch(searchParams.get("search")),
      company_id: nullableId(searchParams.get("company_id")),
      branch_group_id: nullableId(
        searchParams.get("branch_group_id")
      ),
      branch_id: nullableId(searchParams.get("branch_id")),
      department_id: nullableId(searchParams.get("department_id")),
      division_id: nullableId(searchParams.get("division_id")),
      unit_id: nullableId(searchParams.get("unit_id")),
      position_level_id: nullableId(
        searchParams.get("position_level_id")
      ),
      position_id: nullableId(searchParams.get("position_id")),
      employment_type_id: nullableId(
        searchParams.get("employment_type_id")
      ),
      employee_status_id: nullableId(
        searchParams.get("employee_status_id")
      ),
      status: cleanText(searchParams.get("status")),
    };

    const filterError = validateUuidFilters(filters);

    if (filterError) {
      return jsonError(filterError, 400);
    }

    if (
      filters.status &&
      !["active", "inactive", "resigned"].includes(filters.status)
    ) {
      return jsonError("สถานะข้อมูลพนักงานไม่ถูกต้อง", 400);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let listQuery = supabaseAdmin
      .from("employees")
      .select(LIST_SELECT, { count: "exact" })
      .order("employee_code", { ascending: true })
      .range(from, to);

    listQuery = guard.applyEmployeeScope(listQuery);
    listQuery = applyFilters(listQuery, filters);

    const [listResult, summaryResult] = await Promise.all([
      listQuery,
      includeSummary
        ? loadSummaryRows(guard, filters)
        : Promise.resolve(null),
    ]);

    if (listResult.error) {
      throw listResult.error;
    }

    const summary = summaryResult
      ? buildSummary(summaryResult.rows)
      : null;

    const organizationTree = summaryResult
      ? buildOrganizationTree(summaryResult.rows)
      : null;

    const total = Number(listResult.count || 0);
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return jsonSuccess(listResult.data || [], {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      summary,
      organization_tree: organizationTree,
      meta: {
        summary_truncated: Boolean(summaryResult?.truncated),
        scope_mode: guard.hasAllScope ? "all" : "scoped",
      },
    });
  } catch (error) {
    console.error("GET /api/admin/employee-organization error:", error);

    return jsonError(
      "ไม่สามารถโหลดพนักงานตามโครงสร้างองค์กรได้",
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
