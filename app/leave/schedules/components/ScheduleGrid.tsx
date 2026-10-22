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

export type ScheduleLeave = {
  id: string;
  employeeId: string;
  kind: string;
  startDate: string;
  endDate: string;
  session: "FULL" | "AM" | "PM";
  requestedDays: number;
  status: "APPROVED" | "PENDING";
};

export type ScheduleCellSelection = {
  employee: ScheduleEmployee;
  date: string;
  item: ScheduleItem | null;
  defaultDayOff: boolean;
};

type Props = {
  dates: string[];
  employees: ScheduleEmployee[];
  schedules: ScheduleItem[];
  leaves: ScheduleLeave[];
  onSelectCell: (selection: ScheduleCellSelection) => void;
  selectedEmployeeIds?: string[];
  selectedDates?: string[];
  pendingKeys?: string[];
  onToggleEmployee?: (employeeId: string) => void;
  onToggleDate?: (date: string) => void;
};

function organizationName(value: OrganizationValue, field: string) {
  const item = Array.isArray(value) ? value[0] : value;

  return item?.[field] || "-";
}

function weekdayNumber(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
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


const leaveKindLabels: Record<string, string> = {
  ANNUAL: "ลาพักร้อน",
  SICK: "ลาป่วย",
  BUSINESS: "ลากิจ",
  ANNUAL_HOLIDAY: "วันหยุดประจำปี",
  BIRTHDAY: "ลาวันเกิด",
  ORDAIN: "ลาบวช",
  MATERNITY: "ลาคลอด",
  UNPAID: "ลาไม่รับค่าจ้าง",
};

function formatDays(value: number) {
  return value.toLocaleString("th-TH", {
    maximumFractionDigits: 2,
  });
}

// นับเฉพาะส่วนของใบลาที่อยู่ในรอบนี้
// ครึ่งวัน: วันแรก 0.5 วัน วันที่เหลือวันละ 1 วัน
function leaveDaysInPeriod(
  leave: ScheduleLeave,
  dates: string[],
): number | null {
  const start = dateKey(leave.startDate);
  const end = dateKey(leave.endDate);

  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    endTime < startTime
  ) {
    return null;
  }

  const calendarDays = Math.round((endTime - startTime) / 86_400_000) + 1;

  const isHalfDay = leave.session === "AM" || leave.session === "PM";

  const expectedDays = calendarDays - (isHalfDay ? 0.5 : 0);

  // หากข้อมูลเก่าใช้วิธีนับต่างกัน อย่ากระจายยอดเองจนผิดรอบ
  if (
    !Number.isFinite(leave.requestedDays) ||
    Math.abs(expectedDays - leave.requestedDays) > 0.001
  ) {
    return null;
  }

  return dates.reduce((total, date) => {
    if (date < start || date > end) return total;

    return total + (date === start && isHalfDay ? 0.5 : 1);
  }, 0);
}

function EmployeePeriodSummary({
  employee,
  dates,
  scheduleMap,
}: {
  employee: ScheduleEmployee;
  dates: string[];
  scheduleMap: Map<string, ScheduleItem>;
}) {
  let workDays = 0;
  let offDays = 0;

  for (const date of dates) {
    const item = scheduleMap.get(`${employee.id}:${date}`);

    // ใช้ข้อมูลเดียวกับที่แสดงในช่องตาราง
    if (item) {
      if (item.dayType === "OFF") {
        offDays += 1;
      } else {
        workDays += 1;
      }

      continue;
    }

  }

  return (
    <td className="min-w-[220px] border-b border-l border-slate-200 bg-white px-4 py-3 align-middle text-xs text-slate-900">
      <div className="space-y-2">
        <div className="flex justify-between gap-4">
          <span>ทำงานตามตาราง</span>
          <strong>{workDays} วัน</strong>
        </div>

        <div className="flex justify-between gap-4">
          <span>หยุดประจำสัปดาห์</span>
          <strong>{offDays} วัน</strong>
        </div>
      </div>
    </td>
  );
}

export default function ScheduleGrid({
  dates,
  employees,
  schedules,
  onSelectCell,
  selectedEmployeeIds = [],
  selectedDates = [],
  pendingKeys = [],
  onToggleEmployee,
  onToggleDate,
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
                  {onToggleDate && (
                    <input
                      type="checkbox"
                      checked={selectedDates.includes(date)}
                      onChange={() => onToggleDate(date)}
                      aria-label={`เลือกวันที่ ${date}`}
                      className="mb-1 h-4 w-4 accent-emerald-600"
                    />
                  )}
                  {/* ตัวย่อวัน */}
                  <div className="text-xs font-medium">{weekdays[day]}</div>

                  {/* วันที่ */}
                  <div className="mt-1 font-bold">
                    {date.slice(8, 10)}/{date.slice(5, 7)}
                  </div>
                </th>
              );
            })}
            <th className="min-w-[220px] border-b border-l border-slate-200 bg-slate-800 px-4 py-3 text-left text-white">
              <div className="font-bold">สรุปรอบเดือน</div>
              <div className="mt-1 text-[10px] font-normal text-slate-200">
                จำนวนวันตามตารางที่แสดง
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {employees.length === 0 ? (
            <tr>
              <td
                colSpan={dates.length + 2}
                className="bg-white px-4 py-16 text-center text-slate-500"
              >
                ไม่พบพนักงานตามตัวกรอง
              </td>
            </tr>
          ) : (
            employees.map((employee) => (
              <tr key={employee.id}>
                <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-4 py-3">
                  {onToggleEmployee && (
                    <label className="mb-2 flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(employee.id)}
                        onChange={() => onToggleEmployee(employee.id)}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      เลือกคนนี้
                    </label>
                  )}
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

                  const openEditor = () => {
                    onSelectCell({
                      employee,
                      date,
                      item: item || null,
                      defaultDayOff: false,
                    });
                  };

                  const cellInteraction = {
                    onClick: openEditor,
                    tabIndex: 0,
                    "aria-label": `จัดตาราง ${
                      employee.name || employee.employeeCode
                    } วันที่ ${date}`,
                    onKeyDown: (
                      event: import("react").KeyboardEvent<HTMLTableCellElement>,
                    ) => {
                      if (
                        event.target === event.currentTarget &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        openEditor();
                      }
                    },
                  };

                  if (item) {
                    return (
                      <td
                        key={date}
                        {...cellInteraction}
                        title={item.note || item.shiftName || ""}
                        className={`border-b border-r border-slate-200 px-2 py-3 text-center cursor-pointer ${
                          pendingKeys.includes(`${employee.id}:${date}`)
                            ? "ring-2 ring-inset ring-orange-400"
                            : ""
                        } ${
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
                          {pendingKeys.includes(`${employee.id}:${date}`)
                            ? "ยังไม่บันทึก"
                            : item.state === "DRAFT"
                              ? "ร่าง"
                              : "บันทึกแล้ว"}
                        </p>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={date}
                      {...cellInteraction}
                      className="cursor-pointer border-b border-r border-slate-200 bg-white px-2 py-3 text-center hover:ring-2 hover:ring-inset hover:ring-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
                    >
                      <span className="text-slate-400">—</span>
                    </td>
                  );
                })}
                <EmployeePeriodSummary
                  employee={employee}
                  dates={dates}
                  scheduleMap={scheduleMap}
                />
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
