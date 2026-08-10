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
      .from("titles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลคำนำหน้า",
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
      "Titles GET(ID) Error:",
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

export async function PATCH(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

    const body =
      await req.json();

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

      updated_at:
        new Date().toISOString(),
    };

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
      .neq("id", id)
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
      .neq("id", id)
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
      .neq("id", id)
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
        .from("titles")
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
       Update
    =========================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("titles")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขข้อมูลคำนำหน้าเรียบร้อย",
      data,
    });
  } catch (error) {
    console.error(
      "Titles PATCH Error:",
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

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } =
      await params;

    /* ===========================
       Check Exists
    =========================== */

    const {
      data: title,
      error: titleError,
    } = await supabaseAdmin
      .from("titles")
      .select(
        "id,title_name_th,is_default"
      )
      .eq("id", id)
      .single();

    if (titleError) throw titleError;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลคำนำหน้า",
        },
        {
          status: 404,
        }
      );
    }

    /* ===========================
       Don't Delete Default
    =========================== */

    if (title.is_default) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบคำนำหน้าเริ่มต้นได้",
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
        .from("titles")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "ลบข้อมูลคำนำหน้าเรียบร้อย",
    });
  } catch (error) {
    console.error(
      "Titles DELETE Error:",
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
