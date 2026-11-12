import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { createSimpleEmployee } from "@/lib/employee/createSimpleEmployee";

export async function POST(request) {
  const guard = await requireScopedAccess("ems.employees", "create");
  if (!guard.ok) return guard.response;
  return createSimpleEmployee(await request.json(), guard);
}
