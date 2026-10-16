import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    const employeeId = String(body.employeeId || "");
    const weeklyHoliday = Array.isArray(body.weeklyHoliday)
      ? body.weeklyHoliday.join(",")
      : String(body.weeklyHoliday || "");

    const workStartTime = body.workStartTime || null;
    const workEndTime = body.workEndTime || null;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Missing employee id" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("leave_employee_configs")
      .upsert(
        {
          employeeId,
          weeklyHoliday,
          work_start_time: workStartTime,
          work_end_time: workEndTime,
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "employeeId" },
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update employee leave config failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "บันทึกการตั้งค่าพนักงานไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}