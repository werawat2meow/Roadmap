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

    const all =
      searchParams.get("all") ===
      "true";

    let query = supabaseAdmin
      .from("nationalities")
      .select(
        `
        *,
        countries (
          id,
          country_code,
          country_name_th,
          country_name_en
        )
      `,
        {
          count: "exact",
        }
      );
          if (search) {
      query = query.or(
        [
          `nationality_code.ilike.%${search}%`,
          `nationality_name_th.ilike.%${search}%`,
          `nationality_name_en.ilike.%${search}%`,
          `iso2.ilike.%${search}%`,
          `iso3.ilike.%${search}%`,
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
      .order(
        "nationality_name_en"
      );
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
        .from("nationalities")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "active"),

      supabaseAdmin
        .from("nationalities")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "inactive"),

      supabaseAdmin
        .from("nationalities")
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
        inactive:
          inactiveCount || 0,
        defaultNationality:
          defaultCount || 0,
      },
    });
  } catch (error) {
    console.error(
      "Nationalities GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load nationalities",
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
      nationality_code:
        body?.nationality_code
          ?.trim()
          ?.toUpperCase(),

      nationality_name_th:
        body?.nationality_name_th?.trim(),

      nationality_name_en:
        body?.nationality_name_en?.trim(),

      country_id:
        body?.country_id || null,

      iso2:
        body?.iso2
          ?.trim()
          ?.toUpperCase() || null,

      iso3:
        body?.iso3
          ?.trim()
          ?.toUpperCase() || null,

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

    if (!payload.nationality_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสสัญชาติ",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.nationality_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อสัญชาติ",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.nationality_name_en) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อสัญชาติภาษาอังกฤษ",
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
      .from("nationalities")
      .select("id")
      .eq(
        "nationality_code",
        payload.nationality_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสสัญชาตินี้มีอยู่แล้ว",
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
      .from("nationalities")
      .select("id")
      .eq(
        "nationality_name_th",
        payload.nationality_name_th
      )
      .maybeSingle();

    if (duplicateThai) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อสัญชาตินี้มีอยู่แล้ว",
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
      .from("nationalities")
      .select("id")
      .eq(
        "nationality_name_en",
        payload.nationality_name_en
      )
      .maybeSingle();

    if (duplicateEnglish) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อสัญชาติภาษาอังกฤษนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Default Nationality
    =========================== */

    if (payload.is_default) {
      await supabaseAdmin
        .from("nationalities")
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
      .from("nationalities")
      .insert(payload)
      .select(`
        *,
        countries (
          id,
          country_code,
          country_name_th,
          country_name_en
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มสัญชาติเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "Nationalities POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถเพิ่มสัญชาติได้",
      },
      {
        status: 500,
      }
    );
  }
}