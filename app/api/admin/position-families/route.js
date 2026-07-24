import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("position_families")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `family_code.ilike.%${search}%,family_name.ilike.%${search}%`
      );
    }

    const {
      data,
      error,
      count,
    } = await query
      .order("sort_order", { ascending: true })
      .order("family_code", { ascending: true })
      .range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.max(
          1,
          Math.ceil((count || 0) / pageSize)
        ),
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const payload = {
      family_code: body.family_code
        ?.trim()
        ?.toUpperCase(),

      family_name: body.family_name?.trim(),

      description:
        body.description?.trim() || null,

      sort_order:
        Number(body.sort_order) || 0,

      status:
        body.status || "active",

      updated_at: new Date().toISOString(),
    };

    if (!payload.family_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Family Code",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.family_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Family Name",
        },
        {
          status: 400,
        }
      );
    }

    const { data: duplicate } =
      await supabaseAdmin
        .from("position_families")
        .select("id")
        .eq("family_code", payload.family_code)
        .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Family Code นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } =
      await supabaseAdmin
        .from("position_families")
        .insert(payload)
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "สร้าง Position Family สำเร็จ",
      data,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}