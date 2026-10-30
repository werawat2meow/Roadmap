import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseServer";

export type ScheduleShareLink = {
  id: string;
  year: number;
  month: number;
  branch_id: string;
  department_id: string;
  division_id: string | null;
  unit_id: string | null;
  expires_at: string;
  revoked_at: string | null;
};

export const newScheduleShareToken = () => randomBytes(32).toString("base64url");
export const scheduleShareTokenHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function employeeInShareScope(
  employee: {
    branch_id: string | null;
    department_id: string | null;
    division_id: string | null;
    unit_id: string | null;
  },
  link: ScheduleShareLink,
) {
  return employee.branch_id === link.branch_id &&
    employee.department_id === link.department_id &&
    (!link.division_id || employee.division_id === link.division_id) &&
    (!link.unit_id || employee.unit_id === link.unit_id);
}

export async function getScheduleShareLink(token: string): Promise<ScheduleShareLink | null> {
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return null;
  const { data, error } = await supabaseAdmin
    .from("leave_schedule_share_links")
    .select("id, year, month, branch_id, department_id, division_id, unit_id, expires_at, revoked_at")
    .eq("token_hash", scheduleShareTokenHash(token))
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return (data as ScheduleShareLink | null) ?? null;
}

export const scheduleShareHeaders = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
};
