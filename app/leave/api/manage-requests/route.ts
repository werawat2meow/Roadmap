import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { leaveScheduleDb } from "@/lib/leave-schedule-db";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { applyEmployeeScope } from "@/lib/auth/requireScopedAccess";
import { readAllScheduleRows } from "@/lib/leave-schedule-query";
import { randomUUID } from "node:crypto";

import { writeLeaveAuditLog, type AuditActor } from "@/lib/leave-audit";

import {
  buildRefundPlan,
  getRefundState,
  refundDateKey,
} from "@/lib/leave-refund-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Employee = {
  id: string;
  employee_code: string | null;
  first_name_th: string | null;
  last_name_th: string | null;
};

class RefundError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

async function guard() {
  const auth = await requirePermission("leave.view");

  if (!auth.ok) return auth;

  const { data: role, error } = await supabaseAdmin
    .from("roles")
    .select("role_code")
    .eq("id", auth.user.role_id)
    .maybeSingle();

  if (error) throw error;

  if (
    !role ||
    !["SUPER_ADMIN", "HR_MANAGER", "HR_OFFICER"].includes(role.role_code)
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์จัดการการคืนวันลา" },
        { status: 403 },
      ),
    };
  }

  return auth;
}

function handleError(error: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : "ดำเนินการไม่สำเร็จ",
    },
    {
      status: error instanceof RefundError ? error.status : 500,
    },
  );
}

type RefundHistoryItem = {
  at: string;
  days: number;
  reason: string;
  confirmation: string;
  keys: string[];
};

function readRefundHistory(value: unknown): RefundHistoryItem[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  const reservation = value as Record<string, unknown>;
  const rawState = reservation.refundState;

  if (!rawState || typeof rawState !== "object" || Array.isArray(rawState)) {
    return [];
  }

  const state = rawState as Record<string, unknown>;

  if (state.version !== 1 || !Array.isArray(state.events)) {
    return [];
  }

  return state.events.flatMap((value): RefundHistoryItem[] => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return [];
    }

    const event = value as Record<string, unknown>;
    const days = Number(event.days);

    if (
      typeof event.at !== "string" ||
      !Number.isFinite(Date.parse(event.at)) ||
      !Number.isFinite(days) ||
      days <= 0
    ) {
      return [];
    }

    return [
      {
        at: event.at,
        days,
        reason: String(event.reason || ""),
        confirmation: String(event.confirmation || ""),
        keys: Array.isArray(event.keys)
          ? event.keys.filter((key): key is string => typeof key === "string")
          : [],
      },
    ];
  });
}

