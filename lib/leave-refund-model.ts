export type Session = "FULL" | "AM" | "PM";

export type Allocation = {
  source: string;
  year: number;
  days: number;
};

export type RefundUnit = {
  key: string;
  date: string;
  session: "AM" | "PM";
  allocations: Allocation[];
  returned: boolean;
};

type RefundEvent = {
  at: string;
  actorId: string;
  reason: string;
  confirmation: string;
  keys: string[];
  days: number;
  allocations: Allocation[];
};

type RefundState = {
  version: 1;
  units: RefundUnit[];
  events: RefundEvent[];
};

type CalendarRequest = {
  startDate: Date | string;
  endDate: Date | string;
  session?: string | null;
  reservation?: unknown;
};

type RefundRequest = CalendarRequest & {
  kind: string;
  requestedDays: unknown;
};

export type DayPart = {
  date: string;
  days: number;
  session: Session;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function refundDateKey(value: Date | string): string {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return value;
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    throw new Error("วันที่ไม่ถูกต้อง");
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

// ใช้กติกาเดียวกับ PWA: ครึ่งวันมีผลกับวันแรกของใบลา
function originalParts(request: CalendarRequest): DayPart[] {
  const start = refundDateKey(request.startDate);
  const end = refundDateKey(request.endDate);

  const first = Date.parse(`${start}T00:00:00Z`);
  const last = Date.parse(`${end}T00:00:00Z`);

  if (!Number.isFinite(first) || !Number.isFinite(last) || last < first) {
    throw new Error("ช่วงวันลาไม่ถูกต้อง");
  }

  const count = Math.round((last - first) / 86400000) + 1;

  if (count > 732) throw new Error("ช่วงวันลายาวเกิน 732 วัน");

  const session = request.session || "FULL";

  if (!["FULL", "AM", "PM"].includes(session)) {
    throw new Error("ช่วงเวลาลาไม่ถูกต้อง");
  }

  return Array.from({ length: count }, (_, index) => ({
    date: new Date(first + index * 86400000)
      .toISOString()
      .slice(0, 10),
    session: (index === 0 ? session : "FULL") as Session,
    days: index === 0 && session !== "FULL" ? 0.5 : 1,
  }));
}

function storedState(request: CalendarRequest): RefundState | null {
  const value = record(request.reservation).refundState;

  if (value === undefined) return null;

  const state = record(value);

  if (
    state.version !== 1 ||
    !Array.isArray(state.units) ||
    !Array.isArray(state.events)
  ) {
    throw new Error("ประวัติคืนสิทธิ์ไม่ถูกต้อง กรุณาตรวจสอบข้อมูล");
  }

  return state as unknown as RefundState;
}

/**
 * ให้ Reports และ policy อ่านวันลาที่ยังมีผล
 * ใบลาที่ยังไม่เคยคืนใช้รายละเอียดเดิมตามปกติ
 */
export function remainingLeaveParts(request: CalendarRequest): DayPart[] {
  const state = storedState(request);

  if (!state) return originalParts(request);

  const dates = new Map<string, Set<"AM" | "PM">>();

  for (const unit of state.units) {
    if (unit.returned) continue;

    const sessions = dates.get(unit.date) || new Set<"AM" | "PM">();
    sessions.add(unit.session);
    dates.set(unit.date, sessions);
  }

  return [...dates.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sessions]) => ({
      date,
      days: sessions.size === 2 ? 1 : 0.5,
      session:
        sessions.size === 2
          ? "FULL"
          : sessions.has("AM")
            ? "AM"
            : "PM",
    }));
}

function validateAllocation(
  allocation: Allocation,
  kind: string,
) {
  if (
    !Number.isInteger(allocation.year) ||
    !Number.isFinite(allocation.days) ||
    allocation.days <= 0
  ) {
    throw new Error("รายละเอียดก้อนสิทธิ์ไม่ถูกต้อง");
  }

  const prefixes =
    kind === "ANNUAL"
      ? ["annual", "annualCarry"]
      : kind === "ANNUAL_HOLIDAY"
        ? ["holiday", "holidayCarry"]
        : [kind];

  if (
    !prefixes.some(
      (prefix) =>
        allocation.source === `${prefix}:${allocation.year}`,
    )
  ) {
    throw new Error("แหล่งสิทธิ์ไม่ตรงกับประเภทลา");
  }
}

function allocationTotals(allocations: Allocation[]) {
  const result = new Map<string, number>();

  for (const item of allocations) {
    const key = `${item.source}|${item.year}`;
    result.set(
      key,
      round((result.get(key) || 0) + item.days),
    );
  }

  return result;
}

