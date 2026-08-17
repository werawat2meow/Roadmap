import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search =
      searchParams.get("search") || "";

    const positionLevelId =
      searchParams.get(
        "position_level_id"
      ) || "";

    const page = Number(
      searchParams.get("page") || 1
    );

    const pageSize = Number(
      searchParams.get("pageSize") || 20
    );

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseAdmin
      .from("position_level_bands")
      .select(
        `
        *,
        position_levels(
          id,
          level_code,
          level_name
        )
      `,
        {
          count: "exact",
        }
      );

    if (search) {
      query = query.or(
        `band_code.ilike.%${search}%,band_name.ilike.%${search}%`
      );
    }

    if (positionLevelId) {
      query = query.eq(
        "position_level_id",
        positionLevelId
      );
    }

    const {
      data,
      error,
      count,
    } = await query
      .order("step_no")
      .order("sort_order")
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
      position_level_id:
        body.position_level_id,

      band_code: body.band_code
        ?.trim()
        ?.toUpperCase(),

      band_name:
        body.band_name?.trim(),

      step_no:
        Number(body.step_no) || 1,

      currency:
        body.currency || "THB",

      salary_min:
        Number(body.salary_min) || 0,

      salary_mid:
        Number(body.salary_mid) || 0,

      salary_max:
        Number(body.salary_max) || 0,

      annual_min:
        Number(body.annual_min) || 0,

      annual_mid:
        Number(body.annual_mid) || 0,

      annual_max:
        Number(body.annual_max) || 0,

      target_bonus_percent:
        Number(
          body.target_bonus_percent
        ) || 0,

      merit_increase_percent:
        Number(
          body.merit_increase_percent
        ) || 0,

      overtime_rate:
        Number(body.overtime_rate) || 0,

      allowance_amount:
        Number(
          body.allowance_amount
        ) || 0,

      effective_date:
        body.effective_date || null,

      expire_date:
        body.expire_date || null,

      remark:
        body.remark?.trim() || null,

      sort_order:
        Number(body.sort_order) || 0,

      status:
        body.status || "active",

      updated_at:
        new Date().toISOString(),
    };

    if (!payload.position_level_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกระดับตำแหน่ง",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.band_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอก Band Code",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.band_name) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอก Band Name",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payload.salary_max <
      payload.salary_min
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Salary Max ต้องมากกว่าหรือเท่ากับ Salary Min",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: duplicate,
      error: duplicateError,
    } = await supabaseAdmin
      .from("position_level_bands")
      .select("id")
      .eq(
        "position_level_id",
        payload.position_level_id
      )
      .eq(
        "band_code",
        payload.band_code
      )
      .maybeSingle();

    if (duplicateError)
      throw duplicateError;

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Band Code นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("position_level_bands")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "สร้าง Salary Band สำเร็จ",
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