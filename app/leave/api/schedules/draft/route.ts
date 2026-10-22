import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { leaveScheduleDb } from "@/lib/leave-schedule-db";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { applyEmployeeScope } from "@/lib/auth/requireScopedAccess";
import { getLeaveSchedulePeriod } from "@/lib/leave-schedule-period";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

class SaveError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readDate(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new SaveError("วันที่ไม่ถูกต้อง", 400);
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new SaveError("วันที่ไม่ถูกต้อง", 400);
  }

  const year = Number(value.slice(0, 4));

  if (year < 1900 || year > 9998) {
    throw new SaveError("ปีไม่ถูกต้อง", 400);
  }

  return value;
}

function readUuid(
  value: unknown,
  message: string,
): string {
  if (
    typeof value !== "string" ||
    !UUID_PATTERN.test(value)
  ) {
    throw new SaveError(message, 400);
  }

  return value;
}

function nextDate(value: string) {
  return new Date(
    Date.parse(`${value}T00:00:00Z`) + 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
}

type WorkInterval = {
  startsAt: Date;
  endsAt: Date;
};

function readIntervals(
  value: unknown,
  workDate: string,
  dayType: "WORK" | "OFF",
): WorkInterval[] {
  if (!Array.isArray(value)) {
    throw new SaveError("ข้อมูลช่วงเวลาไม่ถูกต้อง", 400);
  }

  if (dayType === "OFF") {
    if (value.length !== 0) {
      throw new SaveError(
        "วันหยุดต้องไม่มีช่วงเวลาทำงาน",
        400,
      );
    }

    return [];
  }

  if (value.length < 1 || value.length > 8) {
    throw new SaveError(
      "กรุณาระบุช่วงเวลาทำงาน 1 ถึง 8 ช่วง",
      400,
    );
  }

  const tomorrow = nextDate(workDate);
  let previousEnd = 0;

  return value.map((entry, index) => {
    if (
      !isObject(entry) ||
      typeof entry.startTime !== "string" ||
      typeof entry.endTime !== "string" ||
      !TIME_PATTERN.test(entry.startTime) ||
      !TIME_PATTERN.test(entry.endTime) ||
      typeof entry.nextDay !== "boolean"
    ) {
      throw new SaveError(
        `กรุณาระบุเวลาให้ครบในช่วงที่ ${index + 1}`,
        400,
      );
    }

    // เวลาเข้างานอยู่ในวันที่จัดตาราง
    // เวลาเลิกสามารถเลือกเป็นวันถัดไปได้
    const startsAt = new Date(
      `${workDate}T${entry.startTime}:00+07:00`,
    );

    const endsAt = new Date(
      `${entry.nextDay ? tomorrow : workDate}` +
        `T${entry.endTime}:00+07:00`,
    );

    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new SaveError(
        `เวลาเลิกงานต้องอยู่หลังเวลาเข้างานในช่วงที่ ${
          index + 1
        } หากเป็นกะข้ามคืนให้เลือกเลิกงานวันถัดไป`,
        400,
      );
    }

    if (
      index > 0 &&
      startsAt.getTime() < previousEnd
    ) {
      throw new SaveError(
        "ช่วงเวลาทำงานซ้อนกันหรือเรียงไม่ถูกต้อง",
        400,
      );
    }

    previousEnd = endsAt.getTime();

    return { startsAt, endsAt };
  });
}

