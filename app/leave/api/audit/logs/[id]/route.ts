import { NextResponse } from "next/server";

import {
  findAuditLogDetail,
  requireAuditViewer,
} from "@/lib/leave-audit-reader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuditViewer();
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { success: false, error: "รหัส log ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const row = await findAuditLogDetail(id);
    if (!row) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ log" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: row });
  } catch (error) {
    console.error("LOAD_LEAVE_AUDIT_DETAIL_FAILED", error);
    return NextResponse.json(
      { success: false, error: "โหลดรายละเอียด log ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}