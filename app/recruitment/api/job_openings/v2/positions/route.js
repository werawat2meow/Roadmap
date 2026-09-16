import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseServer";

// GET /recruitment/api/positions?q=คำค้นหา
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    let query = supabaseAdmin
      .from("recruit_job_description")
      .select(`
        positions_id,
        positions (
          id,
          position_name,
          position_group
        )
      `)
      .not("positions_id", "is", null)
      .order("positions_id", { ascending: true })
      .limit(100);

    const { data, error } = await query;

    if (error) {
      console.error("GET /recruitment/api/positions error:", error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    // เอาเฉพาะ position ที่มีข้อมูลจาก positions
    let positions = (data || [])
      .map((item) => item.positions)
      .filter(Boolean);

    // ตัดตำแหน่งซ้ำ โดยใช้ positions.id
    const uniquePositions = Array.from(
      new Map(
        positions.map((position) => [position.id, position])
      ).values()
    );

    // ค้นหาจาก position_name
    const filteredPositions = q
      ? uniquePositions.filter((position) =>
          position.position_name
            ?.toLowerCase()
            .includes(q.toLowerCase())
        )
      : uniquePositions;

    // เรียงตามชื่อ Position
    filteredPositions.sort((a, b) =>
      (a.position_name || "").localeCompare(
        b.position_name || "",
        "th"
      )
    );

    // จำกัดจำนวนที่ส่งกลับ
    const result = filteredPositions.slice(0, 20);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("GET /recruitment/api/positions exception:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาด",
      },
      { status: 500 }
    );
  }
}