import { NextResponse } from "next/server";

import { requireAuditViewer } from "@/lib/leave-audit-reader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuditViewer();

    // คนที่เข้า Leave ได้ แต่ไม่มีสิทธิ์ดู log: ส่ง false ให้ Navbar ซ่อนเมนู
    if (!auth.ok) {
      return NextResponse.json(
        { success: true, canViewAuditLogs: false },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { success: true, canViewAuditLogs: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("CHECK_LEAVE_AUDIT_ACCESS_FAILED", error);

    return NextResponse.json(
      { success: false, canViewAuditLogs: false },
      { status: 500 },
    );
  }
}