export function getRefundState(request: RefundRequest): RefundState {
  const reservation = record(request.reservation);

  if (
    reservation.version !== 3 ||
    !Array.isArray(reservation.allocations)
  ) {
    throw new Error(
      "ใบลานี้ยังไม่มีรายละเอียดว่าใช้สิทธิ์จากยอดใด กรุณาตรวจสอบข้อมูลการหักสิทธิ์ก่อนคืน",
    );
  }

  const allocations = reservation.allocations as Allocation[];

  for (const item of allocations) {
    validateAllocation(item, request.kind);
  }

  const saved = storedState(request);

  if (saved) {
    const units = saved.units.filter((unit) => !unit.returned);
    const activeDays = units.length * 0.5;

    if (
      Math.abs(activeDays - Number(request.requestedDays)) > 0.001
    ) {
      throw new Error("จำนวนวันลาคงเหลือไม่ตรงกับประวัติคืน");
    }

    for (const unit of saved.units) {
      const sum = unit.allocations.reduce((n, item) => n + item.days, 0);

      if (Math.abs(sum - 0.5) > 0.001) {
        throw new Error("ก้อนสิทธิ์ของครึ่งวันไม่ครบ");
      }

      for (const item of unit.allocations) {
        validateAllocation(item, request.kind);
      }
    }

    const expected = allocationTotals(
      units.flatMap((unit) => unit.allocations),
    );

    const actual = allocationTotals(allocations);

    if (
      expected.size !== actual.size ||
      [...expected].some(
        ([key, value]) =>
          Math.abs(value - (actual.get(key) || 0)) > 0.001,
      )
    ) {
      throw new Error("ยอด allocation ไม่ตรงกับวันลาคงเหลือ");
    }

    return structuredClone(saved);
  }

  const parts = originalParts(request);
  const calculated = parts.reduce((n, item) => n + item.days, 0);
  const allocated = allocations.reduce((n, item) => n + item.days, 0);

  if (
    Math.abs(calculated - Number(request.requestedDays)) > 0.001 ||
    Math.abs(calculated - allocated) > 0.001
  ) {
    throw new Error(
      "จำนวนวันหรือก้อนสิทธิ์เดิมไม่ตรงรายละเอียด ต้องตรวจข้อมูลก่อนคืน",
    );
  }

  // allocation เดิมของ PWA เรียงตามวันลาและลำดับก้อนที่ใช้
  // แบ่งแต่ละวันเป็นเช้า/บ่าย เพื่อคืนได้ครั้งละ 0.5 วัน
  const pool = allocations.map((item) => ({ ...item }));
  let index = 0;
  const units: RefundUnit[] = [];

  for (const part of parts) {
    const sessions: Array<"AM" | "PM"> =
      part.session === "FULL"
        ? ["AM", "PM"]
        : [part.session];

    for (const session of sessions) {
      let wanted = 0.5;
      const taken: Allocation[] = [];

      while (wanted > 0.001) {
        while (pool[index] && pool[index].days <= 0.001) index++;

        const source = pool[index];

        if (!source) {
          throw new Error("ก้อนสิทธิ์เดิมไม่เพียงพอกับวันลา");
        }

        const days = round(Math.min(wanted, source.days));

        taken.push({
          source: source.source,
          year: source.year,
          days,
        });

        source.days = round(source.days - days);
        wanted = round(wanted - days);
      }

      units.push({
        key: `${part.date}:${session}`,
        date: part.date,
        session,
        allocations: taken,
        returned: false,
      });
    }
  }

  return { version: 1, units, events: [] };
}

export function buildRefundPlan(
  request: RefundRequest,
  keys: string[],
  audit: {
    actorId: string;
    reason: string;
    confirmation: string;
  },
) {
  if (
    keys.length === 0 ||
    new Set(keys).size !== keys.length ||
    audit.reason.trim().length < 3 ||
    audit.confirmation.trim().length < 3
  ) {
    throw new Error(
      "กรุณาเลือกช่วงที่คืน ระบุเหตุผล และข้อมูลยืนยันจากหัวหน้า",
    );
  }

  const state = getRefundState(request);
  const chosen = new Set(keys);

  const targets = state.units.filter((unit) => chosen.has(unit.key));

  if (
    targets.length !== chosen.size ||
    targets.some((unit) => unit.returned)
  ) {
    throw new Error("มีช่วงที่คืนไปแล้ว หรือไม่ได้อยู่ในใบลานี้");
  }

  const restoredAllocations = targets.flatMap(
    (unit) => unit.allocations,
  );

  for (const unit of targets) unit.returned = true;

  const days = targets.length * 0.5;

  state.events.push({
    at: new Date().toISOString(),
    actorId: audit.actorId,
    reason: audit.reason.trim(),
    confirmation: audit.confirmation.trim(),
    keys,
    days,
    allocations: restoredAllocations,
  });

  const active = state.units.filter((unit) => !unit.returned);

  return {
    days,
    remainingDays: active.length * 0.5,
    restoredAllocations,

    reservation: {
      ...record(request.reservation),
      version: 3,
      allocations: active.flatMap((unit) => unit.allocations),
      refundState: state,
    },
  };
}