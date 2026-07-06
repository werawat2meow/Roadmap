import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const all = searchParams.get("all") === "true";

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const pageSize = Math.max(Number(searchParams.get("pageSize") || 20), 1);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("skills")
      .select("*", { count: "exact" })
      .order("sort_order", { ascending: true })
      .order("skill_name", { ascending: true });

    if (search) {
      query = query.or(
        `skill_code.ilike.%${search}%,skill_name.ilike.%${search}%,skill_category.ilike.%${search}%`
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (!all) {
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize: all ? data?.length || 0 : pageSize,
        total: count || 0,
        totalPages: all ? 1 : Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error("GET_SKILLS_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Load skills failed" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const skillCode = body?.skill_code?.trim()?.toUpperCase();
    const skillName = body?.skill_name?.trim();

    if (!skillCode) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกรหัส Skill" },
        { status: 400 }
      );
    }

    if (!skillName) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอกชื่อ Skill" },
        { status: 400 }
      );
    }

    const payload = {
      skill_code: skillCode,
      skill_name: skillName,
      skill_category: body?.skill_category?.trim() || null,
      status: body?.status || "active",
      sort_order: Number(body?.sort_order || 0),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("skills")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Skill สำเร็จ",
      data,
    });
  } catch (error) {
    console.error("POST_SKILL_ERROR:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Create skill failed" },
      { status: 500 }
    );
  }
}