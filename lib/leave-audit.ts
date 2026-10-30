import "server-only";

import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import { Prisma } from "@prisma/client";

import { supabaseAdmin } from "@/lib/supabaseServer";

export type AuditActor = {
  id: string;
  employee_id?: string | null;
  role_id?: string | null;
  username?: string | null;
};

type LeaveAuditInput = {
  request: Request;
  actor: AuditActor;
  transaction?: Prisma.TransactionClient;

  eventId?: string;
  requestId?: string;

  eventSource: "SERVER" | "BROWSER";
  eventType: "ACCESS" | "NAVIGATION" | "ACTION" | "EXPORT";
  action: string;
  outcome: "INFO" | "SUCCESS" | "FAILURE" | "DENIED";

  pageName?: string;
  pagePath?: string;

  httpStatus?: number;

  targetType?: string;
  targetId?: string | number;

  description?: string;
  metadata?: Record<string, unknown>;
  beforeData?: Record<string, unknown>;
  afterData?: Record<string, unknown>;
};

function readRequestIp(request: Request): string | null {
  // เปิดใช้เฉพาะเมื่อระบบอยู่หลัง proxy ที่เชื่อถือได้
  // และ proxy เป็นผู้กำหนด/เขียนทับ header เหล่านี้
  if (process.env.LEAVE_AUDIT_TRUST_PROXY !== "true") {
    return null;
  }

  const value =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "";

  return isIP(value) ? value : null;
}

export async function writeLeaveAuditLog(input: LeaveAuditInput) {
  const { actor, request } = input;

  const [employeeResult, roleResult] = await Promise.all([
    actor.employee_id
      ? supabaseAdmin
          .from("employees")
          .select("employee_code,first_name_th,last_name_th")
          .eq("id", actor.employee_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),

    actor.role_id
      ? supabaseAdmin
          .from("roles")
          .select("role_code")
          .eq("id", actor.role_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (employeeResult.error) {
    throw new Error("อ่านข้อมูลผู้ใช้งานสำหรับบันทึกประวัติไม่สำเร็จ");
  }

  if (roleResult.error) {
    throw new Error("อ่านบทบาทสำหรับบันทึกประวัติไม่สำเร็จ");
  }

  const employee = employeeResult.data;

  const actorName =
    [employee?.first_name_th, employee?.last_name_th]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    actor.username ||
    "ไม่ระบุชื่อ";

  const id = input.eventId || randomUUID();
  const requestId = input.requestId || randomUUID();

  const row = {
    id,

    // ไม่ส่ง created_at ให้ฐานข้อมูลกำหนดเวลาเอง
    source_app: "leave_hr",

    event_source: input.eventSource,
    event_type: input.eventType,
    action: input.action,
    outcome: input.outcome,

    actor_account_id: actor.id,
    actor_employee_id: actor.employee_id || null,

    actor_username: actor.username || null,
    actor_name: actorName,
    actor_employee_code: employee?.employee_code || null,
    actor_role_code: roleResult.data?.role_code || null,

    page_name: input.pageName || null,
    page_path: input.pagePath || null,

    endpoint: new URL(request.url).pathname,
    http_method: request.method,
    http_status: input.httpStatus ?? null,

    request_id: requestId,

    // ยังไม่ใช้รหัส session ในขั้นนี้ และไม่เก็บ JWT/token
    session_id: null,

    ip_address: readRequestIp(request),
    user_agent: request.headers.get("user-agent")?.slice(0, 1000) || null,

    target_type: input.targetType || null,
    target_id: input.targetId === undefined ? null : String(input.targetId),

    description: input.description || null,
    metadata: input.metadata || {},

    before_data: input.beforeData || null,
    after_data: input.afterData || null,
  };

  // รายการสำคัญใช้ transaction เดียวกับการเปลี่ยนข้อมูล
  if (input.transaction) {
    await input.transaction.leave_audit_logs.create({
      data: {
        ...row,

        metadata: row.metadata as Prisma.InputJsonValue,

        before_data:
          row.before_data === null
            ? Prisma.DbNull
            : (row.before_data as Prisma.InputJsonValue),

        after_data:
          row.after_data === null
            ? Prisma.DbNull
            : (row.after_data as Prisma.InputJsonValue),
      },
      select: { id: true },
    });

    return { id, duplicate: false };
  }

  // การเปิดหน้าและเหตุการณ์ทั่วไป ใช้ Supabase เหมือนเดิม
  const { error } = await supabaseAdmin.from("leave_audit_logs").insert(row);

  if (error) {
    // หน้าเว็บ retry ด้วย eventId เดิมได้ โดยไม่สร้าง log ซ้ำ
    // ตารางนี้มี unique key ที่ id
    if (error.code === "23505") {
      return { id, duplicate: true };
    }

    throw new Error(
      `บันทึกประวัติ Leave ไม่สำเร็จ (${error.code || "unknown"})`,
    );
  }

  return { id, duplicate: false };
}
