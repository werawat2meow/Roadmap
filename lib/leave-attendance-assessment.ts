import "server-only";

import { supabaseAdmin } from "@/lib/supabaseServer";
import { readAllScheduleRows } from "@/lib/leave-schedule-query";

type Interval = {
  sequence: number;
  starts_at: string;
  ends_at: string;
};

type Schedule = {
  id: string;
  employee_id: string;
  work_date: string;
  day_type: string;
  leave_work_schedule_intervals: Interval[];
};

type Attendance = {
  employee_id: string;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
};

type ApprovedLeave = {
  id: string;
  employeeId: string;
  kind: string;
  startDate: string;
  endDate: string;
  session: string | null;
  requestedDays: number | string | null;
};

export type AttendanceAssessment = {
  employeeId: string;
  workDate: string;

  scheduledType: string | null;
  expectedIn: string | null;
  expectedOut: string | null;

  checkIn: string | null;
  checkOut: string | null;

  leaveKinds: string[];
  leaveDays: number | null;

  lateMinutes: number | null;
  earlyMinutes: number | null;

  text: string;
  warnings: string[];
};

const labels: Record<string, string> = {
  ANNUAL: "ลาพักร้อน",
  SICK: "ลาป่วย",
  BUSINESS: "ลากิจ",
  ANNUAL_HOLIDAY: "วันหยุดประจำปี",
  BIRTHDAY: "ลาวันเกิด",
  ORDAIN: "ลาบวช",
  MATERNITY: "ลาคลอด",
  UNPAID: "ลาไม่รับค่าจ้าง",
};

function bangkokDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`วันที่ไม่ถูกต้อง: ${value}`);
  }

  return new Date(date.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function key(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}

function dateList(from: string, to: string): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start.toISOString().slice(0, 10) !== from ||
    end.toISOString().slice(0, 10) !== to ||
    start > end
  ) {
    throw new Error("ช่วงวันที่ไม่ถูกต้อง");
  }

  const days: string[] = [];

  for (
    let value = start.getTime();
    value <= end.getTime();
    value += 86400000
  ) {
    days.push(new Date(value).toISOString().slice(0, 10));

    if (days.length > 366) {
      throw new Error("เลือกช่วงรายงานได้ไม่เกิน 366 วัน");
    }
  }

  return days;
}

function clockAt(date: string, clock: string): number {
  const match = clock.match(
    /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.\d+)?)?$/,
  );

  if (!match) throw new Error(`เวลาไม่ถูกต้อง: ${clock}`);

  return new Date(
    `${date}T${match[1]}:${match[2]}:${match[3] || "00"}+07:00`,
  ).getTime();
}

