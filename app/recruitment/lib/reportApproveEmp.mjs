export const APPROVED_EMPLOYEE_REPORT_FILTER_FIELDS = [
  "company_id",
  "branch_id",
  "department_id",
  "division_id",
  "unit_id",
  "position_id",
];

export function readApprovedEmployeeReportFilters(searchParams) {
  return Object.fromEntries(
    APPROVED_EMPLOYEE_REPORT_FILTER_FIELDS.flatMap((field) => {
      const value = (searchParams.get(field) || "").trim();
      return value ? [[field, value]] : [];
    }),
  );
}

export function applyApprovedEmployeeReportFilters(query, filters) {
  return APPROVED_EMPLOYEE_REPORT_FILTER_FIELDS.reduce(
    (currentQuery, field) =>
      filters[field] ? currentQuery.eq(field, filters[field]) : currentQuery,
    query,
  );
}

export function mergeLookupParents(rows, lookupField, parentField, outputField) {
  const merged = new Map();

  for (const row of rows || []) {
    const item = row?.[lookupField];
    const parentId = row?.[parentField];
    if (!item?.id || !parentId) continue;

    const key = String(item.id);
    const current = merged.get(key) || { ...item, [outputField]: [] };
    if (!current[outputField].includes(parentId)) {
      current[outputField].push(parentId);
    }
    merged.set(key, current);
  }

  return [...merged.values()];
}
