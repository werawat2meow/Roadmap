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
      .from("religions")
      .select("*", {
        count: "exact",
      });
          if (search) {
      query = query.or(
        [
          `religion_code.ilike.%${search}%`,
          `religion_name_th.ilike.%${search}%`,
          `religion_name_en.ilike.%${search}%`,
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
      .order(
        "religion_name_th"
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
        .from("religions")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "active"),

      supabaseAdmin
        .from("religions")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "inactive"),

      supabaseAdmin
        .from("religions")
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
        defaultReligion: defaultCount || 0,
      },
    });
  } catch (error) {
    console.error(
      "Religions GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load religions",
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
      religion_code:
        body?.religion_code
          ?.trim()
          ?.toUpperCase(),

      religion_name_th:
        body?.religion_name_th?.trim(),

      religion_name_en:
        body?.religion_name_en?.trim(),

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

    if (!payload.religion_code) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสศาสนา",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.religion_name_th) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อศาสนา",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.religion_name_en) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อศาสนาภาษาอังกฤษ",
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
      .from("religions")
      .select("id")
      .eq(
        "religion_code",
        payload.religion_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสศาสนานี้มีอยู่แล้ว",
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
      .from("religions")
      .select("id")
      .eq(
        "religion_name_th",
        payload.religion_name_th
      )
      .maybeSingle();

    if (duplicateThai) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อศาสนานี้มีอยู่แล้ว",
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
      .from("religions")
      .select("id")
      .eq(
        "religion_name_en",
        payload.religion_name_en
      )
      .maybeSingle();

    if (duplicateEnglish) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อศาสนาภาษาอังกฤษนี้มีอยู่แล้ว",
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
        .from("religions")
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
        .from("religions")
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
       Default Religion
    =========================== */

    if (payload.is_default) {
      await supabaseAdmin
        .from("religions")
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
      .from("religions")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มข้อมูลศาสนาเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "Religions POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถเพิ่มข้อมูลศาสนาได้",
      },
      {
        status: 500,
      }
    );
  }
}
