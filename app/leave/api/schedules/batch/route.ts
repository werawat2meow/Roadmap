import { supabaseAdmin } from "@/lib/supabaseServer";
import { requirePermission } from "@/lib/auth/requirePortalAccess";
import { applyEmployeeScope } from "@/lib/auth/requireScopedAccess";
import { RequestError, saveScheduleBatch } from "@/lib/leave-schedule-batch-save";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requirePermission("leave.view");
  if (!auth.ok) return auth.response;

  return saveScheduleBatch(req, {
    actorId: auth.user.id,
    async checkEmployeeScope(employeeIds) {
      for (let offset = 0; offset < employeeIds.length; offset += 100) {
        const chunk = employeeIds.slice(offset, offset + 100);
        let query = supabaseAdmin
          .from("employees")
          .select("id")
          .in("id", chunk)
          .eq("is_deleted", false)
          .eq("status", "active");
        query = applyEmployeeScope(query, auth.access, {
          permission: "leave.view",
        });
        const { data, error } = await query;
        if (error) throw error;
        if (data?.length !== chunk.length) {
          throw new RequestError("มีพนักงานที่ไม่อยู่ในขอบเขตสิทธิ์", 403);
        }
      }
    },
  });
}
