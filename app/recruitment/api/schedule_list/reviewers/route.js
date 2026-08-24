import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("recruit_job_interviews")
      .select(`
        reviewer,
        employees:reviewer (
          id,
          first_name_th,
          last_name_th
        )
      `)
      .not("reviewer", "is", null);

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    // ตัดตัวซ้ำออกด้วย reviewer id
    const map = new Map();
    (data || []).forEach((row) => {
      if (row.employees && !map.has(row.employees.id)) {
        map.set(row.employees.id, row.employees);
      }
    });

    const reviewers = Array.from(map.values()).sort((a, b) =>
      `${a.first_name_th}${a.last_name_th}`.localeCompare(
        `${b.first_name_th}${b.last_name_th}`,
        "th"
      )
    );

    return NextResponse.json({ success: true, data: reviewers });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}