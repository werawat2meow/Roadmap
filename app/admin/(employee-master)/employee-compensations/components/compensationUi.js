export function formatMoney(value, currency = "THB") {
  const number = Number(value || 0);
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: currency || "THB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

export function formatDate(value) {
  if (!value) return "-";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function employeeName(employee) {
  if (!employee) return "-";
  const th = [employee.first_name_th, employee.last_name_th]
    .filter(Boolean)
    .join(" ")
    .trim();
  const en = [employee.first_name_en, employee.last_name_en]
    .filter(Boolean)
    .join(" ")
    .trim();
  return th || en || employee.employee_code || "-";
}

export function statusMeta(status) {
  const map = {
    active: { label: "ใช้งาน", color: "green" },
    inactive: { label: "สิ้นสุด", color: "default" },
    draft: { label: "ฉบับร่าง", color: "blue" },
    cancelled: { label: "ยกเลิก", color: "default" },
    pending: { label: "รออนุมัติ", color: "gold" },
    approved: { label: "อนุมัติแล้ว", color: "green" },
    rejected: { label: "ไม่อนุมัติ", color: "red" },
  };
  return map[status] || { label: status || "-", color: "default" };
}

export const adjustmentTypeOptions = [
  { value: "annual_increment", label: "Annual Increment" },
  { value: "merit", label: "Merit / ผลประเมิน" },
  { value: "promotion", label: "Promotion" },
  { value: "market_adjustment", label: "Market Adjustment" },
  { value: "salary_review", label: "Salary Review" },
  { value: "special_adjustment", label: "Special Adjustment" },
  { value: "correction", label: "Correction" },
];

export function getAdjustmentTypeLabel(value) {
  return (
    adjustmentTypeOptions.find((item) => item.value === value)?.label ||
    value ||
    "-"
  );
}

export async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export function normalizeApiRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}
