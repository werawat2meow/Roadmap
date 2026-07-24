import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================
   helper
========================= */

function mapCompetency(item) {
  return {
    id: item.id,

    competency_code:
      item.competency_code,

    competency_name:
      item.competency_name,

    competency_type:
      item.competency_type || "",

    description:
      item.description || "",

    status:
      item.status,

    sort_order:
      item.sort_order,

    created_at:
      item.created_at,

    updated_at:
      item.updated_at,
  };
}

/* =========================
   GET
========================= */

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const page = Number(
      searchParams.get("page") || 1
    );

    const pageSize = Number(
      searchParams.get("pageSize") || 20
    );

    const search =
      searchParams.get("search") || "";

    const status =
      searchParams.get("status") || "";

    const all =
      searchParams.get("all") === "true";

    let query = supabaseAdmin
      .from("competencies")
      .select("*", {
        count: "exact",
      });

    if (search) {
      query = query.or(
        `competency_code.ilike.%${search}%,competency_name.ilike.%${search}%,competency_type.ilike.%${search}%`
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

    if (!all) {
      const from =
        (page - 1) * pageSize;

      const to =
        from + pageSize - 1;

      query = query.range(
        from,
        to
      );
    }

    const {
      data,
      error,
      count,
    } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,

      data:
        (data || []).map(
          mapCompetency
        ),

      pagination: all
        ? undefined
        : {
            page,
            pageSize,
            total:
              count || 0,
            totalPages: Math.ceil(
              (count || 0) /
                pageSize
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
          "Load Failed",
      },
      {
        status: 500,
      }
    );
  }
}


/* =========================
   POST
========================= */

export async function POST(req) {
  try {
    const body = await req.json();

    const competency_code =
      body?.competency_code
        ?.trim()
        ?.toUpperCase();

    const competency_name =
      body?.competency_name?.trim();

    const competency_type =
      body?.competency_type?.trim() ||
      null;

    const description =
      body?.description?.trim() ||
      null;

    const status =
      body?.status || "active";

    const sort_order = Number(
      body?.sort_order || 0
    );

    /* =========================
       Validate
    ========================= */

    if (!competency_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุ Competency Code",
        },
        { status: 400 }
      );
    }

    if (!competency_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุ Competency Name",
        },
        { status: 400 }
      );
    }

    /* =========================
       Duplicate
    ========================= */

    const {
      data: duplicate,
    } = await supabaseAdmin
      .from("competencies")
      .select("id")
      .or(
        `competency_code.eq.${competency_code},competency_name.eq.${competency_name}`
      )
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Competency Code หรือ Competency Name นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* =========================
       Insert
    ========================= */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("competencies")
      .insert({
        competency_code,
        competency_name,
        competency_type,
        description,
        status,
        sort_order,
      })
      .select("*")
      .single();

    if (error) throw error;

    /* =========================
       Activity Log
    ========================= */

    await writeActivityLog({
      req,
      module: "Competencies",
      action: "CREATE",
      description: `เพิ่ม Competency ${data.competency_code} - ${data.competency_name}`,
    });

    /* =========================
       Response
    ========================= */

    return NextResponse.json({
      success: true,
      message: "เพิ่มข้อมูลสำเร็จ",
      data: mapCompetency(data),
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error:
          err.message ||
          "Create Failed",
      },
      {
        status: 500,
      }
    );
  }
}
