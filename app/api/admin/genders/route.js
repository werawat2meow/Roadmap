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
      .from("genders")
      .select("*", {
        count: "exact",
      });
          if (search) {
      query = query.or(
        [
          `gender_code.ilike.%${search}%`,
          `gender_name_th.ilike.%${search}%`,
          `gender_name_en.ilike.%${search}%`,
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
      .order("gender_name_th");
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
        .from("genders")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "active"),

      supabaseAdmin
        .from("genders")
        .select("*", {
          head: true,
          count: "exact",
        })
        .eq("status", "inactive"),

      supabaseAdmin
        .from("genders")
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
        defaultGender: defaultCount || 0,
      },
    });
  } catch (error) {
    console.error(
      "Genders GET Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load genders",
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
      gender_code:
        body?.gender_code
          ?.trim()
          ?.toUpperCase(),

      gender_name_th:
        body?.gender_name_th?.trim(),

      gender_name_en:
        body?.gender_name_en?.trim(),

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

    if (!payload.gender_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสเพศ",
        },
        { status: 400 }
      );
    }

    if (!payload.gender_name_th) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อเพศ",
        },
        { status: 400 }
      );
    }

    if (!payload.gender_name_en) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อเพศภาษาอังกฤษ",
        },
        { status: 400 }
      );
    }
        /* ===========================
       Duplicate Code
    =========================== */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("genders")
      .select("id")
      .eq(
        "gender_code",
        payload.gender_code
      )
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสเพศนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ===========================
       Duplicate Thai Name
    =========================== */

    const {
      data: duplicateThai,
    } = await supabaseAdmin
      .from("genders")
      .select("id")
      .eq(
        "gender_name_th",
        payload.gender_name_th
      )
      .maybeSingle();

    if (duplicateThai) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อเพศนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ===========================
       Duplicate English Name
    =========================== */

    const {
      data: duplicateEnglish,
    } = await supabaseAdmin
      .from("genders")
      .select("id")
      .eq(
        "gender_name_en",
        payload.gender_name_en
      )
      .maybeSingle();

    if (duplicateEnglish) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อเพศภาษาอังกฤษนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ===========================
       Duplicate Short TH
    =========================== */

    if (payload.short_name_th) {
      const {
        data: duplicateShortTH,
      } = await supabaseAdmin
        .from("genders")
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
          { status: 400 }
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
        .from("genders")
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
          { status: 400 }
        );
      }
    }

    /* ===========================
       Default Gender
    =========================== */

    if (payload.is_default) {
      await supabaseAdmin
        .from("genders")
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
      .from("genders")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "เพิ่มข้อมูลเพศเรียบร้อยแล้ว",
      data,
    });
  } catch (error) {
    console.error(
      "Genders POST Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถเพิ่มข้อมูลเพศได้",
      },
      {
        status: 500,
      }
    );
  }
}
