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

    const search =searchParams.get("search")?.trim() || "";
    const status =searchParams.get("status") || "";
    const all =searchParams.get("all") === "true";
    let query = supabaseAdmin
      .from("countries")
      .select("*", {
        count: "exact",
      });

    /* ===========================
       Search
    =========================== */

    if (search) {
      query = query.or(
        [
          `country_code.ilike.%${search}%`,
          `iso2.ilike.%${search}%`,
          `iso3.ilike.%${search}%`,
          `country_name_th.ilike.%${search}%`,
          `country_name_en.ilike.%${search}%`,
          `nationality_th.ilike.%${search}%`,
          `nationality_en.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* ===========================
       Status
    =========================== */

    if (status) {
      query = query.eq(
        "status",
        status
      );
    }

    /* ===========================
       Order
    =========================== */

    query = query
      .order("sort_order", {
        ascending: true,
      })
      .order("country_name_en", {
        ascending: true,
      });

    /* ===========================
       All
    =========================== */

    if (all) {
      const {data,error,} = await query;
      if (error) throw error;
      return NextResponse.json({
        success: true,
        data,
      });
    }

    /* ===========================
       Pagination
    =========================== */

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
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

    const [{ count: activeCount },{ count: inactiveCount },{ count: defaultCount },{ count: thailandCount },] = await Promise.all([
      supabaseAdmin
        .from("countries")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "active"),

      supabaseAdmin
        .from("countries")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "inactive"),

      supabaseAdmin
        .from("countries")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("is_default", true),

      supabaseAdmin
        .from("countries")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("is_thailand", true),
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
        inactive:inactiveCount || 0,
        defaultCountry:defaultCount || 0,
        thailand: thailandCount || 0,
      },
    });
  } catch (error) {
    console.error(
      "Countries GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load countries",
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
      country_code: body?.country_code?.trim()?.toUpperCase(),
      iso2: body?.iso2?.trim()?.toUpperCase(),
      iso3: body?.iso3?.trim()?.toUpperCase(),

      country_name_th:
        body?.country_name_th?.trim(),

      country_name_en:
        body?.country_name_en?.trim(),

      nationality_th:
        body?.nationality_th?.trim() ||
        null,

      nationality_en:
        body?.nationality_en?.trim() ||
        null,

      dialing_code:
        body?.dialing_code?.trim() ||
        null,

      currency_code:
        body?.currency_code
          ?.trim()
          ?.toUpperCase() || null,

      currency_name:
        body?.currency_name?.trim() ||
        null,

      currency_symbol:
        body?.currency_symbol?.trim() ||
        null,

      timezone:
        body?.timezone?.trim() ||
        null,

      flag_emoji:
        body?.flag_emoji?.trim() ||
        null,

      flag_image_url:
        body?.flag_image_url?.trim() ||
        null,

      flag_image_path:
        body?.flag_image_path?.trim() ||
        null,

      continent:
        body?.continent?.trim() ||
        null,

      region:
        body?.region?.trim() ||
        null,

      is_default:
        body?.is_default ?? false,

      is_thailand:
        body?.is_thailand ?? false,

      sort_order:
        body?.sort_order ?? 0,

      status:
        body?.status || "active",
    };

    /* ===========================
       Validation
    =========================== */

    if (!payload.country_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสประเทศ",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.iso2) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก ISO2",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.iso3) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก ISO3",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.country_name_th) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อประเทศ",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.country_name_en) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อประเทศภาษาอังกฤษ",
        },
        {
          status: 400,
        }
      );
    }
        /* ===========================
       Duplicate Country Code
    =========================== */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("countries")
      .select("id")
      .eq(
        "country_code",
        payload.country_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสประเทศนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Duplicate ISO2
    =========================== */

    const {
      data: duplicateISO2,
    } = await supabaseAdmin
      .from("countries")
      .select("id")
      .eq("iso2", payload.iso2)
      .maybeSingle();

    if (duplicateISO2) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ISO2 นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Duplicate ISO3
    =========================== */

    const {
      data: duplicateISO3,
    } = await supabaseAdmin
      .from("countries")
      .select("id")
      .eq("iso3", payload.iso3)
      .maybeSingle();

    if (duplicateISO3) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ISO3 นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Default Country
    =========================== */

    if (payload.is_default) {
      await supabaseAdmin
        .from("countries")
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
      .from("countries")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มประเทศเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "Countries POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถเพิ่มประเทศได้",
      },
      {
        status: 500,
      }
    );
  }
}
