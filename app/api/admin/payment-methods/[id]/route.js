import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   GET
========================================================= */

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("payment_methods")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบวิธีการจ่ายเงิน",
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
      "GET Payment Method Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to load payment method.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PATCH
========================================================= */

export async function PATCH(req,{ params }) {
  try {
    const { id } = await params;

    const body =await req.json();
    const payload = {
      payment_method_code:
        body?.payment_method_code
          ?.trim()
          ?.toUpperCase(),

      payment_method_name:
        body?.payment_method_name
          ?.trim(),

      payment_method_name_en:
        body?.payment_method_name_en
          ?.trim() || null,

      description:
        body?.description?.trim() ||
        null,

      payment_type:
        body?.payment_type ||
        "bank_transfer",

      bank_required:
        body?.bank_required ??
        false,

      supports_payroll:
        body?.supports_payroll ??
        true,

      supports_expense:
        body?.supports_expense ??
        false,

      supports_benefit:
        body?.supports_benefit ??
        false,

      supports_vendor:
        body?.supports_vendor ??
        false,

      require_account_name:
        body?.require_account_name ??
        true,

      require_account_number:
        body?.require_account_number ??
        true,

      require_promptpay_id:
        body?.require_promptpay_id ??
        false,

      allow_multiple_accounts:
        body?.allow_multiple_accounts ??
        false,

      qr_supported:
        body?.qr_supported ??
        false,

      api_supported:
        body?.api_supported ??
        false,

      sort_order:
        Number(
          body?.sort_order
        ) || 0,

      status:
        body?.status ||
        "active",
    };

    /* ===========================
       Validation
    =========================== */

    if (
      !payload.payment_method_code
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสวิธีการจ่ายเงิน",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !payload.payment_method_name
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกชื่อวิธีการจ่ายเงิน",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Load Old Data
    =========================== */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("payment_methods")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบวิธีการจ่ายเงิน",
        },
        {
          status: 404,
        }
      );
    }

    /* ===========================
       Duplicate Code
    =========================== */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("payment_methods")
      .select("id")
      .eq(
        "payment_method_code",
        payload.payment_method_code
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัสวิธีการจ่ายเงินนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    /* ===========================
       Duplicate Name
    =========================== */

    const {data: duplicateName,} = await supabaseAdmin
      .from("payment_methods")
      .select("id")
      .eq(
        "payment_method_name",
        payload.payment_method_name
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ชื่อวิธีการจ่ายเงินนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }
       
    const {data,error,} = await supabaseAdmin
      .from("payment_methods")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    /* ===========================
       Activity Log
    =========================== */

    await writeActivityLog({
      module_name:"Payment Methods",
      action_type:"UPDATE",
      reference_table:"payment_methods",
      reference_id:id,
      description: `แก้ไขวิธีการจ่ายเงิน ${data.payment_method_name}`,
      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,

      message:
        "แก้ไขวิธีการจ่ายเงินเรียบร้อยแล้ว",

      data,
    });
  } catch (error) {
    console.error(
      "PATCH Payment Method Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "Failed to update payment method.",
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
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("payment_methods")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) {
      throw oldError;
    }

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบวิธีการจ่ายเงิน",
        },
        {
          status: 404,
        }
      );
    }

    /* ===========================
       Delete
    =========================== */

    const { error } =
      await supabaseAdmin
        .from("payment_methods")
        .delete()
        .eq("id", id);
    if (error) {
      if (
        error.code === "23503"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "ไม่สามารถลบข้อมูลได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
          },
          {
            status: 400,
          }
        );
      }
      throw error;
    }

    /* ===========================
       Activity Log
    =========================== */

    await writeActivityLog({
      module_name:"Payment Methods",
      action_type:"DELETE",
      reference_table:"payment_methods",
      reference_id:id,
      description: `ลบวิธีการจ่ายเงิน ${oldData.payment_method_name}`,
      old_data: oldData,
      new_data: null,
    });

    return NextResponse.json({
      success: true,
      message:"ลบวิธีการจ่ายเงินเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error(
      "DELETE Payment Method Error:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||"Failed to delete payment method.",
      },
      {
        status: 500,
      }
    );
  }
}

