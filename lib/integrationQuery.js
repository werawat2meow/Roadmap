import { supabaseAdmin } from "@/lib/supabaseServer";

export const INTEGRATION_MODULES = {
  branches: {
    table: "branches",
    select: `
      id,
      branch_code,
      branch_name,
      phone,
      status,
      created_at
    `,
    searchFields: ["branch_code", "branch_name", "phone"],
    allowedFilters: ["id", "branch_code", "status"],
    defaultOrder: "created_at",
  },

  departments: {
    table: "departments",
    select: `
      id,
      department_code,
      department_name,
      status,
      created_at
    `,
    searchFields: ["department_code", "department_name"],
    allowedFilters: ["id", "department_code", "status"],
    defaultOrder: "created_at",
  },

  positions: {
    table: "positions",
    select: `
      id,
      position_code,
      position_name,
      position_group,
      position_level,
      status,
      created_at
    `,
    searchFields: [
      "position_code",
      "position_name",
      "position_group",
      "position_level",
    ],
    allowedFilters: ["id", "position_code", "position_level", "status"],
    defaultOrder: "created_at",
  },
};

export function getPagination(page, limit) {
  const safePage = Math.max(Number(page || 1), 1);
  const safeLimit = Math.min(Math.max(Number(limit || 20), 1), 100);

  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;

  return { page: safePage, limit: safeLimit, from, to };
}

export function applyIntegrationFilters(query, config, filter = {}) {
  Object.entries(filter || {}).forEach(([key, value]) => {
    if (!config.allowedFilters.includes(key)) return;
    if (value === undefined || value === null || value === "") return;
    query = query.eq(key, value);
  });

  return query;
}

export function applyIntegrationSearch(query, config, search = "") {
  const keyword = search?.trim();

  if (!keyword || !config.searchFields?.length) return query;

  const orQuery = config.searchFields
    .map((field) => `${field}.ilike.%${keyword}%`)
    .join(",");

  return query.or(orQuery);
}

export async function runIntegrationList({
  module,
  search = "",
  filter = {},
  page = 1,
  limit = 20,
}) {
  const config = INTEGRATION_MODULES[module];

  if (!config) {
    return {
      success: false,
      statusCode: 400,
      error: "Invalid module",
    };
  }

  const paging = getPagination(page, limit);

  let query = supabaseAdmin
    .from(config.table)
    .select(config.select, { count: "exact" });

  query = applyIntegrationFilters(query, config, filter);
  query = applyIntegrationSearch(query, config, search);

  query = query
    .order(config.defaultOrder || "created_at", { ascending: false })
    .range(paging.from, paging.to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    success: true,
    module,
    pagination: {
      page: paging.page,
      limit: paging.limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / paging.limit),
    },
    data: data || [],
  };
}

export async function runIntegrationGet({ module, id, filter = {} }) {
  const config = INTEGRATION_MODULES[module];

  if (!config) {
    return {
      success: false,
      statusCode: 400,
      error: "Invalid module",
    };
  }

  let query = supabaseAdmin
    .from(config.table)
    .select(config.select);

  if (id) {
    query = query.eq("id", id);
  } else {
    query = applyIntegrationFilters(query, config, filter);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;

  return {
    success: true,
    module,
    data,
  };
}