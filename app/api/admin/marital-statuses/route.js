import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const pageSize = Math.max(
      Number(searchParams.get("pageSize")) || 20,
      1
    );

    const search =
      searchParams.get("search")?.trim() || "";

    const status =
      searchParams.get("status") || "";

    const all =
      searchParams.get("all") === "true";

    let query = supabaseAdmin
      .from("marital_statuses")
      .select("*", {
        count: "exact",
      });
          if (search) {
      query = query.or(
        [
          `marital_status_code.ilike.%${search}%`,
          `marital_status_name_th.ilike.%${search}%`,
          `marital_status_name_en.ilike.%${search}%`,
          `short_name_th.ilike.%${search}%`,
          `short_name_en.ilike.%${search}%`,
        ].join(",")
      );
    }
        if (status) {
      query = query.eq(
        "status",
        status
      );
    }
        query = query
      .order("sort_order")
      .order("marital_status_name_th");
          if (all) {
      const {
        data,
        error,
      } = await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
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
        /* ===========================
       Summary
    =========================== */

    const [
      { count: activeCount },
      { count: inactiveCount },
      { count: defaultCount },
    ] = await Promise.all([
      supabaseAdmin
        .from("marital_statuses")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "active"),

      supabaseAdmin
        .from("marital_statuses")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "inactive"),

      supabaseAdmin
        .from("marital_statuses")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("is_default", true),
    ]);

    /* ===========================
       Response
    =========================== */

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

      summary: {
        total: count || 0,
        active: activeCount || 0,
        inactive: inactiveCount || 0,
        defaultMaritalStatus:
          defaultCount || 0,
      },
    });
  } catch (error) {
    console.error(
      "Marital Statuses GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load marital statuses",
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
      marital_status_code:
        body?.marital_status_code
          ?.trim()
          ?.toUpperCase(),

      marital_status_name_th:
        body?.marital_status_name_th?.trim(),

      marital_status_name_en:
        body?.marital_status_name_en?.trim(),

      short_name_th:
        body?.short_name_th?.trim() ||
        null,

      short_name_en:
        body?.short_name_en?.trim() ||
        null,

      description:
        body?.description?.trim() ||
        null,

      is_default:
        body?.is_default ?? false,

      sort_order:
        body?.sort_order ?? 0,

      status:
        body?.status || "active",
    };

    /* ===========================
       Validation
    =========================== */

    if (!payload.marital_status_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสสถานภาพสมรส",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.marital_status_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อสถานภาพสมรส",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.marital_status_name_en) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อสถานภาพสมรสภาษาอังกฤษ",
        },
        {
          status: 400,
        }
      );
    }
        /* ===========================
       Duplicate Code
    =========================== */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("marital_statuses")
      .select("id")
      .eq(
        "marital_status_code",
        payload.marital_status_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสสถานภาพสมรสนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Duplicate Thai Name
    =========================== */

    const {
      data: duplicateThai,
    } = await supabaseAdmin
      .from("marital_statuses")
      .select("id")
      .eq(
        "marital_status_name_th",
        payload.marital_status_name_th
      )
      .maybeSingle();

    if (duplicateThai) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อสถานภาพสมรสนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Duplicate English Name
    =========================== */

    const {
      data: duplicateEnglish,
    } = await supabaseAdmin
      .from("marital_statuses")
      .select("id")
      .eq(
        "marital_status_name_en",
        payload.marital_status_name_en
      )
      .maybeSingle();

    if (duplicateEnglish) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อสถานภาพสมรสภาษาอังกฤษนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Duplicate Short TH
    =========================== */

    if (payload.short_name_th) {
      const {
        data: duplicateShortTH,
      } = await supabaseAdmin
        .from("marital_statuses")
        .select("id")
        .eq(
          "short_name_th",
          payload.short_name_th
        )
        .maybeSingle();

      if (duplicateShortTH) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ชื่อย่อภาษาไทยนี้มีอยู่แล้ว",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* ===========================
       Duplicate Short EN
    =========================== */

    if (payload.short_name_en) {
      const {
        data: duplicateShortEN,
      } = await supabaseAdmin
        .from("marital_statuses")
        .select("id")
        .eq(
          "short_name_en",
          payload.short_name_en
        )
        .maybeSingle();

      if (duplicateShortEN) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ชื่อย่อภาษาอังกฤษนี้มีอยู่แล้ว",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* ===========================
       Default Marital Status
    =========================== */

    if (payload.is_default) {
      await supabaseAdmin
        .from("marital_statuses")
        .update({
          is_default: false,
        })
        .eq("is_default", true);
    }

    /* ===========================
       Insert
    =========================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("marital_statuses")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มสถานภาพสมรสเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "Marital Statuses POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถเพิ่มสถานภาพสมรสได้",
      },
      {
        status: 500,
      }
    );
  }
}
