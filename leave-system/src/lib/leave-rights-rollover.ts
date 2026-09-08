import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  computeCarryForwardAnnualExpiry,
  computeCarryForwardHolidayExpiry,
} from "@/lib/carry-forward-expiry";
import { computeAnnualCarryForwardBucketExpiresAt } from "@/lib/annual-carry-forward-buckets";

function toInt(x: unknown) {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

/** ดึงข้อมูลพนักงานจาก Supabase ที่จำเป็นสำหรับการคำนวณ leave rights */
async function fetchEmpForRights(employeeId: string) {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("hire_date, positions(position_level)")
    .eq("id", employeeId)
    .maybeSingle();
  if (error) throw new Error(`Supabase error fetching employee ${employeeId}: ${error.message}`);
  if (!data) throw new Error(`Employee not found (id=${employeeId})`);
  const startDate = data.hire_date ? new Date(data.hire_date as string) : null;
  const levelP: string | null = (data.positions as any)?.position_level ?? null;
  return { startDate, levelP };
}

export async function ensureLeaveRightsForYear(
  employeeId: string,
  year: number
) {
  const existing = await prisma.leaveRights.findUnique({
    where: { employeeId_year: { employeeId, year } },
  });
  // NOTE: Even if the LeaveRights row already exists, we may still need to
  // bootstrap the annual carry-forward bucket for employees who started in (year - 1)
  // and therefore had no previous-year LeaveRights record at the time the row was created.
  if (existing) {
    const { startDate, levelP } = await fetchEmpForRights(employeeId);

    const templateKey = levelP || null;
    const template = templateKey
      ? await prisma.leaveRightsTemplate.findFirst({
          where: { prefix: templateKey },
        })
      : null;

    const prev = await prisma.leaveRights.findUnique({
      where: { employeeId_year: { employeeId, year: year - 1 } },
    });

    const employeeStartYear = startDate ? startDate.getFullYear() : null;
    const bootstrapAnnualCarryForward =
      !prev && employeeStartYear === year - 1
        ? toInt(template?.vacationLeaveDays ?? 0)
        : 0;

    const carryForwardAnnual = prev
      ? toInt(prev?.vacationLeave ?? 0)
      : bootstrapAnnualCarryForward;

    const annualBucketExpiresAt = computeAnnualCarryForwardBucketExpiresAt(
      startDate,
      year - 1
    );

    if (carryForwardAnnual > 0 && annualBucketExpiresAt) {
      await prisma.leaveCarryForwardBucket.upsert({
        where: {
          employeeId_originYear: { employeeId, originYear: year - 1 },
        },
        update: {},
        create: {
          employeeId,
          originYear: year - 1,
          remaining: carryForwardAnnual,
          expiresAt: annualBucketExpiresAt,
        },
      });
    }

    // Sync template values to existing row in case template was updated after row creation.
    // For vacation/holiday: only update if remaining >= template value (no deduction has happened).
    // For other quota types: sync unconditionally since they reset each year.
      if (template) {
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year + 1}-01-01`);
      const [annualAgg, holidayAgg] = await Promise.all([
        prisma.leaveRequest.aggregate({
          where: {
            employeeId,
            status: "APPROVED",
            kind: "ANNUAL",
            startDate: { gte: yearStart, lt: yearEnd },
          },
          _sum: { requestedDays: true },
        }),
        prisma.leaveRequest.aggregate({
          where: {
            employeeId,
            status: "APPROVED",
            kind: "ANNUAL_HOLIDAY",
            startDate: { gte: yearStart, lt: yearEnd },
          },
          _sum: { requestedDays: true },
        }),
      ]);
      const actualUsedAnnual = toInt(annualAgg._sum.requestedDays ?? 0);
      const actualUsedHoliday = toInt(holidayAgg._sum.requestedDays ?? 0);
      await prisma.leaveRights.update({
        where: { employeeId_year: { employeeId, year } },
        data: {
          vacationLeave: Math.max(0, toInt(template.vacationLeaveDays) - actualUsedAnnual),
          holidayLeave: Math.max(0, toInt(template.holidayLeaveDays) - actualUsedHoliday),
          sickLeave: toInt(template.sickLeaveDays),
          businessLeave: toInt(template.businessLeaveDays),
          birthdayLeave: toInt(template.birthdayLeaveDays),
          unpaidLeave: toInt(template.unpaidLeaveDays),
          ordainLeave: toInt(template.ordainLeaveDays),
          maternityLeave: toInt(template.maternityLeaveDays),
        },
      });
    }

    return existing;
  }

  const { startDate, levelP } = await fetchEmpForRights(employeeId);

  const templateKey = levelP || null;
  const template = templateKey
    ? await prisma.leaveRightsTemplate.findFirst({
        where: { prefix: templateKey },
      })
    : null;

  const prev = await prisma.leaveRights.findUnique({
    where: { employeeId_year: { employeeId, year: year - 1 } },
  });

  // ✅ Carry forward should come from the *remaining* balance of the previous year.
  // In this codebase vacationLeave / holidayLeave are decremented on approval and represent remaining.
  //
  // Bootstrap for new employees:
  // If there is no previous-year LeaveRights record yet, but the employee started in (year - 1),
  // they should still receive annual entitlement for the start year (rights earned "ย้อนหลัง 1 ปี")
  // which becomes usable on the first anniversary.
  const employeeStartYear = startDate ? startDate.getFullYear() : null;
  const bootstrapAnnualCarryForward =
    !prev && employeeStartYear === year - 1
      ? toInt(template?.vacationLeaveDays ?? 0)
      : 0;

  const carryForwardAnnual = prev
    ? toInt(prev?.vacationLeave ?? 0)
    : bootstrapAnnualCarryForward;
  const carryForwardHoliday = toInt(prev?.holidayLeave ?? 0);

  const annualBucketExpiresAt = computeAnnualCarryForwardBucketExpiresAt(
    startDate,
    year - 1
  );

  const carryForwardAnnualExpiry = computeCarryForwardAnnualExpiry(
    startDate,
    year
  );
  const carryForwardHolidayExpiry = computeCarryForwardHolidayExpiry(year);

  const [rights] = await prisma.$transaction([
    prisma.leaveRights.upsert({
      where: { employeeId_year: { employeeId, year } },
      update: {},
      create: {
        employeeId,
        year,

        annualLeave: toInt(template?.annualLeaveDays ?? 0),
        holidayLeave: toInt(template?.holidayLeaveDays ?? 0),
        vacationLeave: toInt(template?.vacationLeaveDays ?? 0),
        businessLeave: toInt(template?.businessLeaveDays ?? 0),
        sickLeave: toInt(template?.sickLeaveDays ?? 0),
        ordainLeave: toInt(template?.ordainLeaveDays ?? 0),
        maternityLeave: toInt(template?.maternityLeaveDays ?? 0),
        unpaidLeave: toInt(template?.unpaidLeaveDays ?? 0),
        birthdayLeave: toInt(template?.birthdayLeaveDays ?? 0),

        // Legacy fields (kept for backward compatibility)
        carryForwardAnnual,
        carryForwardAnnualExpiry,
        carryForwardHoliday,
        carryForwardHolidayExpiry,
      },
    }),
    ...(carryForwardAnnual > 0 && annualBucketExpiresAt
      ? [
          prisma.leaveCarryForwardBucket.upsert({
            where: {
              employeeId_originYear: { employeeId, originYear: year - 1 },
            },
            update: {},
            create: {
              employeeId,
              originYear: year - 1,
              remaining: carryForwardAnnual,
              expiresAt: annualBucketExpiresAt,
            },
          }),
        ]
      : []),
  ]);

  return rights;
}