function displayTime(timestamp: number): string {
  return new Date(timestamp + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(11, 16);
}

// เปลี่ยนที่ฟังก์ชันนี้ หากแต่ละกะมีจุดแบ่งครึ่งวันต่างกัน
function halfDayBoundary(workDate: string): number {
  return clockAt(workDate, "13:00");
}

export async function assessAttendanceRange(
  employeeIds: string[],
  from: string,
  to: string,
): Promise<AttendanceAssessment[]> {
  const dates = dateList(from, to);
  const ids = [...new Set(employeeIds)];

  const schedules: Schedule[] = [];
  const attendance: Attendance[] = [];
  const leaves: ApprovedLeave[] = [];

  const endExclusive = new Date(
    new Date(`${to}T00:00:00+07:00`).getTime() + 86400000,
  ).toISOString();

  // แบ่งชุดเพื่อไม่ให้ URL ของ Supabase ยาวเกินไป
  for (let offset = 0; offset < ids.length; offset += 100) {
    const chunk = ids.slice(offset, offset + 100);

    const [scheduleRows, attendanceRows, leaveRows] = await Promise.all([
      readAllScheduleRows<Schedule>(
        supabaseAdmin
          .from("leave_work_schedule_days")
          .select(`
            id,
            employee_id,
            work_date,
            day_type,
            leave_work_schedule_intervals(
              sequence,
              starts_at,
              ends_at
            )
          `)
          .in("employee_id", chunk)
          .eq("state", "PUBLISHED")
          .gte("work_date", from)
          .lte("work_date", to)
          .order("id"),
      ),

      readAllScheduleRows<Attendance>(
        supabaseAdmin
          .from("leave_attendance_records")
          .select("employee_id,work_date,check_in,check_out")
          .in("employee_id", chunk)
          .gte("work_date", from)
          .lte("work_date", to)
          .order("id"),
      ),

      // ดึงใบลาแยกจากตัวกรองบนหน้า Reports
      // เพื่อไม่ให้เลือกตัวกรอง Pending แล้วใบลา Approved หายจาก Excel
      readAllScheduleRows<ApprovedLeave>(
        supabaseAdmin
          .from("leave_requests")
          .select(`
            id,employeeId,kind,startDate,endDate,session,requestedDays
          `)
          .in("employeeId", chunk)
          .eq("status", "APPROVED")
          .lt("startDate", endExclusive)
          .gte("endDate", `${from}T00:00:00+07:00`)
          .order("id"),
      ),
    ]);

    schedules.push(...scheduleRows);
    attendance.push(...attendanceRows);
    leaves.push(...leaveRows);
  }

  const scheduleMap = new Map(
    schedules.map((row) => [
      key(row.employee_id, bangkokDate(row.work_date)),
      row,
    ]),
  );

  const attendanceMap = new Map(
    attendance.map((row) => [
      key(row.employee_id, bangkokDate(row.work_date)),
      row,
    ]),
  );

  const leaveMap = new Map<string, ApprovedLeave[]>();
  const uncertainLeaveIds = new Set<string>();

  for (const leave of leaves) {
    const start = bangkokDate(leave.startDate);
    const end = bangkokDate(leave.endDate);

    const calendarDays =
      (Date.parse(`${end}T00:00:00Z`) -
        Date.parse(`${start}T00:00:00Z`)) /
        86400000 +
      1;

    const session = leave.session || "FULL";
    const expectedDays =
      calendarDays * (session === "FULL" ? 1 : 0.5);

    // หากยอดใบลาไม่ได้กระจายตามวันปฏิทิน
    // ห้ามเดาว่าต้องนับวันไหนเป็นวันลา
    if (
      !["FULL", "AM", "PM"].includes(session) ||
      leave.requestedDays === null ||
      !Number.isFinite(Number(leave.requestedDays)) ||
      Math.abs(Number(leave.requestedDays) - expectedDays) > 0.001
    ) {
      uncertainLeaveIds.add(leave.id);
    }

    for (const date of dates) {
      if (date < start || date > end) continue;

      const mapKey = key(leave.employeeId, date);
      const current = leaveMap.get(mapKey) || [];
      current.push(leave);
      leaveMap.set(mapKey, current);
    }
  }

  const results: AttendanceAssessment[] = [];

  for (const employeeId of ids) {
    for (const workDate of dates) {
      const mapKey = key(employeeId, workDate);
      const schedule = scheduleMap.get(mapKey);
      const scan = attendanceMap.get(mapKey);
      const dayLeaves = leaveMap.get(mapKey) || [];

      const warnings: string[] = [];
      const hasScan = Boolean(scan?.check_in || scan?.check_out);

      const intervals = [...(
        schedule?.leave_work_schedule_intervals || []
      )].sort((a, b) => a.sequence - b.sequence);

      let expectedStart: number | null = null;
      let expectedEnd: number | null = null;

      if (schedule?.day_type === "WORK") {
        if (intervals.length === 1) {
          expectedStart = Date.parse(intervals[0].starts_at);
          expectedEnd = Date.parse(intervals[0].ends_at);

          if (
            !Number.isFinite(expectedStart) ||
            !Number.isFinite(expectedEnd) ||
            expectedEnd <= expectedStart
          ) {
            expectedStart = null;
            expectedEnd = null;
            warnings.push("ช่วงเวลาตารางงานไม่ถูกต้อง");
          }
        } else if (intervals.length > 1) {
          warnings.push(
            "งานหลายช่วง: ข้อมูลสแกนหนึ่งคู่ยังตรวจเวลาแต่ละช่วงไม่ได้",
          );
        } else {
          warnings.push("ตารางวันทำงานไม่มีช่วงเวลา");
        }
      }

      let leaveDays: number | null = 0;

      const fullLeave = dayLeaves.some(
        (leave) => (leave.session || "FULL") === "FULL",
      );
      const amLeave = dayLeaves.some((leave) => leave.session === "AM");
      const pmLeave = dayLeaves.some((leave) => leave.session === "PM");

      const uncertainLeave = dayLeaves.some(
        (leave) => uncertainLeaveIds.has(leave.id),
      );

      const overlappingLeave =
        (fullLeave && dayLeaves.length > 1) ||
        dayLeaves.filter((leave) => leave.session === "AM").length > 1 ||
        dayLeaves.filter((leave) => leave.session === "PM").length > 1;

      if (uncertainLeave || overlappingLeave) {
        leaveDays = null;
        warnings.push("ตรวจสอบการกระจายวันลา/ใบลาซ้อนกัน");
      } else if (fullLeave || (amLeave && pmLeave)) {
        leaveDays = 1;
      } else if (amLeave || pmLeave) {
        leaveDays = 0.5;
      }

      const allDayLeave =
        !uncertainLeave &&
        !overlappingLeave &&
        (fullLeave || (amLeave && pmLeave));

      if (
        !allDayLeave &&
        (amLeave || pmLeave) &&
        expectedStart !== null &&
        expectedEnd !== null
      ) {
        const boundary = halfDayBoundary(workDate);

        if (boundary <= expectedStart || boundary >= expectedEnd) {
          warnings.push("จุดแบ่งครึ่งวัน 13:00 อยู่นอกช่วงกะ ต้องตรวจสอบ");
          expectedStart = null;
          expectedEnd = null;
        } else if (amLeave) {
          expectedStart = boundary;
        } else if (pmLeave) {
          expectedEnd = boundary;
        }
      }

      let lateMinutes: number | null = null;
      let earlyMinutes: number | null = null;
      let text = "";

      if (!schedule) warnings.push("ยังไม่จัดตาราง");

      const leaveText = dayLeaves
        .map((leave) => {
          const session = leave.session || "FULL";
          const suffix =
            session === "AM"
              ? "ครึ่งวันเช้า"
              : session === "PM"
                ? "ครึ่งวันบ่าย"
                : "เต็มวัน";

          return `${labels[leave.kind] || leave.kind} ${suffix}`;
        })
        .join(", ");

      if (allDayLeave) {
        text = leaveText;

        if (hasScan) {
          warnings.push("ลาอนุมัติแต่พบสแกน รอ HR ตรวจสอบ");
        }
      } else if (uncertainLeave || overlappingLeave) {
        text = `${leaveText} — รอ HR ตรวจสอบวันลา`;
      } else if (schedule?.day_type === "OFF") {
        text = leaveText ? `${leaveText} / OFF` : "OFF";
        if (hasScan) warnings.push("วันหยุดแต่พบสแกน");
      } else {
        const parts: string[] = [];

        if (leaveText) parts.push(leaveText);

        if (!scan || !hasScan) {
          parts.push("ยังไม่มีข้อมูลสแกน");
        } else if (!scan.check_in || !scan.check_out) {
          parts.push("สแกนเข้า/ออกไม่ครบ");
        } else if (
          expectedStart === null ||
          expectedEnd === null
        ) {
          parts.push("มีสแกน แต่ยังประเมินเวลาไม่ได้");
        } else {
          const actualStart = clockAt(workDate, scan.check_in);
          const actualEnd = clockAt(workDate, scan.check_out);

          const overnight =
            bangkokDate(new Date(expectedEnd).toISOString()) > workDate;

          if (overnight) {
            // time-only ไม่บอกว่าสแกนอยู่วันไหน
            // ไม่เดาว่าสแกนเช้าคือเข้าก่อนกะหรือเข้าช้าวันถัดไป
            parts.push("กะข้ามคืน: รอตรวจวันที่จริงของสแกน");
            warnings.push("ข้อมูลสแกนมีเฉพาะเวลา ยังยืนยันวันที่ของกะข้ามคืนไม่ได้");
          } else if (actualEnd <= actualStart) {
            parts.push("เวลาออกไม่อยู่หลังเวลาเข้า ต้องตรวจสอบ");
            warnings.push("ตรวจสอบวันและเวลาเข้า–ออกของสแกน");
          } else {
            lateMinutes = Math.max(
              0,
              Math.ceil((actualStart - expectedStart) / 60000),
            );

            earlyMinutes = Math.max(
              0,
              Math.ceil((expectedEnd - actualEnd) / 60000),
            );

            if (lateMinutes > 0) {
              parts.push(`สาย ${lateMinutes} นาที`);
            }

            if (earlyMinutes > 0) {
              parts.push(`ออกก่อน ${earlyMinutes} นาที`);
            }

            if (lateMinutes === 0 && earlyMinutes === 0) {
              parts.push("เข้า–ออกตามเวลา");
            }
          }
        }

        text = parts.join(" / ");
      }

      results.push({
        employeeId,
        workDate,
        scheduledType: schedule?.day_type || null,
        expectedIn:
          expectedStart === null ? null : displayTime(expectedStart),
        expectedOut:
          expectedEnd === null ? null : displayTime(expectedEnd),
        checkIn: scan?.check_in || null,
        checkOut: scan?.check_out || null,
        leaveKinds: [...new Set(dayLeaves.map((leave) => leave.kind))],
        leaveDays,
        lateMinutes,
        earlyMinutes,
        text,
        warnings,
      });
    }
  }

  return results;
}
