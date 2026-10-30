import "server-only";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { leaveScheduleDb } from "@/lib/leave-schedule-db";

const VIEWER_ROLES = ["SUPER_ADMIN"];
const MAX_EXPORT_ROWS = 10_000;

export async function requireAuditViewer() {
  const auth = await requirePermission("leave.view");
  if (!auth.ok) return auth;

  const { data: role, error } = await supabaseAdmin
    .from("roles")
    .select("role_code")
    .eq("id", auth.user.role_id)
    .maybeSingle();

  if (error) throw error;

  if (!role || !VIEWER_ROLES.includes(role.role_code)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: "ไม่มีสิทธิ์ดูประวัติการใช้งาน" },
        { status: 403 },
      ),
    };
  }

  return auth;
}

function bangkokDayStart(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("รูปแบบวันที่ไม่ถูกต้อง");
  }

  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("วันที่ไม่ถูกต้อง");
  }

  // กันวันที่อย่าง 2026-02-31 ที่ JavaScript อาจปรับเป็นวันอื่น
  const check = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  if (check !== value) throw new Error("วันที่ไม่ถูกต้อง");
  return date;
}

export function auditFilters(params: URLSearchParams) {
  const from = params.get("from")?.trim() || "";
  const to = params.get("to")?.trim() || "";

  // ต้องเลือกทั้งสองวัน เพื่อไม่ให้เผลอดึง log ทั้งฐานข้อมูล
  if (!from || !to) {
    throw new Error("กรุณาเลือกวันที่เริ่มและวันที่สิ้นสุด");
  }

  const start = bangkokDayStart(from);
  const end = bangkokDayStart(to);
  end.setUTCDate(end.getUTCDate() + 1); // ไม่รวม 00:00 ของวันถัดไป

  const days = (end.getTime() - start.getTime()) / 86_400_000;
  if (days < 1 || days > 366) {
    throw new Error("ช่วงวันที่ต้องไม่เกิน 366 วัน");
  }

  const user = (params.get("user") || "").trim().slice(0, 100);
  const pagePath = (params.get("pagePath") || "").trim().slice(0, 200);
  const action = (params.get("action") || "").trim().slice(0, 100);
  const outcome = (params.get("outcome") || "").trim();

  if (
    outcome &&
    !["INFO", "SUCCESS", "FAILURE", "DENIED"].includes(outcome)
  ) {
    throw new Error("ผลลัพธ์ไม่ถูกต้อง");
  }

  const where: Prisma.leave_audit_logsWhereInput = {
    source_app: "leave_hr",
    created_at: { gte: start, lt: end },
    ...(pagePath ? { page_path: pagePath } : {}),
    ...(action ? { action } : {}),
    ...(outcome ? { outcome } : {}),
    ...(user
      ? {
          OR: [
            { actor_name: { contains: user, mode: "insensitive" } },
            { actor_username: { contains: user, mode: "insensitive" } },
            { actor_employee_code: { contains: user, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return { where, from, to };
}

export function readPage(params: URLSearchParams) {
  const raw = Number(params.get("page") || "1");
  if (!Number.isSafeInteger(raw) || raw < 1) {
    throw new Error("เลขหน้าไม่ถูกต้อง");
  }
  return Math.min(raw, 100_000);
}

export async function findAuditLogs(
  where: Prisma.leave_audit_logsWhereInput,
  page: number,
) {
  const pageSize = 30;
  const total = await leaveScheduleDb.leave_audit_logs.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const rows = await leaveScheduleDb.leave_audit_logs.findMany({
    where,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      created_at: true,
      actor_name: true,
      actor_username: true,
      actor_employee_code: true,
      page_name: true,
      page_path: true,
      action: true,
      outcome: true,
      description: true,
      target_type: true,
      target_id: true,
    },
  });

  return { rows, total, page: currentPage, pageSize, totalPages };
}

export async function findAuditLogDetail(id: string) {
  return leaveScheduleDb.leave_audit_logs.findFirst({
    where: { id, source_app: "leave_hr" },
  });
}

export async function findAuditLogsForExport(
  where: Prisma.leave_audit_logsWhereInput,
) {
  const total = await leaveScheduleDb.leave_audit_logs.count({ where });

  if (total > MAX_EXPORT_ROWS) {
    throw new Error(
      `พบ ${total} รายการ กรุณาลดช่วงวันที่หรือเพิ่มตัวกรองก่อนส่งออก (สูงสุด ${MAX_EXPORT_ROWS} รายการ)`,
    );
  }

  const rows = await leaveScheduleDb.leave_audit_logs.findMany({
    where,
    orderBy: [{ created_at: "asc" }, { id: "asc" }],
    take: MAX_EXPORT_ROWS,
  });

  return { rows, total };
}