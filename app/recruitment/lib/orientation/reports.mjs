const photoTypes = ["orientation", "site_visit", "handover"];

export function employeeGroupLabel(rows, sessionId) {
  const names = [...new Set(rows
    .filter((row) => row.session_id === sessionId)
    .map((row) => row.group_name?.trim())
    .filter(Boolean))];
  return names.length ? names.join(" & ") : "-";
}

export function tablePages(rows) {
  return [...new Set(rows.map((row) => row.orientation_date))].sort().flatMap((date) => {
    const items = rows.filter((row) => row.orientation_date === date);
    return Array.from({ length: Math.ceil(items.length / 25) }, (_, page) => ({
      date, page: page + 1, rows: items.slice(page * 25, (page + 1) * 25),
    }));
  });
}

export function activityPages(rows) {
  if (!rows.length) return [];
  const sessions = [...new Map(rows.map((row) => [row.session_id, row])).values()];
  const photos = [...new Map(rows.flatMap((row) => (row.photos || []).map((photo) => [photo.id, { ...photo, application_id: row.application_id, employee_id: row.employee_id, session_name: row.session_name, orientation_date: row.orientation_date, location_name: row.location_name }]))).values()];
  const dates = [...new Set(rows.map((row) => row.orientation_date))];
  return [{
    date: dates.length === 1 ? dates[0] : null, page: 1, sessions, rows,
    categories: photoTypes.map((type) => ({ type, photos: photos.filter((photo) => photo.photo_type === type) })),
  }];
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

// Compare actual source data as well as employee membership. A move to another
// session or removal of photo evidence must invalidate an already-open preview.
export function reportMatches(previewRows, currentRows) {
  const current = new Map(currentRows.map((row) => [row.application_id || row.employee_id, row]));
  return previewRows.length > 0 && previewRows.every((row) => current.has(row.application_id || row.employee_id) &&
    JSON.stringify(canonical(row)) === JSON.stringify(canonical(current.get(row.application_id || row.employee_id))));
}
