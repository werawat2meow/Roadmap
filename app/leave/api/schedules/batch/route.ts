import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { leaveScheduleDb } from "@/lib/leave-schedule-db";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { applyEmployeeScope } from "@/lib/auth/requireScopedAccess";
import { getLeaveSchedulePeriod } from "@/lib/leave-schedule-period";

import {
  absoluteIntervals,
  cellKey,
  sameVersion,
  validDate,
  validateDay,
  type Change,
  type Version,
} from "@/lib/leave-schedule-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class RequestError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type Entry = {
  employeeId: string;
  workDate: string;
  expected: Version;
};

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
}

function readVersion(value: unknown): Version {
  if (value === null) return null;

  if (
    !object(value) ||
    typeof value.id !== "string" ||
    !UUID.test(value.id) ||
    typeof value.revision !== "number" ||
    !Number.isInteger(value.revision) ||
    value.revision < 1 ||
    !["DRAFT", "PUBLISHED"].includes(String(value.state))
  ) {
    throw new RequestError("รุ่นข้อมูลไม่ถูกต้อง กรุณาโหลดใหม่");
  }

  return {
    id: value.id,
    revision: value.revision,
    state: value.state as "DRAFT" | "PUBLISHED",
  };
}

export async function POST(req: Request) {
  try {
    const auth = await requirePermission("leave.view");

    if (!auth.ok) return auth.response;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new RequestError("ข้อมูล JSON ไม่ถูกต้อง");
    }

    if (
      !object(body) ||
      !["save", "publish", "saveAndPublish"].includes(String(body.action)) ||
      typeof body.year !== "number" ||
      typeof body.month !== "number" ||
      !Number.isInteger(body.year) ||
      body.year < 1900 ||
      body.year > 9998 ||
      !Number.isInteger(body.month) ||
      body.month < 1 ||
      body.month > 12 ||
      !Array.isArray(body.entries) ||
      body.entries.length < 1 ||
      body.entries.length > 20000
    ) {
      throw new RequestError(
        "ข้อมูลไม่ถูกต้อง หรือจำนวนช่องต้องอยู่ระหว่าง 1–20,000 ช่อง",
      );
    }

    const action = body.action as "save" | "publish" | "saveAndPublish";
    const period = getLeaveSchedulePeriod(body.year, body.month);
    const dateSet = new Set(period.dates);
    const keys = new Set<string>();

    const entries: Entry[] = body.entries.map((raw) => {
      if (
        !object(raw) ||
        typeof raw.employeeId !== "string" ||
        !UUID.test(raw.employeeId) ||
        !validDate(raw.workDate) ||
        !dateSet.has(raw.workDate)
      ) {
        throw new RequestError("พนักงานหรือวันที่ไม่ถูกต้อง");
      }

      const key = cellKey(raw.employeeId, raw.workDate);

      if (keys.has(key)) {
        throw new RequestError("มีช่องตารางซ้ำในคำขอ");
      }

      keys.add(key);

      if (action !== "publish") {
        try {
          validateDay(raw as unknown as Change);
        } catch (error) {
          throw new RequestError(
            error instanceof Error ? error.message : "ช่วงเวลาไม่ถูกต้อง",
          );
        }
      }

      return {
        ...raw,
        employeeId: raw.employeeId,
        workDate: raw.workDate,
        expected: readVersion(raw.expected),
      } as Entry;
    });

    const employeeIds = [
      ...new Set(entries.map((entry) => entry.employeeId)),
    ];

    if (employeeIds.length > 500) {
      throw new RequestError("เลือกพนักงานได้ไม่เกิน 500 คนต่อครั้ง");
    }

    // ตรวจสิทธิ์ทุกคน แบ่งอ่านเพื่อไม่ให้ชนจำนวนแถวสูงสุดของ Supabase
    for (let offset = 0; offset < employeeIds.length; offset += 100) {
      const chunk = employeeIds.slice(offset, offset + 100);
      let scopeQuery = supabaseAdmin
        .from("employees")
        .select("id")
        .in("id", chunk)
        .eq("is_deleted", false)
        .eq("status", "active");

      scopeQuery = applyEmployeeScope(
        scopeQuery,
        auth.access,
        { permission: "leave.view" },
      );

      const { data: allowed, error: scopeError } = await scopeQuery;
      if (scopeError) throw scopeError;
      if (!allowed || allowed.length !== chunk.length) {
        throw new RequestError(
          "มีพนักงานที่ไม่อยู่ในขอบเขตสิทธิ์หรือไม่ได้ใช้งาน",
          403,
        );
      }
    }

    // เผยแพร่ต้องตรวจทั้งรอบของทุกคนที่เลือก
    if (
      action === "publish" &&
      entries.length !== employeeIds.length * period.dates.length
    ) {
      throw new RequestError(
        "เผยแพร่ต้องส่งตารางครบทั้งรอบของพนักงานที่เลือก",
      );
    }

    const result = await leaveScheduleDb.$transaction(
      async (tx) => {
        const lockKeys = [
          `leave-schedule-period:${period.startDate}`,
          ...entries.map(
            (entry) =>
              `leave-schedule:${entry.employeeId}:${entry.workDate}`,
          ),
        ].sort();

        // ล็อกตามลำดับเดียวกัน และใช้ key เดียวกับ API รายวันเดิม
        await tx.$queryRaw`
          SELECT count(*)::int AS count
          FROM (
            SELECT pg_advisory_xact_lock(
              hashtextextended(k, 0)
            )
            FROM (
              SELECT k
              FROM unnest(
                ARRAY[${Prisma.join(lockKeys)}]::text[]
              ) AS input(k)
              ORDER BY k
            ) sorted
          ) locked
        `;

        const employees = await tx.employees.findMany({
          where: {
            id: { in: employeeIds },
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

        if (employees.length !== employeeIds.length) {
          throw new RequestError(
            "สถานะพนักงานเปลี่ยน กรุณาโหลดใหม่",
            409,
          );
        }

        const employeeMap = new Map(
          employees.map((employee) => [employee.id, employee]),
        );

        const rows = await tx.leave_work_schedule_days.findMany({
          where: {
            employee_id: { in: employeeIds },
            work_date: {
              gte: new Date(`${period.startDate}T00:00:00Z`),
              lte: new Date(`${period.endDate}T00:00:00Z`),
            },
          },
          include: {
            leave_work_schedule_intervals: true,
          },
        });

        const maximum = new Map<string, number>();
        const current = new Map<string, (typeof rows)[number]>();

        for (const row of rows) {
          const key = cellKey(
            row.employee_id,
            row.work_date.toISOString().slice(0, 10),
          );

          maximum.set(
            key,
            Math.max(maximum.get(key) || 0, row.revision),
          );

          if (row.state !== "DRAFT" && row.state !== "PUBLISHED") {
            continue;
          }

          if (!current.has(key) || row.state === "DRAFT") {
            current.set(key, row);
          }
        }

        for (const entry of entries) {
          const row = current.get(
            cellKey(entry.employeeId, entry.workDate),
          );

          const actual: Version = row
            ? {
                id: row.id,
                revision: row.revision,
                state: row.state as "DRAFT" | "PUBLISHED",
              }
            : null;

          if (!sameVersion(actual, entry.expected)) {
            throw new RequestError(
              `ตารางวันที่ ${entry.workDate} มีการเปลี่ยนแปลง กรุณาโหลดใหม่ก่อนบันทึก`,
              409,
            );
          }
        }

        const actorId = auth.user.id;
        const now = new Date();

        if (action === "publish") {
          const drafts = entries.map((entry) => {
            const row = current.get(
              cellKey(entry.employeeId, entry.workDate),
            );

            if (!row) {
              throw new RequestError(
                `ยังไม่มีตารางวันที่ ${entry.workDate} กรุณาจัดและบันทึกให้ครบก่อน`,
              );
            }

            if (
              row.day_type === "WORK" &&
              row.leave_work_schedule_intervals.length === 0
            ) {
              throw new RequestError(
                `วันทำงาน ${entry.workDate} ยังไม่มีเวลาเข้า–ออก`,
              );
            }

            if (
              row.day_type === "OFF" &&
              row.leave_work_schedule_intervals.length > 0
            ) {
              throw new RequestError(
                `วันหยุด ${entry.workDate} มีช่วงเวลางานค้างอยู่`,
              );
            }

            return row;
          }).filter((row) => row.state === "DRAFT");

          if (!drafts.length) {
            throw new RequestError("ไม่มีร่างที่ต้องเผยแพร่");
          }

          const draftKeys = new Set(
            drafts.map((row) =>
              cellKey(
                row.employee_id,
                row.work_date.toISOString().slice(0, 10),
              ),
            ),
          );

          const oldPublishedIds = rows
            .filter((row) =>
              row.state === "PUBLISHED" &&
              draftKeys.has(
                cellKey(
                  row.employee_id,
                  row.work_date.toISOString().slice(0, 10),
                ),
              ),
            )
            .map((row) => row.id);

          if (oldPublishedIds.length) {
            await tx.leave_work_schedule_days.updateMany({
              where: { id: { in: oldPublishedIds } },
              data: {
                state: "ARCHIVED",
                updated_by: actorId,
                updated_at: now,
              },
            });
          }

          const publishValues = drafts.map((row) => {
            const key = cellKey(
              row.employee_id,
              row.work_date.toISOString().slice(0, 10),
            );

            return Prisma.sql`(
              ${row.id}::uuid,
              ${(maximum.get(key) || 0) + 1}::integer
            )`;
          });

          await tx.$executeRaw`
            UPDATE public.leave_work_schedule_days AS d
            SET
              state = 'PUBLISHED',
              revision = v.revision,
              published_by = ${actorId}::uuid,
              published_at = ${now},
              updated_by = ${actorId}::uuid,
              updated_at = ${now}
            FROM (
              VALUES ${Prisma.join(publishValues)}
            ) AS v(id, revision)
            WHERE d.id = v.id
          `;

          return { count: drafts.length };
        }

        const savedPeriod =
          await tx.leave_work_schedule_periods.upsert({
            where: {
              start_date_end_date: {
                start_date: new Date(`${period.startDate}T00:00:00Z`),
                end_date: new Date(`${period.endDate}T00:00:00Z`),
              },
            },
            create: {
              start_date: new Date(`${period.startDate}T00:00:00Z`),
              end_date: new Date(`${period.endDate}T00:00:00Z`),
              created_by: actorId,
            },
            update: {},
          });

        const changes = entries as Change[];

        const prepared = changes.map((entry) => {
          const key = cellKey(entry.employeeId, entry.workDate);
          const previous = current.get(key);
          const employee = employeeMap.get(entry.employeeId)!;

          return {
            entry,
            employee,
            id: previous?.state === "DRAFT"
              ? previous.id
              : randomUUID(),
            revision: (maximum.get(key) || 0) + 1,
          };
        });

        // จำกัดจำนวน SQL parameters ต่อคำสั่ง แต่ยังอยู่ใน transaction เดียว
        for (let offset = 0; offset < prepared.length; offset += 500) {
          const values = prepared.slice(offset, offset + 500).map((item) => Prisma.sql`(
            ${item.id}::uuid,
            ${savedPeriod.id}::uuid,
            ${item.entry.employeeId}::uuid,
            ${item.entry.workDate}::date,
            ${item.entry.dayType},
            'DRAFT',
            ${item.revision}::integer,
            ${item.entry.source},
            ${item.entry.note.trim() || null},
            ${item.employee.branch_id}::uuid,
            ${item.employee.department_id}::uuid,
            ${item.employee.division_id}::uuid,
            ${item.employee.unit_id}::uuid,
            ${actorId}::uuid,
            ${actorId}::uuid,
            ${now}
          )`);
  
          await tx.$executeRaw`
            INSERT INTO public.leave_work_schedule_days (
              id, period_id, employee_id, work_date,
              day_type, state, revision, source, note,
              branch_id, department_id, division_id, unit_id,
              created_by, updated_by, updated_at
            )
            VALUES ${Prisma.join(values)}
            ON CONFLICT (id) DO UPDATE SET
              day_type = EXCLUDED.day_type,
              revision = EXCLUDED.revision,
              source = EXCLUDED.source,
              note = EXCLUDED.note,
              branch_id = EXCLUDED.branch_id,
              department_id = EXCLUDED.department_id,
              division_id = EXCLUDED.division_id,
              unit_id = EXCLUDED.unit_id,
              shift_id = NULL,
              shift_name_snapshot = NULL,
              updated_by = EXCLUDED.updated_by,
              updated_at = EXCLUDED.updated_at
          `;
        }

        await tx.leave_work_schedule_intervals.deleteMany({
          where: {
            schedule_day_id: {
              in: prepared.map((item) => item.id),
            },
          },
        });

        const spans = prepared.flatMap((item) =>
          absoluteIntervals(
            item.entry.workDate,
            item.entry,
          ).map((span, index) => ({
            schedule_day_id: item.id,
            sequence: index + 1,
            ...span,
          })),
        );

        for (let offset = 0; offset < spans.length; offset += 500) {
          await tx.leave_work_schedule_intervals.createMany({
            data: spans.slice(offset, offset + 500),
          });
        }

        if (action === "saveAndPublish") {
          // ปุ่มบันทึกเดียว: เก็บฉบับเผยแพร่เดิมเป็นประวัติ
          // แล้วเปิดใช้ค่าที่เพิ่งบันทึก ทั้งหมดสำเร็จหรือยกเลิกพร้อมกัน
          const changedKeys = new Set(changes.map((entry) =>
            cellKey(entry.employeeId, entry.workDate),
          ));
          const oldPublishedIds = rows.filter((row) =>
            row.state === "PUBLISHED" && changedKeys.has(cellKey(
              row.employee_id,
              row.work_date.toISOString().slice(0, 10),
            )),
          ).map((row) => row.id);

          if (oldPublishedIds.length) {
            await tx.leave_work_schedule_days.updateMany({
              where: { id: { in: oldPublishedIds } },
              data: { state: "ARCHIVED", updated_by: actorId, updated_at: now },
            });
          }
          await tx.leave_work_schedule_days.updateMany({
            where: { id: { in: prepared.map((item) => item.id) }, state: "DRAFT" },
            data: {
              state: "PUBLISHED",
              published_by: actorId,
              published_at: now,
              updated_by: actorId,
              updated_at: now,
            },
          });
        }

        return { count: prepared.length };
      },
      { maxWait: 10000, timeout: 60000 },
    );

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof RequestError) {
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
          error: "มีการบันทึกพร้อมกัน กรุณาโหลดใหม่",
        },
        { status: 409 },
      );
    }

    console.error("Schedule batch failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "ดำเนินการไม่สำเร็จ ไม่มีการบันทึกบางส่วน กรุณาตรวจ Terminal",
      },
      { status: 500 },
    );
  }
}
