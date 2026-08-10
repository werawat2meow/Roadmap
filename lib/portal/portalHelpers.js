export function cleanText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function cleanCode(value, { upper = false } = {}) {
  let text = String(value ?? "").trim();
  text = upper ? text.toUpperCase() : text.toLowerCase();
  text = text.replace(/[^a-zA-Z0-9_]/g, "");
  return text || null;
}

export function normalizePositiveInteger(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.trunc(number));
}

export function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

export function isPostgresUniqueViolation(error) {
  return error?.code === "23505";
}

export function isPostgresForeignKeyViolation(error) {
  return error?.code === "23503";
}
