// ไฟล์ใหม่ — ค้นหาตำแหน่งงาน (status = active) สำหรับ dropdown แบบพิมพ์ค้นหา
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request) {
  try {

    let query = supabaseAdmin
      .from("positions")
      .select("id, position_name, position_group")
      .eq("status", "active")
      .order("position_name", { ascending: true });

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