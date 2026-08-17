import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req,{ params }) {
  try {
    const { id } =
      await params;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("nationalities")
      .select(`
        *,
        countries (
          id,
          country_code,
          country_name_th,
          country_name_en
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลสัญชาติ",
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
      "Nationalities GET(ID) Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถโหลดข้อมูลได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(req,{ params }) {
  try {
    const { id } =
      await params;

    const body =
      await req.json();

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

      updated_at:
        new Date().toISOString(),
    };

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
      .neq("id", id)
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

    const {data: duplicateThai,} = await supabaseAdmin
      .from("nationalities")
      .select("id")
      .eq(
        "nationality_name_th",
        payload.nationality_name_th
      )
      .neq("id", id)
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

    const {
      data: duplicateEnglish,
    } = await supabaseAdmin
      .from("nationalities")
      .select("id")
      .eq(
        "nationality_name_en",
        payload.nationality_name_en
      )
      .neq("id", id)
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

    if (payload.is_default) {
      await supabaseAdmin
        .from("nationalities")
        .update({
          is_default: false,
        })
        .eq("is_default", true);
    }

    const {data,error,} = await supabaseAdmin
      .from("nationalities")
      .update(payload)
      .eq("id", id)
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
        "แก้ไขข้อมูลสัญชาติเรียบร้อย",
      data,
    });
  } catch (error) {
    console.error(
      "Nationalities PATCH Error:",
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
    const { id } = await params;

    const {
      data: nationality,
      error: nationalityError,
    } = await supabaseAdmin
      .from("nationalities")
      .select(
        "id,nationality_name_th,is_default"
      )
      .eq("id", id)
      .single();

    if (nationalityError)
      throw nationalityError;

    if (!nationality) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลสัญชาติ",
        },
        {
          status: 404,
        }
      );
    }

    if (nationality.is_default) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบสัญชาติเริ่มต้นได้",
        },
        {
          status: 400,
        }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("nationalities")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "ลบข้อมูลสัญชาติเรียบร้อย",
    });
  } catch (error) {
    console.error(
      "Nationalities DELETE Error:",
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