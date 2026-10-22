export type Span = {
  startTime: string;
  endTime: string;
  startDayOffset: number;
  endDayOffset: number;
};

export type DayValue = {
  dayType: "WORK" | "OFF";
  intervals: Span[];
  note: string;
  source: "MANUAL" | "SETTINGS" | "COPY";
};

export type Version = {
  id: string;
  revision: number;
  state: "DRAFT" | "PUBLISHED";
} | null;

export type Change = DayValue & {
  employeeId: string;
  workDate: string;
  expected: Version;
};

export type SavedDay = {
  id: string;
  employeeId: string;
  workDate: string;
  dayType: "WORK" | "OFF";
  state: "DRAFT" | "PUBLISHED";
  revision: number;
  note: string;
  intervals: {
    id: string;
    sequence: number;
    startsAt: string;
    endsAt: string;
  }[];
};

export function cellKey(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}

export function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function datePlus(date: string, days: number) {
  return new Date(
    Date.parse(`${date}T00:00:00Z`) + days * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
}

export function validDate(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const time = Date.parse(`${value}T00:00:00Z`);

  return (
    Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === value
  );
}

export function isWeeklyOff(date: string, setting: string) {
  const names: Record<string, number> = {
    อาทิตย์: 0,
    จันทร์: 1,
    อังคาร: 2,
    พุธ: 3,
    พฤหัสบดี: 4,
    ศุกร์: 5,
    เสาร์: 6,
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  return setting.split(",").some((part) => {
    const value = part
      .trim()
      .replace(/^วัน/, "")
      .toLowerCase();

    const number = /^[0-6]$/.test(value)
      ? Number(value)
      : names[value];

    return number === weekday(date);
  });
}

export function settingsDay(
  defaults: {
    weeklyHoliday: string;
    startTime: string;
    endTime: string;
  },
  date: string,
): DayValue | null {
  if (isWeeklyOff(date, defaults.weeklyHoliday)) {
    return {
      dayType: "OFF",
      intervals: [],
      note: "",
      source: "SETTINGS",
    };
  }

  const { startTime, endTime } = defaults;

  if (!startTime || !endTime || startTime === endTime) {
    return null;
  }

  return {
    dayType: "WORK",
    note: "",
    source: "SETTINGS",
    intervals: [{
      startTime,
      endTime,
      startDayOffset: 0,
      endDayOffset: endTime < startTime ? 1 : 0,
    }],
  };
}

function bangkokDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function bangkokTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

export function savedValue(item: SavedDay): DayValue {
  function offset(time: string) {
    return Math.round(
      (
        Date.parse(`${bangkokDate(time)}T00:00:00Z`) -
        Date.parse(`${item.workDate}T00:00:00Z`)
      ) / 86_400_000,
    );
  }

  return {
    dayType: item.dayType,
    note: item.note || "",
    source: "MANUAL",
    intervals: item.intervals
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((span) => ({
        startTime: bangkokTime(span.startsAt),
        endTime: bangkokTime(span.endsAt),
        startDayOffset: offset(span.startsAt),
        endDayOffset: offset(span.endsAt),
      })),
  };
}

export function version(item?: SavedDay): Version {
  return item
    ? {
        id: item.id,
        revision: item.revision,
        state: item.state,
      }
    : null;
}

export function sameVersion(a: Version, b: Version) {
  return (
    (a === null && b === null) ||
    Boolean(
      a && b &&
      a.id === b.id &&
      a.revision === b.revision &&
      a.state === b.state,
    )
  );
}

export function currentDays(items: SavedDay[]) {
  const result = new Map<string, SavedDay>();

  for (const item of items) {
    const key = cellKey(item.employeeId, item.workDate);
    const previous = result.get(key);

    if (!previous || item.state === "DRAFT") {
      result.set(key, item);
    }
  }

  return result;
}

export function copyScheduleToEmployees(
  sourceEmployeeId: string,
  targetEmployeeIds: string[],
  sourceDays: { workDate: string; value: DayValue }[],
) {
  return [...new Set(targetEmployeeIds)]
    .filter((employeeId) => employeeId !== sourceEmployeeId)
    .flatMap((employeeId) => sourceDays.map(({ workDate, value }) => ({
      employeeId,
      workDate,
      value: {
        ...value,
        intervals: value.intervals.map((span) => ({ ...span })),
        note: "",
        source: "COPY" as const,
      },
    })));
}

export function validateDay(day: DayValue) {
  if (!day || !["WORK", "OFF"].includes(day.dayType)) {
    throw new Error("ประเภทวันไม่ถูกต้อง");
  }

  if (
    typeof day.note !== "string" ||
    day.note.length > 2000
  ) {
    throw new Error("หมายเหตุต้องไม่เกิน 2000 ตัวอักษร");
  }

  if (!["MANUAL", "SETTINGS", "COPY"].includes(day.source)) {
    throw new Error("แหล่งข้อมูลไม่ถูกต้อง");
  }

  if (!Array.isArray(day.intervals)) {
    throw new Error("ข้อมูลช่วงเวลาไม่ถูกต้อง");
  }

  if (day.dayType === "OFF") {
    if (day.intervals.length) {
      throw new Error("วันหยุดต้องไม่มีช่วงเวลาทำงาน");
    }
    return;
  }

  if (
    day.intervals.length < 1 ||
    day.intervals.length > 8
  ) {
    throw new Error("ระบุช่วงงาน 1–8 ช่วง");
  }

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  let previousEnd = -1;

  day.intervals.forEach((span, index) => {
    if (
      !span ||
      typeof span.startTime !== "string" ||
      typeof span.endTime !== "string" ||
      !timePattern.test(span.startTime) ||
      !timePattern.test(span.endTime)
    ) {
      throw new Error(`เวลาในช่วงที่ ${index + 1} ไม่ถูกต้อง`);
    }

    if (
      ![0, 1].includes(span.startDayOffset) ||
      ![0, 1].includes(span.endDayOffset)
    ) {
      throw new Error("วันเริ่มหรือวันเลิกงานไม่ถูกต้อง");
    }

    const minutes = (time: string) =>
      Number(time.slice(0, 2)) * 60 +
      Number(time.slice(3));

    const start =
      span.startDayOffset * 1440 + minutes(span.startTime);

    const end =
      span.endDayOffset * 1440 + minutes(span.endTime);

    if (index === 0 && span.startDayOffset !== 0) {
      throw new Error("ช่วงงานแรกต้องเริ่มในวันที่จัดตาราง");
    }

    if (end <= start || start < previousEnd) {
      throw new Error(
        "เวลาเลิกต้องอยู่หลังเวลาเข้า และช่วงงานต้องไม่ซ้อนกัน",
      );
    }

    previousEnd = end;
  });
}

export function absoluteIntervals(
  date: string,
  day: DayValue,
) {
  validateDay(day);

  return day.intervals.map((span) => ({
    starts_at: new Date(
      `${datePlus(date, span.startDayOffset)}T${span.startTime}:00+07:00`,
    ),
    ends_at: new Date(
      `${datePlus(date, span.endDayOffset)}T${span.endTime}:00+07:00`,
    ),
  }));
}

export function copyDate(
  sourceDates: string[],
  targetDates: string[],
  target: string,
  mode: "position" | "weekday",
) {
  const index = targetDates.indexOf(target);

  if (index < 0) throw new Error("วันที่ไม่อยู่ในรอบ");

  if (mode === "position") {
    if (sourceDates.length !== targetDates.length) {
      throw new Error(
        "สองรอบมีจำนวนวันไม่เท่ากัน ให้เลือกคัดลอกตามวันในสัปดาห์",
      );
    }

    return sourceDates[index];
  }

  // เลือกวันในสัปดาห์เดียวกันที่ใกล้ลำดับเดิมที่สุด
  // ถ้าระยะเท่ากัน เลือกวันก่อน
  return sourceDates
    .map((date, position) => ({ date, position }))
    .filter((item) => weekday(item.date) === weekday(target))
    .sort(
      (a, b) =>
        Math.abs(a.position - index) -
          Math.abs(b.position - index) ||
        a.position - b.position,
    )[0]?.date;
}
