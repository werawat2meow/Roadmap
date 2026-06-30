import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "";

    if (type === "benefits") {
      const { data, error } = await supabaseAdmin
        .from("benefits")
        .select("id, benefit_code, benefit_name")
        .eq("is_active", true)
        .order("benefit_name", { ascending: true });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "โหลดข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}