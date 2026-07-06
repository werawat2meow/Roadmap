import { NextRequest, NextResponse } from "next/server";
import { getTokenPayload } from "@/lib/authToken";
import { prisma } from "@/lib/prisma";
import { findLeaveBlackoutConflict } from "@/lib/leave-blackout";

export async function POST(req: NextRequest) {
  const token = await getTokenPayload();
  if (!token?.employee_id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const kind = body?.kind as string | undefined;
  const startDate = body?.startDate as string | undefined;
  const endDate = body?.endDate as string | undefined;

  if (!kind || !startDate || !endDate) {
    return NextResponse.json(
      { error: "missing kind/startDate/endDate" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(+start) || isNaN(+end) || start > end) {
    return NextResponse.json({ error: "invalid date range" }, { status: 400 });
  }

  const employeeId = token.employee_id;

  const conflict = await findLeaveBlackoutConflict({
    employeeId,
    kind: kind as any,
    start,
    end,
  });

  if (!conflict) {
    return NextResponse.json({ ok: true, conflict: false });
  }

  const message = conflict.reason
    ? `ช่วงวันที่เลือกถูกปิดรับการลา (${conflict.reason})`
    : "ช่วงวันที่เลือกถูกปิดรับการลา";

  return NextResponse.json({
    ok: true,
    conflict: true,
    message,
    blackout: {
      id: conflict.blackoutId,
      startDate: conflict.startDate,
      endDate: conflict.endDate,
      reason: conflict.reason,
    },
  });
}
