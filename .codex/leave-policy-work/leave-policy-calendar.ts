/** Dates in the leave API are civil Thai dates, never host-local dates. */
export function dateKey(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = typeof value === "string" ? new Date(value) : value;
  if (!Number.isFinite(date.getTime())) throw new Error("วันที่ไม่ถูกต้อง");
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

export function civilDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("วันที่ต้องเป็น YYYY-MM-DD");
  const result = new Date(`${value}T00:00:00+07:00`);
  if (!Number.isFinite(+result) || dateKey(result) !== value) throw new Error("วันที่ไม่ถูกต้อง");
  return result;
}

export function anniversary(start: string, year: number): string {
  const [, month, day] = start.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export function completedMonths(start: string, asOf: string): number {
  if (asOf < start) return 0;
  const [sy, sm, sd] = start.split("-").map(Number);
  const [ey, em, ed] = asOf.split("-").map(Number);
  const dueDay = Math.min(sd, new Date(Date.UTC(ey, em, 0)).getUTCDate());
  return Math.max(0, (ey - sy) * 12 + em - sm - (ed < dueDay ? 1 : 0));
}

export function earnedAnnual(quota: number, start: string, originYear: number, asOf: string): number {
  const hireYear = Number(start.slice(0, 4));
  if (originYear < hireYear || asOf < anniversary(start, hireYear + 1)) return 0;
  if (asOf >= anniversary(start, originYear + 2)) return 0;
  if (asOf >= anniversary(start, originYear + 1)) return quota;
  const months = Math.min(12, Math.max(0, completedMonths(start, asOf) - (originYear - hireYear) * 12));
  return quota > 0 ? Math.min(quota, Math.ceil(months / (12 / quota))) : 0;
}

export type DayPart = { date: string; days: number; session: "FULL" | "AM" | "PM" };
export function leaveDays(start: string, end: string, session: "FULL" | "AM" | "PM"): DayPart[] {
  civilDate(start); civilDate(end);
  if (end < start) throw new Error("วันสิ้นสุดต้องไม่ก่อนวันเริ่มลา");
  const count = Math.round((+civilDate(end) - +civilDate(start)) / 86400000) + 1;
  if (count > 732) throw new Error("ช่วงวันลายาวเกิน 732 วัน กรุณาแยกใบลา");
  // Preserve the existing form convention: half session applies to the first date.
  return Array.from({ length: count }, (_, index) => ({
    date: dateKey(new Date(+civilDate(start) + index * 86400000)),
    days: index === 0 && session !== "FULL" ? 0.5 : 1,
    session: index === 0 ? session : "FULL",
  }));
}
