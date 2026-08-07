import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
 * GET BY ID
 * ========================================================= */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("tax_profiles")
      .select(`
        *,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to fetch tax profile",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
 * PATCH
 * ========================================================= */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    const body = await req.json();

    const payload = {
      tax_profile_code:
        body?.tax_profile_code?.trim()?.toUpperCase(),

      tax_profile_name:
        body?.tax_profile_name?.trim(),

      description:
        body?.description?.trim() || null,

      tax_year:
        Number(body?.tax_year),

      company_id:
        body?.company_id || null,

      calculation_method:
        body?.calculation_method || "progressive",

      personal_allowance:
        Number(body?.personal_allowance || 60000),

      spouse_allowance:
        Number(body?.spouse_allowance || 0),

      child_allowance:
        Number(body?.child_allowance || 0),

      parent_allowance:
        Number(body?.parent_allowance || 0),

      social_security_max:
        Number(body?.social_security_max || 9000),

      provident_fund_max:
        Number(body?.provident_fund_max || 500000),

      effective_from:
        body?.effective_from || null,

      effective_to:
        body?.effective_to || null,

      status:
        body?.status || "active",

      sort_order:
        Number(body?.sort_order || 0),

      updated_at: new Date().toISOString(),
    };

    /* ===========================================
       Validation
    =========================================== */

    if (!payload.tax_profile_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสโปรไฟล์ภาษี",
        },
        { status: 400 }
      );
    }

    if (!payload.tax_profile_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อโปรไฟล์ภาษี",
        },
        { status: 400 }
      );
    }

    if (!payload.tax_year) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุปีภาษี",
        },
        { status: 400 }
      );
    }

    /* ===========================================
       Old Data
    =========================================== */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("tax_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    /* ===========================================
       Duplicate Code
    =========================================== */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("tax_profiles")
      .select("id")
      .eq(
        "tax_profile_code",
        payload.tax_profile_code
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสโปรไฟล์ภาษีนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ===========================================
       Duplicate Name
    =========================================== */

    const {
      data: duplicateName,
    } = await supabaseAdmin
      .from("tax_profiles")
      .select("id")
      .ilike(
        "tax_profile_name",
        payload.tax_profile_name
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อโปรไฟล์ภาษีนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ===========================================
       Update
    =========================================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("tax_profiles")
      .update(payload)
      .eq("id", id)
      .select(`
        *,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .single();

    if (error) throw error;

    /* ===========================================
       Activity Log
    =========================================== */

    try {
      await writeActivityLog({
        module_name: "Tax Profiles",
        action_type: "UPDATE",
        reference_table: "tax_profiles",
        reference_id: id,
        description: `แก้ไขโปรไฟล์ภาษี ${data.tax_profile_code} : ${data.tax_profile_name}`,
        old_data: oldData,
        new_data: data,
      });
    } catch (logError) {
      console.error(
        "Activity Log Error:",
        logError
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "แก้ไขโปรไฟล์ภาษีเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to update tax profile",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
 * DELETE
 * ========================================================= */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    /* ===========================================
       Old Data
    =========================================== */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("tax_profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบโปรไฟล์ภาษี",
        },
        {
          status: 404,
        }
      );
    }

    /* ===========================================
       Delete
    =========================================== */

    const { error } = await supabaseAdmin
      .from("tax_profiles")
      .delete()
      .eq("id", id);

    if (error) {
      // PostgreSQL Foreign Key Violation
      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            error:
              "ไม่สามารถลบข้อมูลได้ เนื่องจากมีการใช้งานโปรไฟล์ภาษีนี้อยู่",
          },
          {
            status: 400,
          }
        );
      }

      throw error;
    }

    /* ===========================================
       Activity Log
    =========================================== */

    try {
      await writeActivityLog({
        module_name: "Tax Profiles",
        action_type: "DELETE",
        reference_table: "tax_profiles",
        reference_id: id,
        description: `ลบโปรไฟล์ภาษี ${oldData.tax_profile_code} : ${oldData.tax_profile_name}`,
        old_data: oldData,
        new_data: null,
      });
    } catch (logError) {
      console.error(
        "Activity Log Error:",
        logError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "ลบโปรไฟล์ภาษีเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        error:error.message || "Failed to delete tax profile",
      },
      {
        status: 500,
      }
    );
  }
}
