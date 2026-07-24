import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 20);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("position_levels")
      .select(`
        *,
        position_level_bands(count)
      `, {
        count: "exact",
      });

    if (search) {
      query = query.or(
        `level_code.ilike.%${search}%,level_name.ilike.%${search}%`
      );
    }

    const {
      data,
      error,
      count,
    } = await query
      .order("sort_order", {
        ascending: true,
      })
      .order("level_code", {
        ascending: true,
      })
      .range(from, to);

    if (error) throw error;

    const rows = (data || []).map((item) => ({
      ...item,
      band_count:
        item.position_level_bands?.[0]?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      data: rows,
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
      level_code: body.level_code?.trim()?.toUpperCase(),
      level_name: body.level_name?.trim(),
      sort_order:Number(body.sort_order) || 0,
      status:body.status || "active",
      updated_at:new Date().toISOString(),
    };

    if (!payload.level_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Level Code",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.level_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Level Name",
        },
        {
          status: 400,
        }
      );
    }

    const {data: duplicate, error: duplicateError,} = await supabaseAdmin
      .from("position_levels")
      .select("id")
      .eq(
        "level_code",
        payload.level_code
      )
      .maybeSingle();

    if (duplicateError)
      throw duplicateError;

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:"Level Code นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const {data,error,} = await supabaseAdmin
      .from("position_levels")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;


    await writeActivityLog({
      module_name: "position-levels",
      action_type: "create",
      reference_table: "position_levels",
      reference_id: data.id,
      description: `เพิ่มระดับตำแหน่ง ${data.level_code} - ${data.level_name}`,
      new_data: {
        level_code: data.level_code,
        level_name: data.level_name,
        sort_order: data.sort_order,
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "สร้าง Position Level สำเร็จ",
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