import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("countries")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลประเทศ",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Countries GET(ID) Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถโหลดข้อมูลประเทศได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req,{ params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const payload = {
      country_code:
        body?.country_code
          ?.trim()
          ?.toUpperCase(),

      iso2:
        body?.iso2
          ?.trim()
          ?.toUpperCase(),

      iso3:
        body?.iso3
          ?.trim()
          ?.toUpperCase(),

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

      updated_at:
        new Date().toISOString(),
    };
        const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("countries")
      .select("id")
      .eq(
        "country_code",
        payload.country_code
      )
      .neq("id", id)
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

    const {
      data: duplicateISO2,
    } = await supabaseAdmin
      .from("countries")
      .select("id")
      .eq("iso2", payload.iso2)
      .neq("id", id)
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

    const {
      data: duplicateISO3,
    } = await supabaseAdmin
      .from("countries")
      .select("id")
      .eq("iso3", payload.iso3)
      .neq("id", id)
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

    if (payload.is_default) {
      await supabaseAdmin
        .from("countries")
        .update({
          is_default: false,
        })
        .eq("is_default", true);
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("countries")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขข้อมูลประเทศเรียบร้อย",
      data,
    });
  } catch (error) {
    console.error(
      "Countries PATCH Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถแก้ไขข้อมูลได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req,{ params }) {
  try {
    const { id } =await params;
    const { error } =
      await supabaseAdmin
        .from("countries")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "ลบประเทศเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "Countries DELETE Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถลบข้อมูลได้",
      },
      {
        status: 500,
      }
    );
  }
}
