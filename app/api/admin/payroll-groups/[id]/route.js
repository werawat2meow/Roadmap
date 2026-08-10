import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
 * Helper
 * ========================================================= */

function mapPayrollGroup(item) {
  return {
    id: item.id,

    payroll_group_code: item.payroll_group_code,
    payroll_group_name: item.payroll_group_name,

    payroll_company_id: item.payroll_company_id,

    payroll_company:
      item.payroll_companies || null,

    description: item.description || "",

    payment_day: item.payment_day,

    cutoff_end_day: item.cutoff_end_day,

    payment_frequency:
      item.payment_frequency,

    payment_offset_month:
      item.payment_offset_month,

    status: item.status,

    sort_order: item.sort_order,

    created_at: item.created_at,

    updated_at: item.updated_at,
  };
}

/* =========================================================
 * GET
 * ========================================================= */

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } =
      await supabaseAdmin
        .from("payroll_groups")
        .select(`
          *,
          payroll_companies (
            id,
            payroll_company_code,
            payroll_company_name
          )
        `)
        .eq("id", id)
        .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: mapPayrollGroup(data),
    });
  } catch (error) {
    console.error(
      "GET Payroll Group Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
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
      payroll_group_code:
        body?.payroll_group_code
          ?.trim()
          ?.toUpperCase(),

      payroll_group_name:
        body?.payroll_group_name
          ?.trim(),

      payroll_company_id:
        body?.payroll_company_id,

      description:
        body?.description?.trim() ||
        null,

      payment_day:
        body?.payment_day || null,

      cutoff_end_day:
        body?.cutoff_end_day || null,

      payment_frequency:
        body?.payment_frequency ||
        "monthly",

      payment_offset_month:
        Number(
          body?.payment_offset_month ??
            0
        ),

      status:
        body?.status || "active",

      sort_order:
        Number(
          body?.sort_order ?? 0
        ),

      updated_at:
        new Date().toISOString(),
    };

    /* =========================
       Old Data
    ========================= */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("payroll_groups")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    /* =========================
       Duplicate Code
    ========================= */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("payroll_groups")
      .select("id")
      .eq(
        "payroll_group_code",
        payload.payroll_group_code
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสกลุ่มเงินเดือนนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* =========================
       Duplicate Name
    ========================= */

    const {
      data: duplicateName,
    } = await supabaseAdmin
      .from("payroll_groups")
      .select("id")
      .eq(
        "payroll_group_name",
        payload.payroll_group_name
      )
      .eq(
        "payroll_company_id",
        payload.payroll_company_id
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อกลุ่มเงินเดือนนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("payroll_groups")
      .update(payload)
      .eq("id", id)
      .select(`
        *,
        payroll_companies (
          id,
          payroll_company_code,
          payroll_company_name
        )
      `)
      .single();

    if (error) throw error;

    try {
      await writeActivityLog({
        module_name:
          "Payroll Groups",

        action_type:
          "UPDATE",

        reference_table:
          "payroll_groups",

        reference_id:
          data.id,

        description: `แก้ไขกลุ่มเงินเดือน ${data.payroll_group_code}`,

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
        "บันทึกข้อมูลสำเร็จ",
      data: mapPayrollGroup(data),
    });
  } catch (error) {
    console.error(
      "PATCH Payroll Group Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
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

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } = await params;

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("payroll_groups")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const { error } =
      await supabaseAdmin
        .from("payroll_groups")
        .delete()
        .eq("id", id);

    if (error) throw error;

    try {
      await writeActivityLog({
        module_name:
          "Payroll Groups",

        action_type:
          "DELETE",

        reference_table:
          "payroll_groups",

        reference_id:
          id,

        description: `ลบกลุ่มเงินเดือน ${oldData.payroll_group_code}`,

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
        "ลบข้อมูลสำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE Payroll Group Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
