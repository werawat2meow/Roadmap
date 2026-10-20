import { NextResponse } from "next/server";
import { writeEnterpriseAudit } from "@/lib/audit/logger";
import { getVerifiedAuditActor } from "@/lib/audit/authActor";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const actor = getVerifiedAuditActor(req);
    if (!actor?.user_account_id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const pathname = body?.pathname;
    if (typeof pathname !== "string" || pathname.length > 300 ||
        !/^\/admin(?:\/|$)/.test(pathname) || pathname.includes("?") ||
        pathname.includes("#") || pathname.includes("\\") || pathname.includes("//")) {
      return NextResponse.json({ success: false, error: "Invalid page pathname" }, { status: 400 });
    }

    const result = await writeEnterpriseAudit({
      actor,
      event_type: "PAGE_VIEW",
      module_name: "PORTAL",
      system_code: "HRMS",
      event_status: "SUCCESS",
      severity: "INFO",
      description: `เข้าชมหน้า ${pathname}`,
      endpoint: pathname,
      http_method: "GET",
      request: req,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: "ไม่สามารถบันทึกการเข้าชมหน้าได้" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ACTIVITY_PAGE_VIEW_ERROR", error);
    return NextResponse.json({ success: false, error: "ไม่สามารถบันทึกการเข้าชมหน้าได้" }, { status: 500 });
  }
}
