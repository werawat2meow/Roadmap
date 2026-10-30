import { NextResponse } from "next/server";

import {
  auditFilters,
  findAuditLogs,
  readPage,
  requireAuditViewer,
} from "@/lib/leave-audit-reader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAuditViewer();
    if (!auth.ok) return auth.response;

    const params = new URL(request.url).searchParams;
    const { where } = auditFilters(params);
    const page = readPage(params);
    const result = await findAuditLogs(where, page);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (
      error instanceof Error &&
      /วันที่|ช่วงวันที่|ผลลัพธ์|เลขหน้า/.test(error.message)
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    console.error("LOAD_LEAVE_AUDIT_LOGS_FAILED", error);
    return NextResponse.json(
      { success: false, error: "โหลดประวัติการใช้งานไม่สำเร็จ" },
      { status: 500 },
    );
  }
}