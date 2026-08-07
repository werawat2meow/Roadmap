import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const all =
      searchParams.get("all") === "true";

    const page = Number(
      searchParams.get("page") || 1
    );

    const pageSize = Number(
      searchParams.get("pageSize") || 20
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status") || "";

    let query = supabaseAdmin
      .from("competency_types")
      .select("*", {
        count: "exact",
      });

    if (search) {
      query = query.or(
        [
          `type_code.ilike.%${search}%`,
          `type_name.ilike.%${search}%`,
          `description.ilike.%${search}%`,
        ].join(",")
      );
    }

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    query = query.order(
      "sort_order",
      {
        ascending: true,
      }
    );

    query = query.order(
      "created_at",
      {
        ascending: false,
      }
    );

    if (all) {
      const { data, error } =
        await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    const {
      data,
      error,
      count,
    } = await query.range(
      from,
      to
    );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil(
          (count || 0) / pageSize
        ),
      },
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "โหลดข้อมูล Competency Type ไม่สำเร็จ",
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
      type_code: body?.type_code?.trim()?.toUpperCase(),
      type_name: body?.type_name?.trim(),
      description: body?.description?.trim() || null,
      status: body?.status || "active",
      sort_order: Number(body?.sort_order || 0),
    };

    if (!payload.type_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Type Code",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.type_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Type Name",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================
     * Duplicate Type Code
     * ========================== */

    const { data: duplicate } = await supabaseAdmin
      .from("competency_types")
      .select("id")
      .eq("type_code", payload.type_code)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "Type Code นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ==========================
     * Insert
     * ========================== */

    const { data, error } = await supabaseAdmin
      .from("competency_types")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    /* ==========================
     * Activity Log
     * ========================== */

    await writeActivityLog({
      action: "CREATE",
      module: "Competency Types",
      description: `เพิ่ม Competency Type : ${data.type_code} - ${data.type_name}`,
      table_name: "competency_types",
      record_id: data.id,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      data,
      message: "เพิ่ม Competency Type สำเร็จ",
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "เพิ่ม Competency Type ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}