export async function POST(req: Request) {
  try {
    // ใช้สิทธิ์ Leave เดิมและขอบเขตพนักงานเดิม
    const auth = await requirePermission("leave.view");

    if (!auth.ok) {
      return auth.response;
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      throw new SaveError("รูปแบบข้อมูลไม่ถูกต้อง", 400);
    }

    if (!isObject(body)) {
      throw new SaveError("รูปแบบข้อมูลไม่ถูกต้อง", 400);
    }

    const employeeId = readUuid(
      body.employeeId,
      "รหัสพนักงานไม่ถูกต้อง",
    );

    const workDate = readDate(body.workDate);

    if (
      body.dayType !== "WORK" &&
      body.dayType !== "OFF"
    ) {
      throw new SaveError("ประเภทวันไม่ถูกต้อง", 400);
    }

    const dayType = body.dayType;

    if (
      typeof body.note !== "string" ||
      body.note.length > 2000
    ) {
      throw new SaveError(
        "หมายเหตุต้องไม่เกิน 2000 ตัวอักษร",
        400,
      );
    }

    const note = body.note.trim();

    const intervals = readIntervals(
      body.intervals,
      workDate,
      dayType,
    );

    let expectedId: string | null = null;
    let expectedRevision: number | null = null;

    if (body.expectedId !== null) {
      expectedId = readUuid(
        body.expectedId,
        "รหัสตารางเดิมไม่ถูกต้อง",
      );

      if (
        typeof body.expectedRevision !== "number" ||
        !Number.isInteger(body.expectedRevision) ||
        body.expectedRevision < 1
      ) {
        throw new SaveError(
          "รุ่นข้อมูลตารางไม่ถูกต้อง กรุณาโหลดใหม่",
          400,
        );
      }

      expectedRevision = body.expectedRevision;
    } else if (body.expectedRevision !== null) {
      throw new SaveError(
        "รุ่นข้อมูลตารางไม่ถูกต้อง",
        400,
      );
    }

    // ตรวจว่าผู้ใช้มีสิทธิ์เข้าถึงพนักงานคนนี้จริง
    let employeeQuery = supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("is_deleted", false)
      .eq("status", "active");

    employeeQuery = applyEmployeeScope(
      employeeQuery,
      auth.access,
      { permission: "leave.view" },
    );

    const {
      data: accessibleEmployee,
      error: accessError,
    } = await employeeQuery.maybeSingle();

    if (accessError) throw accessError;

    if (!accessibleEmployee) {
      throw new SaveError(
        "ไม่พบพนักงาน หรือคุณไม่มีสิทธิ์จัดตารางให้พนักงานคนนี้",
        403,
      );
    }

    const actorId = auth.user.id;

    // หารอบ 21–20 จากวันที่จัดตาราง
    const year = Number(workDate.slice(0, 4));
    const month = Number(workDate.slice(5, 7));
    const day = Number(workDate.slice(8, 10));

    const endMonth = day >= 21 ? month + 1 : month;
    const periodYear =
      endMonth > 12 ? year + 1 : year;
    const periodMonth =
      endMonth > 12 ? 1 : endMonth;

    const period = getLeaveSchedulePeriod(
      periodYear,
      periodMonth,
    );

    const saved = await leaveScheduleDb.$transaction(
      async (tx) => {
        // ให้การบันทึกพนักงานคนเดียวกันในวันเดียวกัน
        // ทำทีละรายการ เพื่อป้องกันการบันทึกพร้อมกัน
        const lockKey =
          `leave-schedule:${employeeId}:${workDate}`;

        await tx.$queryRaw`
          SELECT 1 AS locked
          FROM pg_advisory_xact_lock(
            hashtextextended(${lockKey}, 0)
          )
        `;

        const employee = await tx.employees.findFirst({
          where: {
            id: employeeId,
            is_deleted: false,
            status: "active",
          },
          select: {
            id: true,
            branch_id: true,
            department_id: true,
            division_id: true,
            unit_id: true,
          },
        });

        if (!employee) {
          throw new SaveError(
            "พนักงานไม่ได้อยู่ในสถานะใช้งาน",
            400,
          );
        }

        const dateValue = new Date(
          `${workDate}T00:00:00Z`,
        );

        const existing =
          await tx.leave_work_schedule_days.findMany({
            where: {
              employee_id: employeeId,
              work_date: dateValue,
              state: {
                in: ["DRAFT", "PUBLISHED"],
              },
            },
          });

        const current =
          existing.find(
            (item) => item.state === "DRAFT",
          ) ??
          existing.find(
            (item) => item.state === "PUBLISHED",
          ) ??
          null;

        // ถ้าข้อมูลเปลี่ยนหลังเปิดหน้าต่าง ไม่บันทึกทับ
        if (
          (current?.id ?? null) !== expectedId ||
          (current?.revision ?? null) !== expectedRevision
        ) {
          throw new SaveError(
            "มีผู้แก้ตารางนี้แล้ว กรุณาปิดหน้าต่าง กดรีเฟรช และเปิดใหม่",
            409,
          );
        }

        const savedPeriod =
          await tx.leave_work_schedule_periods.upsert({
            where: {
              start_date_end_date: {
                start_date: new Date(
                  `${period.startDate}T00:00:00Z`,
                ),
                end_date: new Date(
                  `${period.endDate}T00:00:00Z`,
                ),
              },
            },
            create: {
              start_date: new Date(
                `${period.startDate}T00:00:00Z`,
              ),
              end_date: new Date(
                `${period.endDate}T00:00:00Z`,
              ),
              created_by: actorId,
            },
            update: {},
          });

        const maximum =
          await tx.leave_work_schedule_days.aggregate({
            where: {
              employee_id: employeeId,
              work_date: dateValue,
            },
            _max: { revision: true },
          });

        // เพิ่มรุ่นทุกครั้ง เพื่อใช้ตรวจการแก้ทับกัน
        const revision =
          (maximum._max.revision ?? 0) + 1;

        const values = {
          day_type: dayType,
          state: "DRAFT",
          revision,
          source: "MANUAL",
          shift_id: null,
          shift_name_snapshot: null,
          note: note || null,
          branch_id: employee.branch_id,
          department_id: employee.department_id,
          division_id: employee.division_id,
          unit_id: employee.unit_id,
          updated_by: actorId,
          updated_at: new Date(),
        };

        let savedDay;

        if (current?.state === "DRAFT") {
          savedDay =
            await tx.leave_work_schedule_days.update({
              where: { id: current.id },
              data: values,
            });

          await tx.leave_work_schedule_intervals.deleteMany({
            where: {
              schedule_day_id: current.id,
            },
          });
        } else {
          // ไม่แก้ข้อมูลที่เผยแพร่แล้ว
          // สร้างเป็นร่างใหม่แทน
          savedDay =
            await tx.leave_work_schedule_days.create({
              data: {
                ...values,
                period_id: savedPeriod.id,
                employee_id: employeeId,
                work_date: dateValue,
                created_by: actorId,
              },
            });
        }

        if (intervals.length > 0) {
          await tx.leave_work_schedule_intervals.createMany({
            data: intervals.map((interval, index) => ({
              schedule_day_id: savedDay.id,
              sequence: index + 1,
              starts_at: interval.startsAt,
              ends_at: interval.endsAt,
            })),
          });
        }

        return {
          id: savedDay.id,
          revision: savedDay.revision,
          state: savedDay.state,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error: unknown) {
    if (error instanceof SaveError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "มีการบันทึกพร้อมกัน กรุณารีเฟรชข้อมูลก่อนลองใหม่",
        },
        { status: 409 },
      );
    }

    console.error("Save schedule draft failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "บันทึกตารางไม่สำเร็จ กรุณาลองใหม่",
      },
      { status: 500 },
    );
  }
}