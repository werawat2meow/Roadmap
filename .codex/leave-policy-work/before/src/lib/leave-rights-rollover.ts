import { prisma } from "@/lib/prisma";
import { supabaseAdmin, getEmployeeLevelCode } from "@/lib/supabaseAdmin";
import {
  computeCarryForwardAnnualExpiry,
  computeCarryForwardHolidayExpiry,
} from "@/lib/carry-forward-expiry";
import { computeAnnualCarryForwardBucketExpiresAt } from "@/lib/annual-carry-forward-buckets";

function toDays(x: unknown) {
  const n = typeof x === "number" ? x : Number(x);

  return Number.isFinite(n)
    ? Math.round(n * 100) / 100
    : 0;
}

/** ดึงข้อมูลพนักงานจาก Supabase ที่จำเป็นสำหรับการคำนวณ leave rights */
async function fetchEmpForRights(employeeId: string) {
  const { data, error } = await supabaseAdmin
    .from("employees")
    .select(
      `start_work_date,
       position_levels(level_code),
       positions(position_level_mappings(is_default, position_levels(level_code)))`
    )
    .eq("id", employeeId)
    .maybeSingle();
  if (error) throw new Error(`Supabase error fetching employee ${employeeId}: ${error.message}`);
  if (!data) throw new Error(`Employee not found (id=${employeeId})`);
  const startDate = data.start_work_date
  ? new Date(data.start_work_date as string)
  : null;
  const levelP: string | null = getEmployeeLevelCode(data);
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
        ? toDays(template?.vacationLeaveDays ?? 0)
        : 0;

    const carryForwardAnnual = prev
      ? toDays(prev?.vacationLeave ?? 0)
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
      ? toDays(template?.vacationLeaveDays ?? 0)
      : 0;

  const carryForwardAnnual = prev
    ? toDays(prev?.vacationLeave ?? 0)
    : bootstrapAnnualCarryForward;
  const carryForwardHoliday = toDays(prev?.holidayLeave ?? 0);

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

        annualLeave: toDays(template?.annualLeaveDays ?? 0),
        holidayLeave: toDays(template?.holidayLeaveDays ?? 0),
        vacationLeave: toDays(template?.vacationLeaveDays ?? 0),
        businessLeave: toDays(template?.businessLeaveDays ?? 0),
        sickLeave: toDays(template?.sickLeaveDays ?? 0),
        ordainLeave: toDays(template?.ordainLeaveDays ?? 0),
        maternityLeave: toDays(template?.maternityLeaveDays ?? 0),
        unpaidLeave: toDays(template?.unpaidLeaveDays ?? 0),
        birthdayLeave: toDays(template?.birthdayLeaveDays ?? 0),

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
