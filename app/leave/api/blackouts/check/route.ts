import { NextResponse } from "next/server";
import { findLeaveBlackoutConflict } from "@/lib/leave-blackout";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const conflict = await findLeaveBlackoutConflict({
      employeeId: body.employeeId,
      kind: body.kind,
      startDate: body.startDate,
      endDate: body.endDate,
    });

    return NextResponse.json({
      success: true,
      conflict: Boolean(conflict),
      blackout: conflict || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}