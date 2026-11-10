// Existing business codes remain untouched. New codes use a fixed-width sequence
// in a reserved namespace, so they sort and can be checked without scanning names.
const CODE_CONFIG = {
  branches: ["branch_code", "BR-"],
  departments: ["department_code", "DP-"],
  divisions: ["division_code", "DV-"],
  units: ["unit_code", "UN-"],
};

export async function nextOrganizationCode(supabase, table) {
  const [column, prefix] = CODE_CONFIG[table] || [];
  if (!column) throw new Error("Unknown organization level");

  let number = 0;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .like(column, `${prefix}%`)
      .order(column, { ascending: true })
      .range(offset, offset + 999);
    if (error) throw error;
    for (const row of data || []) {
      const value = row[column];
      const suffix = value?.startsWith(prefix) ? value.slice(prefix.length) : "";
      if (/^\d{8}$/.test(suffix)) number = Math.max(number, Number(suffix));
    }
    if (!data || data.length < 1000) break;
  }
  if (number >= 99999999) throw new Error("Organization code sequence exhausted");
  return `${prefix}${String(number + 1).padStart(8, "0")}`;
}
