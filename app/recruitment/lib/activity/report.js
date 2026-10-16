import { actions } from "./policy";

export const activityStatuses = ["SUCCESS", "FAILED", "OBSERVED", "REQUESTED"];
const formatter = new Intl.DateTimeFormat("th-TH-u-ca-gregory", {
  timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

export function formatBangkokTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : formatter.format(date);
}

function dateBoundary(value, nextDay = false) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
  const day = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== value) throw new Error("วันที่ไม่ถูกต้อง");
  // Bangkok is UTC+07:00; end date is exclusive midnight of the next day.
  return new Date(day.getTime() - 7 * 3600000 + (nextDay ? 86400000 : 0)).toISOString();
}

export function parseActivityFilters(params) {
  const integer = (key, fallback, max) => {
    const raw = params.get(key);
    if (raw === null) return fallback;
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 1 || value > max) throw new Error("ค่าการแบ่งหน้าไม่ถูกต้อง");
    return value;
  };
  const action = params.get("action") || "";
  const status = params.get("status") || "";
  const userSearch = (params.get("user_search") || "").trim();
  const pagePath = (params.get("page_path") || "").trim();
  if (action && !actions.includes(action)) throw new Error("กิจกรรมไม่ถูกต้อง");
  if (status && !activityStatuses.includes(status)) throw new Error("สถานะไม่ถูกต้อง");
  if (userSearch.length > 100 || /[\u0000-\u001f]/.test(userSearch)) throw new Error("คำค้นหาผู้ใช้งานต้องไม่เกิน 100 ตัวอักษรและไม่มีอักขระควบคุม");
  if (pagePath.length > 300 || (pagePath && !/^\/recruitment(?:\/[a-zA-Z0-9_/-]*)?$/.test(pagePath))) throw new Error("เส้นทางหน้าต้องเริ่มด้วย /recruitment และไม่มี query");
  const start = dateBoundary(params.get("date_from"));
  const end = dateBoundary(params.get("date_to"), true);
  if (start && end && start >= end) throw new Error("วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด");
  return { page: integer("page", 1, 1000000), pageSize: integer("pageSize", 20, 100), action, status, userSearch, pagePath, start, end };
}
