import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const page = Math.max(
      Number(
        searchParams.get("page")
      ) || 1,
      1
    );

    const pageSize = Math.max(
      Number(
        searchParams.get("pageSize")
      ) || 20,
      1
    );

    const search =
      searchParams
        .get("search")
        ?.trim() || "";

    const status =
      searchParams.get("status") ||
      "";

    const gender =
      searchParams.get("gender") ||
      "";

    const all =
      searchParams.get("all") ===
      "true";

    let query = supabaseAdmin
      .from("titles")
      .select("*", {
        count: "exact",
      });
          if (search) {
      query = query.or(
        [
          `title_code.ilike.%${search}%`,
          `title_name_th.ilike.%${search}%`,
          `title_name_en.ilike.%${search}%`,
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

    if (gender) {
      query = query.eq(
        "gender",
        gender
      );
    }
        query = query
      .order("sort_order")
      .order("title_name_th");
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
        .from("titles")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "active"),

      supabaseAdmin
        .from("titles")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "inactive"),

      supabaseAdmin
        .from("titles")
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
        defaultTitle: defaultCount || 0,
      },
    });
  } catch (error) {
    console.error(
      "Titles GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load titles",
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
      title_code:
        body?.title_code
          ?.trim()
          ?.toUpperCase(),

      title_name_th:
        body?.title_name_th?.trim(),

      title_name_en:
        body?.title_name_en?.trim(),

      short_name_th:
        body?.short_name_th?.trim() ||
        null,

      short_name_en:
        body?.short_name_en?.trim() ||
        null,

      gender:
        body?.gender || null,

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

    if (!payload.title_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสคำนำหน้า",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.title_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อคำนำหน้า",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.title_name_en) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อภาษาอังกฤษ",
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
      .from("titles")
      .select("id")
      .eq(
        "title_code",
        payload.title_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสคำนำหน้านี้มีอยู่แล้ว",
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
      .from("titles")
      .select("id")
      .eq(
        "title_name_th",
        payload.title_name_th
      )
      .maybeSingle();

    if (duplicateThai) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อคำนำหน้านี้มีอยู่แล้ว",
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
      .from("titles")
      .select("id")
      .eq(
        "title_name_en",
        payload.title_name_en
      )
      .maybeSingle();

    if (duplicateEnglish) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อภาษาอังกฤษนี้มีอยู่แล้ว",
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
        .from("titles")
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
        .from("titles")
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
       Default Title
    =========================== */

    if (payload.is_default) {
      await supabaseAdmin
        .from("titles")
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
      .from("titles")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มคำนำหน้าเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "Titles POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถเพิ่มคำนำหน้าได้",
      },
      {
        status: 500,
      }
    );
  }
}