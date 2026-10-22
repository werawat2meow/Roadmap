function formatDate(
  year: number,
  month: number,
  day: number,
) {
  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function getDefaultScheduleMonth() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  let [year, month, day] = today.split("-").map(Number);

  // ตั้งแต่วันที่ 21 เป็นต้นไป เป็นรอบที่สิ้นสุดเดือนถัดไป
  if (day >= 21) {
    month += 1;

    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return { year, month };
}

export function getLeaveSchedulePeriod(
  year: number,
  month: number,
) {
  if (
    !Number.isInteger(year) ||
    year < 1900 ||
    year > 9999 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error("ปีหรือเดือนไม่ถูกต้อง");
  }

  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;

  const startDate = formatDate(
    previousYear,
    previousMonth,
    21,
  );

  const endDate = formatDate(year, month, 20);

  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  const dates: string[] = [];

  for (
    let cursor = start.getTime();
    cursor <= end.getTime();
    cursor += 86_400_000
  ) {
    dates.push(
      new Date(cursor).toISOString().slice(0, 10),
    );
  }

  return {
    year,
    month,
    startDate,
    endDate,
    dates,
  };
}