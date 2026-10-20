import "server-only";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";

// Central integration point for the permissions the administrator will assign.
export const ORIENTATION_PERMISSION = "recruitment.orientation";
export function orientationAccess(action = "view") {
  if (!["view", "edit", "export", "close"].includes(action)) throw new Error("Invalid Orientation permission");
  return requireScopedAccess(ORIENTATION_PERMISSION, action, { scopeType: "employee" });
}