export async function GET(req: Request) {
  try {
    const auth = await guard();

    if (!auth.ok) return auth.response;

    const params = new URL(req.url).searchParams;

    const requestedPage = Number(params.get("page") || 1);
    const view = params.get("view") || "ready";

    const keyword = (params.get("keyword") || "")
      .slice(0, 120)
      .replace(/[,().%_]/g, " ")
      .trim();

    if (
      !Number.isSafeInteger(requestedPage) ||
      requestedPage < 1 ||
      !["ready", "history", "review"].includes(view)
    ) {
      throw new RefundError("ตัวกรองไม่ถูกต้อง");
    }

    let query = supabaseAdmin
      .from("employees")
      .select("id,employee_code,first_name_th,last_name_th")
      .eq("is_deleted", false)
      .order("id");

    query = applyEmployeeScope(query, auth.access, {
      permission: "leave.view",
    });

    if (keyword) {
      query = query.or(
        `employee_code.ilike.%${keyword}%,` +
          `first_name_th.ilike.%${keyword}%,` +
          `last_name_th.ilike.%${keyword}%`,
      );
    }

    const employees = await readAllScheduleRows<Employee>(query);

    const employeeMap = new Map(
      employees.map((employee) => [employee.id, employee]),
    );

    const where: Prisma.leave_requestsWhereInput = {
      employeeId: {
        in: employees.map((employee) => employee.id),
      },

      // CANCELLED ใช้เฉพาะประวัติที่คืนครบแล้ว
      // ไม่อ่าน PENDING / REJECTED มาในเมนูนี้
      status: {
        in: ["APPROVED", "CANCELLED"],
      },
    };

    type LeaveRow = Prisma.leave_requestsGetPayload<Record<string, never>>;

    const rows: LeaveRow[] = [];

    // อ่านเป็นชุดก่อนจัดกลุ่ม เพื่อให้จำนวนและ pagination
    // ถูกต้อง ไม่กรองเฉพาะ 20 รายการของหน้าปัจจุบัน
    let cursor: number | undefined;

    while (true) {
      const batch: LeaveRow[] = await leaveScheduleDb.leave_requests.findMany({
        where,
        orderBy: { id: "desc" },
        take: 500,

        ...(cursor === undefined
          ? {}
          : {
              cursor: { id: cursor },
              skip: 1,
            }),
      });

      if (batch.length === 0) break;

      rows.push(...batch);
      cursor = batch[batch.length - 1].id;

      if (batch.length < 500) break;
    }

    const items = rows.map((row) => {
      const employee = employeeMap.get(row.employeeId);

      const refundHistory = readRefundHistory(row.reservation);

      let units: {
        key: string;
        date: string;
        session: "AM" | "PM";
      }[] = [];

      let refundError: string | null = null;

      if (row.status === "APPROVED") {
        try {
          units = getRefundState(row)
            .units.filter((unit) => !unit.returned)
            .map(({ key, date, session }) => ({
              key,
              date,
              session,
            }));

          if (units.length === 0 || Number(row.requestedDays) <= 0) {
            refundError =
              "ใบลานี้ไม่มีช่วงเวลาที่เหลือให้คืน กรุณาตรวจสอบสถานะใบลา";
          }
        } catch (error) {
          refundError =
            error instanceof Error ? error.message : "ตรวจข้อมูลใบลาไม่สำเร็จ";
        }
      }

      const canRefund =
        row.status === "APPROVED" &&
        Number(row.requestedDays) > 0 &&
        units.length > 0 &&
        refundError === null;

      const needsReview = row.status === "APPROVED" && refundError !== null;

      return {
        id: row.id,

        employeeCode: employee?.employee_code || "",
        employeeName:
          [employee?.first_name_th, employee?.last_name_th]
            .filter(Boolean)
            .join(" ") || "ไม่ระบุชื่อ",

        kind: row.kind,
        status: row.status,

        startDate: refundDateKey(row.startDate),
        endDate: refundDateKey(row.endDate),

        requestedDays: Number(row.requestedDays),
        updatedAt: row.updatedAt.toISOString(),

        source: row.reason?.startsWith("[Paper]") ? "HR" : "พนักงาน",

        units,
        refundError,
        canRefund,
        needsReview,

        refundHistory,
        returnedDays: refundHistory.reduce((sum, event) => sum + event.days, 0),
      };
    });

    const counts = {
      ready: items.filter((item) => item.canRefund).length,

      history: items.filter((item) => item.refundHistory.length > 0).length,

      review: items.filter((item) => item.needsReview).length,
    };

    const filtered = items.filter((item) => {
      if (view === "history") {
        // ไม่รวมการยกเลิกทั่วไปที่ไม่เคยคืนสิทธิ์
        return item.refundHistory.length > 0;
      }

      if (view === "review") return item.needsReview;

      return item.canRefund;
    });

    const pageSize = 20;
    const total = filtered.length;

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // เช่น คืนรายการสุดท้ายของหน้าที่ 2 แล้วเหลือเพียงหน้าเดียว
    const page = Math.min(requestedPage, totalPages);

    const data = filtered.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      success: true,
      data,
      counts,
      page,
      total,
      totalPages,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  const auditRequestId = randomUUID();

  let auditActor: AuditActor | null = null;
  let auditTargetId: number | null = null;

  try {
    const auth = await guard();

    if (!auth.ok) return auth.response;
    auditActor = auth.user;

    const body = await req.json();

    const id = Number(body.id);
    auditTargetId = Number.isInteger(id) && id > 0 ? id : null;
    const keys = body.keys;
    const reason = String(body.reason || "").trim();
    const confirmation = String(body.confirmation || "").trim();

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      !Array.isArray(keys) ||
      keys.length === 0 ||
      keys.length > 1464 ||
      keys.some((value) => typeof value !== "string") ||
      reason.length < 3 ||
      reason.length > 2000 ||
      confirmation.length < 3 ||
      confirmation.length > 2000 ||
      typeof body.expectedUpdatedAt !== "string"
    ) {
      throw new RefundError("ข้อมูลคืนสิทธิ์ไม่ครบหรือไม่ถูกต้อง");
    }

    const initial = await leaveScheduleDb.leave_requests.findUnique({
      where: { id },
    });

    if (!initial) throw new RefundError("ไม่พบใบลา", 404);

    let employeeQuery = supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", initial.employeeId)
      .eq("is_deleted", false);

    employeeQuery = applyEmployeeScope(employeeQuery, auth.access, {
      permission: "leave.view",
    });

    const { data: employee, error } = await employeeQuery.maybeSingle();

    if (error) throw error;
    if (!employee) throw new RefundError("ไม่มีสิทธิ์เข้าถึงพนักงาน", 403);

    const result = await leaveScheduleDb.$transaction(
      async (tx) => {
        // ใช้ lock key เดียวกับ PWA
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(hashtext(${initial.employeeId}))
        `;

        const leave = await tx.leave_requests.findUnique({
          where: { id },
        });

        if (
          !leave ||
          leave.employeeId !== initial.employeeId ||
          leave.status !== "APPROVED"
        ) {
          throw new RefundError("ใบลานี้ไม่อยู่ในสถานะอนุมัติแล้ว", 409);
        }

        if (leave.updatedAt.toISOString() !== body.expectedUpdatedAt) {
          throw new RefundError("ใบลาถูกแก้ไขแล้ว กรุณาโหลดข้อมูลใหม่", 409);
        }

        let plan: ReturnType<typeof buildRefundPlan>;

        try {
          plan = buildRefundPlan(leave, keys, {
            actorId: auth.user.id,
            reason,
            confirmation,
          });
        } catch (error) {
          throw new RefundError(
            error instanceof Error ? error.message : "คืนสิทธิ์ไม่สำเร็จ",
            409,
          );
        }

        const quotaFields: Record<string, string> = {
          SICK: "sickLeave",
          BUSINESS: "businessLeave",
          BIRTHDAY: "birthdayLeave",
          ORDAIN: "ordainLeave",
          MATERNITY: "maternityLeave",
          UNPAID: "unpaidLeave",
        };

        const deltas = new Map<
          string,
          { year: number; field: string; days: number }
        >();

        for (const allocation of plan.restoredAllocations) {
          // ยอด Carry ของ HR เป็นยอดตั้งต้น:
          // คืนด้วยการลด allocation เท่านั้น ไม่บวกยอดตั้งต้นเพิ่ม
          const field = allocation.source.startsWith("annual:")
            ? "vacationLeave"
            : allocation.source.startsWith("holiday:")
              ? "holidayLeave"
              : quotaFields[leave.kind];

          if (!field) continue;

          const key = `${allocation.year}:${field}`;
          const previous = deltas.get(key);

          deltas.set(key, {
            year: allocation.year,
            field,
            days: (previous?.days || 0) + allocation.days,
          });
        }

        for (const delta of deltas.values()) {
          const rights = await tx.leave_rights.findUnique({
            where: {
              employeeId_year: {
                employeeId: leave.employeeId,
                year: delta.year,
              },
            },
          });

          if (!rights) {
            throw new RefundError(
              `ไม่พบสิทธิ์ต้นทางปี ${delta.year} กรุณาตรวจข้อมูล`,
              409,
            );
          }

          await tx.leave_rights.update({
            where: { id: rights.id },
            data: {
              [delta.field]: { increment: delta.days },
            } as Prisma.leave_rightsUpdateInput,
          });
        }

        await tx.leave_requests.update({
          where: { id },
          data: {
            requestedDays: plan.remainingDays,
            status: plan.remainingDays === 0 ? "CANCELLED" : "APPROVED",
            reservation: plan.reservation as unknown as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
        });

        await writeLeaveAuditLog({
          request: req,
          actor: auth.user,

          // สำคัญ: ใช้ transaction เดียวกับคืนสิทธิ์
          transaction: tx,

          requestId: auditRequestId,

          eventSource: "SERVER",
          eventType: "ACTION",
          action: "LEAVE_REFUND",
          outcome: "SUCCESS",

          pageName: "Restore leave",
          pagePath: "/leave/manage-requests",
          httpStatus: 200,

          targetType: "leave_request",
          targetId: leave.id,

          description: `คืนสิทธิ์ใบลา #${leave.id} จำนวน ${plan.days} วัน`,

          metadata: {
            target_employee_id: leave.employeeId,

            original_start_date: refundDateKey(leave.startDate),
            original_end_date: refundDateKey(leave.endDate),

            returned_parts: keys,
          },

          beforeData: {
            kind: leave.kind,
            status: leave.status,
            requested_days: Number(leave.requestedDays),
          },

          afterData: {
            kind: leave.kind,

            status: plan.remainingDays === 0 ? "CANCELLED" : "APPROVED",

            requested_days: plan.remainingDays,
            returned_days: plan.days,

            restored_sources: plan.restoredAllocations,
          },
        });

        return {
          returnedDays: plan.days,
          remainingDays: plan.remainingDays,
        };
      },
      { maxWait: 10000, timeout: 30000 },
    );

    return NextResponse.json({
      success: true,
      ...result,
      requestId: auditRequestId,
    });
  } catch (error) {
    const status = error instanceof RefundError ? error.status : 500;

    // บันทึกความล้มเหลวภายหลัง transaction เดิม rollback แล้ว
    // เฉพาะคำขอที่ผ่านการตรวจสิทธิ์เริ่มต้นและรู้ตัวผู้ใช้งานแล้ว
    if (auditActor) {
      try {
        await writeLeaveAuditLog({
          request: req,
          actor: auditActor,

          requestId: auditRequestId,

          eventSource: "SERVER",
          eventType: "ACTION",
          action: "LEAVE_REFUND",

          outcome: status === 403 ? "DENIED" : "FAILURE",

          pageName: "Restore leave",
          pagePath: "/leave/manage-requests",
          httpStatus: status,

          targetType: "leave_request",
          targetId: auditTargetId ?? undefined,

          description:
            error instanceof RefundError
              ? error.message
              : "คืนสิทธิ์ไม่สำเร็จ เนื่องจากระบบประมวลผลผิดพลาด",

          metadata: {
            stage: "refund_request",
          },
        });
      } catch (auditError) {
        // หากฐานข้อมูลหรือระบบ log ขัดข้อง ต้องมีข้อความใน server log
        // และไม่เปลี่ยนข้อผิดพลาดเดิมให้กลายเป็นสำเร็จ
        console.error("Leave refund failure audit could not be written:", {
          requestId: auditRequestId,
          error:
            auditError instanceof Error ? auditError.message : "Unknown error",
        });
      }
    }

    return handleError(error);
  }
}
