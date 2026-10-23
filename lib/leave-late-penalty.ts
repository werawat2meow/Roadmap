import "server-only";

import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  assessAttendanceRange,
  type AttendanceAssessment,
} from "@/lib/leave-attendance-assessment";

export type LatePenaltySummary = {
  periodStart: string;
  periodEnd: string;
  totalLateMinutes: number;
  result: string;
  needsReview: boolean;
  provisional: boolean;
};

// ใช้ UTC สำหรับเลื่อนวัน เพื่อไม่ให้ขึ้นกับ timezone ของ server
function dateOnly(year: number, monthIndex: number, day: number) {
  return new Date(Date.UTC(year, monthIndex, day))
    .toISOString()
    .slice(0, 10);
}

// เช่น 2026-10-20 อยู่ในรอบ 2026-09-21 ถึง 2026-10-20
// ส่วน 2026-10-21 อยู่ในรอบ 2026-10-21 ถึง 2026-11-20
function getPeriod(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const startMonthIndex = month - 1 - (day < 21 ? 1 : 0);

  return {
    start: dateOnly(year, startMonthIndex, 21),
    end: dateOnly(year, startMonthIndex + 1, 20),
  };
}

function nextPeriodStart(value: string) {
  const [year, month] = value.split("-").map(Number);
  return dateOnly(year, month, 21);
}

function needsLateReview(item: AttendanceAssessment) {
  // ระบบประเมินนาทีสายได้แล้ว
  if (item.lateMinutes !== null) return false;

  // วันหยุดหรือวันลาเต็มวัน ไม่ถือว่าสาย
  if (item.scheduledType === "OFF" || item.leaveDays === 1) {
    return false;
  }

  // เช่น มีสแกนแต่ไม่มีตาราง, สแกนไม่ครบ,
  // วันทำงานที่ยังไม่มีสแกน หรือใบลาที่ยังประเมินไม่ได้
  return (
    item.scheduledType === "WORK" ||
    Boolean(item.checkIn || item.checkOut) ||
    item.leaveDays === null
  );
}

function getResult(
  minutes: number,
  warningNumber: number | null,
  needsReview: boolean,
) {
  // ตั้งแต่ 101 นาที เข้าเกณฑ์แน่นอน แม้ยังมีวันรอตรวจสอบ
  if (minutes >= 101) {
    return warningNumber === null
      ? "เข้าเกณฑ์ใบเตือน — ตรวจสอบประวัติก่อนระบุครั้ง"
      : `ใบเตือนครั้งที่ ${warningNumber}`;
  }

  // ไม่สรุปโทษจากยอดที่อาจยังขาด
  if (needsReview) return "รอตรวจสอบข้อมูลสาย";

  if (minutes >= 91) return "ว.93";
  if (minutes >= 61) return "ว.92";
  if (minutes >= 31) return "ว.91";

  return "ไม่เข้าเกณฑ์ลงโทษ";
}

export async function buildLatePenaltySummaries(
  employeeIds: string[],
  from: string,
  to: string,
): Promise<Map<string, LatePenaltySummary[]>> {
  const ids = [...new Set(employeeIds)];
  const summaries = new Map<string, LatePenaltySummary[]>(
    ids.map((id) => [id, []]),
  );

  const firstSelectedPeriod = getPeriod(from);
  const lastSelectedPeriod = getPeriod(to);

  const today = new Date(Date.now() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // แบ่งพนักงานเป็นชุด ป้องกัน URL query ยาวเกินไป
  for (let offset = 0; offset < ids.length; offset += 100) {
    const chunk = ids.slice(offset, offset + 100);

    // หาจุดเริ่มต้นของประวัติสแกนที่มีในระบบ
    // อ่านเฉพาะพนักงานที่ API อนุญาตให้ผู้ใช้เห็นแล้ว
    const { data, error } = await supabaseAdmin
      .from("leave_attendance_records")
      .select("work_date")
      .in("employee_id", chunk)
      .lte("work_date", lastSelectedPeriod.end)
      .order("work_date", { ascending: true })
      .limit(1);

    if (error) throw new Error(error.message);

    const earliestDate = data?.[0]?.work_date as string | undefined;
    const earliestPeriod = earliestDate
      ? getPeriod(earliestDate).start
      : firstSelectedPeriod.start;

    let periodStart =
      earliestPeriod < firstSelectedPeriod.start
        ? earliestPeriod
        : firstSelectedPeriod.start;

    // ทั้งสอง Map แยกยอดด้วย employeeId
    const warningCounts = new Map<string, number>(
      chunk.map((id) => [id, 0]),
    );
    const uncertainHistory = new Set<string>();

    // ประเมินทีละรอบ เพื่อไม่ชนข้อจำกัด 366 วันของระบบเดิม
    while (periodStart <= lastSelectedPeriod.start) {
      const period = getPeriod(periodStart);
      const assessmentEnd = period.end < today ? period.end : today;

      const dailyResults =
        period.start <= assessmentEnd
          ? await assessAttendanceRange(
              chunk,
              period.start,
              assessmentEnd,
            )
          : [];

      const totals = new Map<string, number>(
        chunk.map((id) => [id, 0]),
      );
      const reviewIds = new Set<string>();

      for (const item of dailyResults) {
        // รวมเฉพาะนาทีสาย ไม่รวม earlyMinutes
        if (item.lateMinutes !== null) {
          totals.set(
            item.employeeId,
            (totals.get(item.employeeId) || 0) +
              Math.max(0, item.lateMinutes),
          );
        }

        if (needsLateReview(item)) {
          reviewIds.add(item.employeeId);
        }
      }

      for (const employeeId of chunk) {
        const totalLateMinutes = totals.get(employeeId) || 0;
        const needsReview = reviewIds.has(employeeId);
        const previousCount = warningCounts.get(employeeId) || 0;

        let warningNumber: number | null = null;

        if (totalLateMinutes >= 101) {
          // หนึ่งคน หนึ่งรอบ เพิ่มได้หนึ่งครั้ง
          const nextCount = previousCount + 1;
          warningCounts.set(employeeId, nextCount);

          // หากรอบเก่ายังประเมินไม่ได้ ห้ามเดาเลขครั้งใบเตือน
          if (!uncertainHistory.has(employeeId)) {
            warningNumber = nextCount;
          }
        }

        if (period.start >= firstSelectedPeriod.start) {
          const result =
            period.start > today
              ? "ยังไม่ถึงรอบ"
              : getResult(
                  totalLateMinutes,
                  warningNumber,
                  needsReview,
                );

          summaries.get(employeeId)!.push({
            periodStart: period.start,
            periodEnd: period.end,
            totalLateMinutes,
            result,
            needsReview,
            provisional: period.end > today,
          });
        }

        // รอบนี้อาจเข้าเกณฑ์ใบเตือนได้หลังตรวจข้อมูลที่ขาด
        // จึงทำให้เลขครั้งในรอบถัดไปยังยืนยันไม่ได้
        if (needsReview && totalLateMinutes < 101) {
          uncertainHistory.add(employeeId);
        }
      }

      periodStart = nextPeriodStart(periodStart);
    }
  }

  return summaries;
}