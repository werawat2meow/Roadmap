import { LeaveKind, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEmployeeByUuid, getEmployeeLevelCode } from "@/lib/supabaseAdmin";
import { findLeaveBlackoutConflict } from "@/lib/leave-blackout";
import { anniversary, civilDate, completedMonths, dateKey, earnedAnnual, leaveDays, type DayPart } from "@/lib/leave-policy-calendar";

export class LeavePolicyError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export const quotaField = {
  SICK: "sickLeave", BUSINESS: "businessLeave", BIRTHDAY: "birthdayLeave",
  ORDAIN: "ordainLeave", MATERNITY: "maternityLeave", UNPAID: "unpaidLeave",
} as const;
type Tx = Prisma.TransactionClient;
type Kind = keyof typeof quotaField | "ANNUAL" | "ANNUAL_HOLIDAY";
export type Allocation = { source: string; year: number; days: number };
export type PolicyReservation = { version: 3; allocations: Allocation[] };
type Draft = {
  employeeId: string; kind: string; startDate: string; endDate: string;
  session: "FULL" | "AM" | "PM"; excludeLeaveId?: number;
  preview?: boolean;
};
type Source = { key: string; year: number; limit: (date: string) => number; expires: string };
const num = (value: unknown) => Number(value || 0);
const round = (value: number) => Math.round(value * 100) / 100;

export function reservationV3(value: unknown): PolicyReservation | null {
  if (!value || typeof value !== "object") return null;
  const r = value as PolicyReservation;
  return r.version === 3 && Array.isArray(r.allocations) ? r : null;
}

