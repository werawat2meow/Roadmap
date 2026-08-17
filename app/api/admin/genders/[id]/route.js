import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req,{ params }) {
  try {
    const { id } = await params;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("genders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลเพศ",
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
      "Genders GET(ID) Error:",
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
    const { id } = await params;

    const body =
      await req.json();

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

      updated_at:
        new Date().toISOString(),
    };

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
      .neq("id", id)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสเพศนี้มีอยู่แล้ว",
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
      .from("genders")
      .select("id")
      .eq(
        "gender_name_th",
        payload.gender_name_th
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateThai) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อเพศนี้มีอยู่แล้ว",
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
      .from("genders")
      .select("id")
      .eq(
        "gender_name_en",
        payload.gender_name_en
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateEnglish) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อเพศภาษาอังกฤษนี้มีอยู่แล้ว",
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
        .from("genders")
        .select("id")
        .eq(
          "short_name_th",
          payload.short_name_th
        )
        .neq("id", id)
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
        .from("genders")
        .select("id")
        .eq(
          "short_name_en",
          payload.short_name_en
        )
        .neq("id", id)
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
       Update
    =========================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("genders")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลเพศเรียบร้อย",
      data,
    });
  } catch (error) {
    console.error(
      "Genders PATCH Error:",
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
      data: gender,
      error: genderError,
    } = await supabaseAdmin
      .from("genders")
      .select(
        "id, gender_name_th, is_default"
      )
      .eq("id", id)
      .single();

    if (genderError) {
      throw genderError;
    }

    if (!gender) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลเพศ",
        },
        {
          status: 404,
        }
      );
    }

    /* ===========================
       Don't Delete Default
    =========================== */

    if (gender.is_default) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบเพศเริ่มต้นได้",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Delete
    =========================== */

    const { error } =
      await supabaseAdmin
        .from("genders")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลเพศเรียบร้อย",
    });
  } catch (error) {
    console.error(
      "Genders DELETE Error:",
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
