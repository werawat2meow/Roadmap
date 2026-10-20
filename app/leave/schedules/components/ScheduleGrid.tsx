"use client";

type OrganizationValue =
  | Record<string, string>
  | Record<string, string>[]
  | null;

export type ScheduleEmployee = {
  id: string;
  employeeCode: string;
  name: string;

  branchId: string | null;
  departmentId: string | null;
  divisionId: string | null;
  unitId: string | null;

  organization: {
    branch: OrganizationValue;
    department: OrganizationValue;
    division: OrganizationValue;
    unit: OrganizationValue;
  };

  defaults: {
    weeklyHoliday: string;
    startTime: string;
    endTime: string;
  };
};

export type ScheduleItem = {
  id: string;
  employeeId: string;
  workDate: string;
  dayType: "WORK" | "OFF";
  state: "DRAFT" | "PUBLISHED";
  revision: number;
  shiftName: string | null;
  source: string;
  note: string;

  intervals: {
    id: string;
    sequence: number;
    startsAt: string;
    endsAt: string;
  }[];
};

type Props = {
  dates: string[];
  employees: ScheduleEmployee[];
  schedules: ScheduleItem[];
  showDefaults: boolean;
};

function organizationName(value: OrganizationValue, field: string) {
  const item = Array.isArray(value) ? value[0] : value;

  return item?.[field] || "-";
}

function weekdayNumber(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function isDefaultDayOff(date: string, weeklyHoliday: string) {
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

  const days = weeklyHoliday
    .split(",")
    .map((item) => item.trim().replace(/^วัน/, "").toLowerCase())
    .filter(Boolean)
    .map((item) => (/^[0-6]$/.test(item) ? Number(item) : names[item]));

  return days.includes(weekdayNumber(date));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function dateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function intervalText(interval: ScheduleItem["intervals"][number]) {
  const startDate = dateKey(interval.startsAt);
  const endDate = dateKey(interval.endsAt);

  const offset = Math.round(
    (Date.parse(`${endDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
      86_400_000,
  );

  return (
    `${formatTime(interval.startsAt)}–` +
    `${formatTime(interval.endsAt)}` +
    (offset > 0 ? ` (+${offset})` : "")
  );
}

function getDefaultCell(employee: ScheduleEmployee, date: string) {
  if (isDefaultDayOff(date, employee.defaults.weeklyHoliday)) {
    return {
      text: "OFF",
      isOff: true,
    };
  }

  const start = employee.defaults.startTime;
  const end = employee.defaults.endTime;

  if (!start || !end || start === end) {
    return null;
  }

  return {
    text: `${start}–${end}${end < start ? " (+1)" : ""}`,
    isOff: false,
  };
}

export default function ScheduleGrid({
  dates,
  employees,
  schedules,
  showDefaults,
}: Props) {
  const scheduleMap = new Map<string, ScheduleItem>();

  // ถ้ามีทั้งร่างและเผยแพร่ ให้แสดงร่างที่กำลังจัดก่อน
  for (const item of schedules) {
    const key = `${item.employeeId}:${item.workDate}`;
    const current = scheduleMap.get(key);

    if (!current || item.state === "DRAFT") {
      scheduleMap.set(key, item);
    }
  }

  const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const weekdayHeaderColors = [
    "bg-red-100 text-red-900", // อาทิตย์
    "bg-yellow-100 text-yellow-900", // จันทร์
    "bg-pink-100 text-pink-900", // อังคาร
    "bg-green-100 text-green-900", // พุธ
    "bg-orange-100 text-orange-900", // พฤหัสบดี
    "bg-sky-100 text-sky-900", // ศุกร์
    "bg-purple-100 text-purple-900", // เสาร์
  ];

  return (
    <div className="max-h-[65vh] overflow-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-20">
          <tr>
            <th className="sticky left-0 z-30 min-w-[240px] border-b border-r border-slate-200 bg-slate-100 px-4 py-3 text-left text-slate-800">
              พนักงาน / หน่วยงาน
            </th>

            {dates.map((date) => {
              const day = weekdayNumber(date);

              return (
                <th
                  key={date}
                  className={`min-w-[116px] border-b border-r border-slate-200 px-2 py-3 text-center ${weekdayHeaderColors[day]}`}
                >
                  {/* ตัวย่อวัน */}
                  <div className="text-xs font-medium">{weekdays[day]}</div>

                  {/* วันที่ */}
                  <div className="mt-1 font-bold">
                    {date.slice(8, 10)}/{date.slice(5, 7)}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td
                colSpan={dates.length + 1}
                className="bg-white px-4 py-16 text-center text-slate-500"
              >
                ไม่พบพนักงานตามตัวกรอง
              </td>
            </tr>
          ) : (
            employees.map((employee) => (
              <tr key={employee.id}>
                <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-4 py-3">
                  <p className="font-semibold text-slate-900">
                    {employee.name || "-"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {employee.employeeCode}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {organizationName(
                      employee.organization.department,
                      "department_name",
                    )}
                    {" / "}
                    {organizationName(employee.organization.unit, "unit_name")}
                  </p>
                </td>

                {dates.map((date) => {
                  const item = scheduleMap.get(`${employee.id}:${date}`);

                  if (item) {
                    return (
                      <td
                        key={date}
                        title={item.note || item.shiftName || ""}
                        className={`border-b border-r border-slate-200 px-2 py-3 text-center ${
                          item.dayType === "OFF"
                            ? "bg-slate-100"
                            : item.state === "DRAFT"
                              ? "bg-amber-50"
                              : "bg-emerald-50"
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900">
                          {item.dayType === "OFF"
                            ? "OFF"
                            : item.shiftName || "ทำงาน"}
                        </p>

                        {item.dayType === "WORK" && (
                          <div className="mt-1 space-y-1 text-xs text-slate-700">
                            {item.intervals.length ? (
                              item.intervals.map((interval) => (
                                <p key={interval.id}>
                                  {intervalText(interval)}
                                </p>
                              ))
                            ) : (
                              <p className="text-rose-600">ยังไม่ระบุเวลา</p>
                            )}
                          </div>
                        )}

                        <p
                          className={`mt-1 text-[10px] ${
                            item.state === "DRAFT"
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {item.state === "DRAFT" ? "ร่าง" : "เผยแพร่"}
                        </p>
                      </td>
                    );
                  }

                  const preview = showDefaults
                    ? getDefaultCell(employee, date)
                    : null;

                  return (
                    <td
                      key={date}
                      className={`border-b border-r border-slate-200 px-2 py-3 text-center ${
                        preview
                          ? preview.isOff
                            ? "bg-slate-50"
                            : "bg-sky-50/60"
                          : "bg-white"
                      }`}
                    >
                      {preview ? (
                        <>
                          <p className="text-xs font-semibold text-slate-700">
                            {preview.text}
                          </p>

                          <p className="mt-1 text-[10px] text-sky-700">
                            ข้อมูลจาก Settings
                          </p>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
