// ไฟล์ใหม่ — ค้นหาตำแหน่งงาน (status = active) สำหรับ dropdown แบบพิมพ์ค้นหา
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// GET /recruitment/api/positions?q=คำค้นหา
export async function GET(request) {
  try {

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    let query = supabaseAdmin
      .from("positions")
      .select("id, position_name, position_group")
      .eq("status", "active")
      .order("position_name", { ascending: true })
      .limit(20);

    if (q) {
      query = query.ilike("position_name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 }
    );
  }
}
