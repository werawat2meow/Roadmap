import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req,{ params }) {
  try {
    const { id } = await params;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("marital_statuses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลสถานภาพสมรส",
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
      "Marital Statuses GET(ID) Error:",
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

      updated_at:
        new Date().toISOString(),
    };

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
      .neq("id", id)
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
      .neq("id", id)
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
      .neq("id", id)
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
        .from("marital_statuses")
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
       Update
    =========================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("marital_statuses")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขข้อมูลสถานภาพสมรสเรียบร้อย",
      data,
    });
  } catch (error) {
    console.error(
      "Marital Statuses PATCH Error:",
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

/* =========================================================
   DELETE
========================================================= */

export async function DELETE(req,{ params }) {
  try {
    const { id } = await params;
    const {
      data: maritalStatus,
      error: maritalStatusError,
    } = await supabaseAdmin
      .from("marital_statuses")
      .select(
        "id, marital_status_name_th, is_default"
      )
      .eq("id", id)
      .single();

    if (maritalStatusError) {
      throw maritalStatusError;
    }

    if (!maritalStatus) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบข้อมูลสถานภาพสมรส",
        },
        {
          status: 404,
        }
      );
    }

    /* ===========================
       Don't Delete Default
    =========================== */

    if (maritalStatus.is_default) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่สามารถลบสถานภาพสมรสเริ่มต้นได้",
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
        .from("marital_statuses")
        .delete()
        .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message:
        "ลบข้อมูลสถานภาพสมรสเรียบร้อย",
    });
  } catch (error) {
    console.error(
      "Marital Statuses DELETE Error:",
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