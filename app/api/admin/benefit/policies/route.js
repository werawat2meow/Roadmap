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
      .from("benefit_policies")
      .select("*", { count: "exact" })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(
        `policy_code.ilike.%${search}%,policy_name.ilike.%${search}%,description.ilike.%${search}%`
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

    const policy_code = body?.policy_code?.trim()?.toUpperCase();
    const policy_name = body?.policy_name?.trim();
    const description = body?.description?.trim() || null;
    const effective_from = body?.effective_from || null;
    const effective_to = body?.effective_to || null;
    const sort_order = Number(body?.sort_order || 1);
    const is_active = body?.is_active ?? true;

    if (!policy_code || !policy_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Code และชื่อ Policy" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_policies")
      .insert({
        policy_code,
        policy_name,
        description,
        effective_from,
        effective_to,
        sort_order,
        is_active,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Benefit Policy สำเร็จ",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "บันทึกข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}