import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { getVerifiedAuditActor } from "@/lib/audit/authActor";
import { fail } from "@/lib/employeeMovements";

async function authorize(req, permissionModule, action) {
  const guard = await requireScopedAccess(permissionModule, action, { scopeType: "employee" });
  if (!guard.ok) return { response: guard.response };
  const actor = getVerifiedAuditActor(req);
  if (!actor?.user_account_id) return { response: fail("กรุณาเข้าสู่ระบบใหม่", 401) };
  return { guard, actor };
}

// View-only fallback: HR view or dedicated Audit view.
// Never use this fallback for change-status, Orientation, printing, or exit actions.
export async function movementSharedViewGate(req) {
  const hr = await authorize(req, "ems.employee_movements", "view");
  return hr.response ? authorize(req, "ems.employee_movement_audit", "view") : hr;
}

// No fallback across teams for WRITE permissions.
export async function movementAreaEditGate(req, area) {
  const module = area === "AUDIT"
    ? "ems.employee_movement_audit"
    : area === "ASSET"
      ? "ems.employee_movements"
      : null;
  if (!module) return { response: fail("ประเภทงานไม่ถูกต้อง", 400) };
  return authorize(req, module, "edit");
}
