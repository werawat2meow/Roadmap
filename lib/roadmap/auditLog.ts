import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseServer";

type RoadmapAuditLogInput = {
  userId?: string | null;
  employeeId?: string | null;
  page?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  description?: string | null;
  metadata?: Record<string, any> | null;
};

export async function writeRoadmapAuditLog(input: RoadmapAuditLogInput) {
  try {
    const headerStore = await headers();

    const ipAddress =
      headerStore.get("x-forwarded-for") ||
      headerStore.get("x-real-ip") ||
      null;

    const userAgent = headerStore.get("user-agent") || null;

    await supabaseAdmin.from("rm_audit_logs").insert({
      user_id: input.userId ?? null,
      employee_id: input.employeeId ?? null,
      module: "roadmap",
      page: input.page ?? null,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      description: input.description ?? null,
      metadata: input.metadata ?? null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Write roadmap audit log failed:", error);
  }
}
