// ไฟล์ใหม่ — ดึงข้อมูลตำแหน่งเดี่ยว ใช้ตอนโหลดหน้าแก้ไข (แสดงชื่อตำแหน่ง)
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

// GET /recruitment/api/positions/:id
export async function GET(request, { params }) {
  // try {
    const { id } = await params;

    console.log("test");  

    const { data, error } = await supabaseAdmin
      .from("positions")
      .select("id, position_name, position_level, position_group, headcount_target")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  // } catch (error) {
  //   return NextResponse.json(
  //     {
  //       success: false,
  //       message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
  //     },
  //     { status: 500 }
  //   );
  // }
}
