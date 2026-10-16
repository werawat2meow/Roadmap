import "server-only";

// Page through matches instead of silently losing users to the API row limit.
async function matchingIds(makeQuery) {
  const ids = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await makeQuery().order("id").range(offset, offset + 499);
    if (error) throw error;
    ids.push(...(data || []).map((row) => row.id));
    if (!data || data.length < 500) return ids;
  }
}

const pattern = (value) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;

export async function findActivityUserIds(db, search) {
  const nameParts = search.split(/\s+/).filter(Boolean);
  const [usernameIds, employeeIds] = await Promise.all([
    matchingIds(() => db.from("user_accounts").select("id").ilike("username", pattern(search))),
    matchingIds(() => {
      let query = db.from("employees").select("id");
      // All words must match a name field; this also supports first + last name.
      for (const part of nameParts) {
        const value = JSON.stringify(pattern(part));
        query = query.or(["first_name_th", "last_name_th", "first_name_en", "last_name_en"]
          .map((field) => `${field}.ilike.${value}`).join(","));
      }
      return query;
    }),
  ]);
  const userIds = new Set(usernameIds);
  // Bound each employee_id IN query so long match lists do not exceed URL limits.
  for (let offset = 0; offset < employeeIds.length; offset += 100) {
    const batch = employeeIds.slice(offset, offset + 100);
    const ids = await matchingIds(() => db.from("user_accounts").select("id").in("employee_id", batch));
    for (const id of ids) userIds.add(id);
  }
  return [...userIds];
}
