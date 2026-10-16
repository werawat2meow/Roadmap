import { NextResponse } from "next/server";
import { getVerifiedAuditActor } from "@/lib/audit/authActor";
import { writeEnterpriseAudit } from "@/lib/audit/logger";

export async function POST(req) {
  const actor = getVerifiedAuditActor(req);
  // Preserve existing logout response even if audit storage is unavailable.
  if (actor) {
    await writeEnterpriseAudit({ actor, event_type: "LOGOUT", event_status: "SUCCESS", module_name: "AUTH", system_code: "HRMS", description: "User signed out", request: req, endpoint: "/api/auth/logout", http_method: "POST", http_status: 200 });
  }
  const response = NextResponse.json({
    success: true,
    message: "Logout success",
  });

  response.cookies.set("employee_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}