/** Serializes all mutations for one employee, across all PWA routes. */
export async function withEmployeeLock<T>(employeeId: string, work: (tx: Tx) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${employeeId}))`;
    return work(tx);
  }, { maxWait: 10000, timeout: 30000 });
}

async function projectedHolidayCarry(tx: Tx, employeeId: string, year: number) {
  const rows = await tx.leaveRights.findMany({ where: { employeeId } });
  const previous = rows.find((r) => r.year === year - 1);
  if (!previous) return 0;
  const holidays = await tx.leaveHoliday.findMany({ select: { date: true } });
  const declared = new Set(holidays.map((h) => dateKey(h.date)).filter((d) => Number(d.slice(0, 4)) === year - 1)).size;
  const pending = await tx.leaveRequest.findMany({ where: { employeeId, kind: "ANNUAL_HOLIDAY", status: { in: ["PENDING"] } } });
  const approved = await tx.leaveRequest.findMany({ where: { employeeId, kind: "ANNUAL_HOLIDAY", status: { in: ["APPROVED"] } } });
  const currentUsed = approved.reduce((sum, r) => {
    const saved = reservationV3(r.reservation);
    if (saved) return sum + saved.allocations.filter((a) => a.source === `holiday:${year - 1}`).reduce((n, a) => n + a.days, 0);
    const legacy = r.reservation as Record<string, {current?: number}> | null;
    if (legacy?.[String(year - 1)]) return sum + num(legacy[String(year - 1)].current);
    return sum + historicalParts(r).filter((p) => Number(p.date.slice(0, 4)) === year - 1).reduce((n, p) => n + p.days, 0);
  }, 0);
  const reserved = pending.reduce((sum, r) => {
    const saved = reservationV3(r.reservation);
    if (saved) return sum + saved.allocations.filter((a) => a.source === `holiday:${year - 1}`).reduce((n, a) => n + a.days, 0);
    // Legacy reservation.current already distinguishes use from old carry.
    const legacy = r.reservation as Record<string, {current?: number}> | null;
    if (legacy?.[String(year - 1)]) return sum + num(legacy[String(year - 1)].current);
    return sum + historicalParts(r).filter((p) => Number(p.date.slice(0, 4)) === year - 1).reduce((n, p) => n + p.days, 0);
  }, 0);
  return round(Math.max(0, Math.min(Math.max(0, declared - currentUsed), num(previous.holidayLeave)) - reserved));
}

async function ensureRights(tx: Tx, employeeId: string, years: number[], template: any, today: string) {
  for (const year of years) {
    const futureYear = year > Number(today.slice(0, 4));
    const projectedCarry = futureYear ? 0 : await projectedHolidayCarry(tx, employeeId, year);
    const row = await tx.leaveRights.upsert({
      where: { employeeId_year: { employeeId, year } }, update: {},
      create: {
        employeeId, year,
        annualLeave: num(template?.annualLeaveDays),
        vacationLeave: num(template?.annualLeaveDays),
        holidayLeave: num(template?.holidayLeaveDays),
        sickLeave: num(template?.sickLeaveDays), businessLeave: num(template?.businessLeaveDays),
        birthdayLeave: num(template?.birthdayLeaveDays), ordainLeave: num(template?.ordainLeaveDays),
        maternityLeave: num(template?.maternityLeaveDays), unpaidLeave: num(template?.unpaidLeaveDays),
        // Carry openings are entered by HR. Do not manufacture or transfer them on a read.
        carryForwardHoliday: projectedCarry,
        // Jan 1 is a marker for a future row: finalize its carry only when that year begins.
        carryForwardHolidayExpiry: civilDate(`${year}-${futureYear ? "01-01" : "10-01"}`),
      },
    });
    if (!futureYear && row.carryForwardHolidayExpiry && dateKey(row.carryForwardHolidayExpiry) === `${year}-01-01`) {
      await tx.leaveRights.update({ where: { id: row.id }, data: {
        carryForwardHoliday: num(row.carryForwardHoliday) > 0 ? row.carryForwardHoliday : projectedCarry,
        carryForwardHolidayExpiry: civilDate(`${year}-10-01`),
      } });
    }
  }
}

/** Every submit/edit/final approval uses the same daily allocation, including expiry boundaries. */
export async function checkLeave(tx: Tx, draft: Draft, now = new Date()) {
  if (!Object.values(LeaveKind).includes(draft.kind as LeaveKind)) throw new LeavePolicyError("ประเภทการลาไม่ถูกต้อง");
  const kind = draft.kind as Kind;
  const today = dateKey(now);
  const parts = leaveDays(draft.startDate, draft.endDate, draft.session);
  const employee = await getEmployeeByUuid(draft.employeeId);
  if (!employee) throw new LeavePolicyError("ไม่พบข้อมูลพนักงาน");
  const level = getEmployeeLevelCode(employee);
  const template = level ? await tx.leaveRightsTemplate.findFirst({ where: { prefix: level } }) : null;
  const startWork = employee.start_work_date?.slice(0, 10) || null;
  if (kind === "ANNUAL" && !startWork) {
    if (draft.preview) return emptyPreview();
    throw new LeavePolicyError("ไม่พบ start_work_date กรุณาติดต่อ HR");
  }
  if (kind === "ANNUAL" && (draft.startDate < anniversary(startWork!, Number(startWork!.slice(0, 4)) + 1))) {
    if (draft.preview) return emptyPreview();
    throw new LeavePolicyError("ต้องทำงานครบ 1 ปีก่อนวันเริ่มลาพักร้อน");
  }
  if (kind === "BIRTHDAY" && !draft.preview) {
    const birthMonth = employee.birth_date?.slice(5, 7);
    if (!birthMonth || parts.some((p) => p.date.slice(5, 7) !== birthMonth)) throw new LeavePolicyError("ลาวันเกิดได้เฉพาะเดือนเกิด");
  }
  if (kind === "ORDAIN") {
    const prior = await tx.leaveRequest.findFirst({ where: {
      employeeId: draft.employeeId, kind: "ORDAIN", status: { in: ["PENDING", "APPROVED"] },
      ...(draft.excludeLeaveId ? { id: { not: draft.excludeLeaveId } } : {}),
    } });
    if (prior) {
      if (draft.preview) return emptyPreview();
      throw new LeavePolicyError("ลาบวชใช้ได้ครั้งเดียวตลอดอายุงาน และมีใบลารออนุมัติหรืออนุมัติแล้ว");
    }
  }
  const blackout = draft.preview ? null : await findLeaveBlackoutConflict({ employeeId: draft.employeeId, kind: kind as LeaveKind,
    start: civilDate(draft.startDate), end: civilDate(draft.endDate) });
  if (blackout) throw new LeavePolicyError(`ช่วงวันที่เลือกถูกปิดรับการลา${blackout.reason ? ` (${blackout.reason})` : ""}`);

  const allActive = await tx.leaveRequest.findMany({ where: {
    employeeId: draft.employeeId, status: { in: ["PENDING", "APPROVED"] },
    ...(draft.excludeLeaveId ? { id: { not: draft.excludeLeaveId } } : {}),
  }, orderBy: [{ startDate: "asc" }, { id: "asc" }] });
  for (const request of draft.preview ? [] : allActive) {
    if (dateKey(request.endDate) < draft.startDate || dateKey(request.startDate) > draft.endDate) continue;
    const existing = leaveDays(dateKey(request.startDate), dateKey(request.endDate), request.session || "FULL");
    if (parts.some((p) => existing.some((e) => p.date === e.date &&
      (p.session === "FULL" || e.session === "FULL" || p.session === e.session)))) {
      throw new LeavePolicyError("ช่วงเวลาลาซ้อนกับคำขอเดิม");
    }
  }
  const years = [...new Set(parts.map((p) => Number(p.date.slice(0, 4))))];
  const neededYears = kind === "ANNUAL" ? [...new Set([...years, ...years.map((y) => y - 1), ...years.map((y) => y - 2)])]
    .filter((y) => y >= Number(startWork!.slice(0, 4))) : years;
  if (!draft.preview) await ensureRights(tx, draft.employeeId, neededYears, template, today);
  const rightsRows = await tx.leaveRights.findMany({ where: { employeeId: draft.employeeId } });
  // A balance read must not create rights rows or roll balances forward.
  if (draft.preview) for (const year of neededYears) {
    if (rightsRows.some((r) => r.year === year)) continue;
    const decimal = (value: unknown) => new Prisma.Decimal(num(value));
    rightsRows.push({ id: -year, employeeId: draft.employeeId, year,
      annualLeave: decimal(template?.annualLeaveDays), vacationLeave: decimal(template?.annualLeaveDays),
      holidayLeave: decimal(template?.holidayLeaveDays), sickLeave: decimal(template?.sickLeaveDays),
      businessLeave: decimal(template?.businessLeaveDays), birthdayLeave: decimal(template?.birthdayLeaveDays),
      ordainLeave: decimal(template?.ordainLeaveDays), maternityLeave: decimal(template?.maternityLeaveDays),
      unpaidLeave: decimal(template?.unpaidLeaveDays), carryForwardAnnual: decimal(0),
      carryForwardHoliday: decimal(year <= Number(today.slice(0, 4)) ? await projectedHolidayCarry(tx, draft.employeeId, year) : 0),
      carryForwardAnnualExpiry: null, carryForwardHolidayExpiry: null,
    });
  }
  if (draft.preview) for (const row of rightsRows) {
    if (row.year <= Number(today.slice(0, 4)) && row.carryForwardHolidayExpiry &&
      dateKey(row.carryForwardHolidayExpiry) === `${row.year}-01-01` && num(row.carryForwardHoliday) === 0) {
      row.carryForwardHoliday = new Prisma.Decimal(await projectedHolidayCarry(tx, draft.employeeId, row.year));
    }
  }
  const holidays = await tx.leaveHoliday.findMany({ select: { date: true } });
  const holidayKeys = [...new Set(holidays.map((h) => dateKey(h.date)))].sort();
  const relevant = allActive.filter((r) => r.kind === kind);
  if (kind === "ANNUAL") {
    const oldBuckets = await tx.leaveCarryForwardBucket.findMany({ where: { employeeId: draft.employeeId } });
    for (const row of rightsRows) {
      const expiry = row.carryForwardAnnualExpiry ? dateKey(row.carryForwardAnnualExpiry) : anniversary(startWork!, row.year);
      if (num(row.carryForwardAnnual) > 0 && parts.some((p) => p.date >= `${row.year}-01-01` && p.date < expiry) &&
        oldBuckets.some((b) => b.originYear === row.year - 1)) {
        throw new LeavePolicyError("พบยอดยกมาพักร้อนเดิมทั้งใน leave_rights และ bucket เดียวกัน ต้องยืนยันยอดเพิ่มเติมของ HR ก่อน เพื่อไม่ให้สิทธิ์ซ้ำ", 409);
      }
    }
  }
  if (kind === "ANNUAL_HOLIDAY" && relevant.some((r) => r.status === "APPROVED" && !reservationV3(r.reservation) &&
    r.reservation && Object.values(r.reservation as Record<string, {cf?: number}>).some((a) => num(a?.cf) > 0))) {
    throw new LeavePolicyError("มีใบลาเก่าที่หักยอดยกมาวันหยุดจากฐานข้อมูลแล้ว ต้องตรวจยอดตั้งต้นกับ HR ก่อนใช้กฎใหม่ เพื่อไม่หักยอดซ้ำ", 409);
  }
  const sources: Source[] = [];
  for (const row of rightsRows) {
    const y = row.year;
    if (kind === "ANNUAL") {
      if (y >= Number(startWork!.slice(0, 4))) sources.push({ key: `annual:${y}`, year: y,
        expires: anniversary(startWork!, y + 2),
        limit: (date) => earnedAnnual(num(row.annualLeave), startWork!, y, date) });
      // Manual HR carry is an additional opening, separate from the automatic full first year.
      const expiry = row.carryForwardAnnualExpiry ? dateKey(row.carryForwardAnnualExpiry) : anniversary(startWork!, y);
      sources.push({ key: `annualCarry:${y}`, year: y, expires: expiry,
        limit: (date) => date >= `${y}-01-01` && date < expiry && date >= anniversary(startWork!, Number(startWork!.slice(0, 4)) + 1)
          ? num(row.carryForwardAnnual) : 0 });
    } else if (kind === "ANNUAL_HOLIDAY") {
      const expiry = `${y}-10-01`;
      sources.push({ key: `holidayCarry:${y}`, year: y, expires: expiry,
        limit: (date) => date >= `${y}-01-01` && date < expiry ? num(row.carryForwardHoliday) : 0 });
      sources.push({ key: `holiday:${y}`, year: y, expires: `${y + 1}-01-01`,
        limit: (date) => Number(date.slice(0, 4)) === y ? holidayKeys.filter((h) => Number(h.slice(0, 4)) === y && h <= date).length : 0 });
    } else {
      const field = quotaField[kind];
      // These legacy columns are remaining balances. Add APPROVED usage back once to obtain the opening.
      const approved = relevant.filter((r) => r.status === "APPROVED").reduce((sum, r) => sum + historicalParts(r)
        .filter((p) => Number(p.date.slice(0, 4)) === y).reduce((n, p) => n + p.days, 0), 0);
      const opening = num(row[field]) + approved;
      sources.push({ key: `${kind}:${y}`, year: y, expires: `${y + 1}-01-01`,
        limit: (date) => Number(date.slice(0, 4)) === y ? opening : 0 });
    }
  }
  sources.sort((a, b) => a.expires.localeCompare(b.expires) || a.key.localeCompare(b.key));
  const used = new Map<string, number>();
  const allocations: Allocation[] = [];
  function consume(partsToUse: DayPart[], strict: boolean, target: boolean, pending: boolean) {
    for (const part of partsToUse) {
      const asOf = pending && (kind === "ANNUAL" || kind === "ANNUAL_HOLIDAY") && part.date > today ? today : part.date;
      let remaining = part.days;
      for (const source of sources) {
        // Calendar quotas and expiry are governed by the actual leave day.
        if (part.date >= source.expires) continue;
        if (kind !== "ANNUAL" && source.year !== Number(part.date.slice(0, 4))) continue;
        const available = Math.max(0, source.limit(asOf) - (used.get(source.key) || 0));
        const take = Math.min(remaining, available);
        if (take <= 0) continue;
        used.set(source.key, round((used.get(source.key) || 0) + take));
        if (target) allocations.push({ source: source.key, year: source.year, days: take });
        remaining = round(remaining - take);
        if (remaining <= 0) break;
      }
      if (remaining > 0 && strict) throw new LeavePolicyError(`สิทธิ์ ${kind} ไม่พอสำหรับวันที่ ${part.date} (รวมคำขอรออนุมัติแล้ว)`);
      if (remaining > 0) {
        // Legacy approvals must never be silently restored. Charge any unexplained use as debt.
        const fallback = sources.filter((s) => s.year === Number(part.date.slice(0, 4))).at(-1);
        if (fallback) used.set(fallback.key, (used.get(fallback.key) || 0) + remaining);
      }
    }
  }
  // Finalized allocations are immutable; delayed approvals do not expire previously valid leave days.
  for (const r of relevant.filter((r) => r.status === "APPROVED")) {
    const saved = reservationV3(r.reservation);
    if (saved) for (const a of saved.allocations) used.set(a.source, (used.get(a.source) || 0) + a.days);
    else consume(historicalParts(r), false, false, false);
  }
  // Preserve existing pending commitments before admitting another request.
  for (const r of relevant.filter((r) => r.status === "PENDING")) consume(historicalParts(r), !draft.preview, false, true);
  const active = sources.filter((s) => s.limit(today) > 0);
  const total = round(active.reduce((n, s) => n + s.limit(today), 0));
  const remaining = round(active.reduce((n, s) => n + Math.max(0, s.limit(today) - (used.get(s.key) || 0)), 0));
  const carrySources = active.filter((s) => s.key.includes("Carry:"));
  const carry = round(carrySources.reduce((n, s) => n + Math.max(0, s.limit(today) - (used.get(s.key) || 0)), 0));
  if (!draft.preview) consume(parts, true, true, true);
  return { requestedDays: round(parts.reduce((n, p) => n + p.days, 0)),
    balance: { total, used: round(total - remaining), remaining, carry,
      carryExpiry: carrySources[0] ? dateKey(new Date(+civilDate(carrySources[0].expires) - 86400000)) : null },
    reservation: { version: 3, allocations } satisfies PolicyReservation };
}

function emptyPreview() {
  return { requestedDays: 0, reservation: { version: 3, allocations: [] } as PolicyReservation,
    balance: { total: 0, used: 0, remaining: 0, carry: 0, carryExpiry: null as string | null } };
}

export async function getPolicyBalances(tx: Tx, employeeId: string, now = new Date()) {
  const today = dateKey(now);
  const names = { ANNUAL: "vacation", SICK: "sick", BUSINESS: "business", BIRTHDAY: "birthday",
    ORDAIN: "ordainDays", MATERNITY: "maternity", UNPAID: "unpaid", ANNUAL_HOLIDAY: "annualHolidays" } as const;
  const entitled: Record<string, number> = {}, used: Record<string, number> = {}, remaining: Record<string, number> = {};
  const carryForward = { vacation: 0, annualHolidays: 0 };
  const carryForwardExpiry: { vacation: string | null; annualHolidays: string | null } = { vacation: null, annualHolidays: null };
  for (const [kind, name] of Object.entries(names)) {
    const result = await checkLeave(tx, { employeeId, kind, startDate: today, endDate: today, session: "FULL", preview: true }, now);
    entitled[name] = result.balance.total; used[name] = result.balance.used; remaining[name] = result.balance.remaining;
    if (name === "vacation" || name === "annualHolidays") {
      carryForward[name] = result.balance.carry; carryForwardExpiry[name] = result.balance.carryExpiry;
    }
  }
  return { entitled, used, remaining, carryForward, carryForwardExpiry };
}

function historicalParts(request: { startDate: Date; endDate: Date; session: "FULL" | "AM" | "PM" | null; requestedDays: unknown }) {
  const parts = leaveDays(dateKey(request.startDate), dateKey(request.endDate), request.session || "FULL");
  const computed = parts.reduce((n, p) => n + p.days, 0);
  const stored = num(request.requestedDays);
  if (Math.abs(stored - computed) > 0.001) throw new LeavePolicyError(
    "มีใบลาเก่าที่จำนวนวันไม่ตรงรายละเอียดรายวัน กรุณาให้ HR ตรวจข้อมูลก่อนคำนวณข้ามรอบ", 409);
  return parts;
}

/** Update only remaining-balance fields; HR carry columns remain opening amounts. */
export async function applyApprovedUsage(tx: Tx, employeeId: string, kind: string, reservation: PolicyReservation) {
  const deltas = new Map<string, { year: number; field: string; days: number }>();
  for (const a of reservation.allocations) {
    const field = a.source.startsWith("annual:") ? "vacationLeave"
      : a.source.startsWith("holiday:") ? "holidayLeave"
      : quotaField[kind as keyof typeof quotaField];
    // HR manual carry values are openings. Usage is stored in reservation, never deducted twice.
    if (!field) continue;
    const key = `${a.year}:${field}`;
    const previous = deltas.get(key);
    deltas.set(key, { year: a.year, field, days: (previous?.days || 0) + a.days });
  }
  for (const d of deltas.values()) {
    const row = await tx.leaveRights.findUniqueOrThrow({ where: { employeeId_year: { employeeId, year: d.year } } });
    await tx.leaveRights.update({ where: { id: row.id }, data: { [d.field]: Math.max(0, num((row as any)[d.field]) - d.days) } });
  }
}

export function policyResponse(error: unknown) {
  return { error: error instanceof Error ? error.message : "ไม่สามารถประมวลผลใบลาได้",
    status: error instanceof LeavePolicyError ? error.status : 500 };
}
