import { canViewerAccessEmployee } from "@/lib/approval-scope";
import { getEmployeeLeaveBalanceSummary } from "@/lib/leave-balance-summary";
import { getTokenPayload } from "@/lib/authToken";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = await getTokenPayload();
    const email = token?.username ?? (token as any)?.email;
    const role = String((token as any)?.role || (token as any)?.role_code || "").toUpperCase();
    const empNo = String((token as any)?.employee_code || "").trim() || undefined;

    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = (searchParams.get("employeeId") || "").trim();
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    if (!employeeId) {
      return NextResponse.json({ error: "invalid employeeId" }, { status: 400 });
    }

    if (!Number.isFinite(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "invalid year" }, { status: 400 });
    }

    const allowed = await canViewerAccessEmployee(email, employeeId, role, empNo);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getEmployeeLeaveBalanceSummary({ employeeId, year });
    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    console.error("GET /api/leave-balance/summary error:", error);
    return NextResponse.json(
      { error: error?.message || "internal_error" },
      { status: 500 }
    );
  }
}