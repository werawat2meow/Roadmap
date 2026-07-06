import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 10), 1);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("benefit_fiscal_years")
      .select("*", { count: "exact" })
      .order("fiscal_year", { ascending: false })
      .order("sort_order", { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(
        `fiscal_name.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "โหลดข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const payload = {
      fiscal_year: Number(body?.fiscal_year),
      fiscal_name: body?.fiscal_name?.trim(),
      start_date: body?.start_date || null,
      end_date: body?.end_date || null,
      is_current: body?.is_current ?? false,
      is_closed: body?.is_closed ?? false,
      description: body?.description?.trim() || null,
      sort_order: Number(body?.sort_order || 1),
      is_active: body?.is_active ?? true,
    };

    if (!payload.fiscal_year || !payload.fiscal_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Fiscal Year และชื่อปีงบประมาณ" },
        { status: 400 }
      );
    }

    if (!payload.start_date || !payload.end_date) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือก Start Date และ End Date" },
        { status: 400 }
      );
    }

    if (payload.end_date < payload.start_date) {
      return NextResponse.json(
        { success: false, error: "End Date ต้องไม่น้อยกว่า Start Date" },
        { status: 400 }
      );
    }

    if (payload.is_current) {
      await supabaseAdmin
        .from("benefit_fiscal_years")
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .neq("fiscal_year", payload.fiscal_year);
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_fiscal_years")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Fiscal Year สำเร็จ",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "บันทึกข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}