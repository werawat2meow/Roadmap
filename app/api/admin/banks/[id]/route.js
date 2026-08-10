import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* ==========================================
   GET : Bank Detail
========================================== */

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("banks")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลธนาคาร",
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
    console.error("GET Bank Error:", error);

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

/* ==========================================
   PATCH : Update Bank
========================================== */

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    const body = await req.json();

    const payload = {
      bank_code: body.bank_code?.trim().toUpperCase(),
      bank_short_name: body.bank_short_name?.trim(),
      bank_name_th: body.bank_name_th?.trim(),
      bank_name_en: body.bank_name_en?.trim(),
      swift_code: body.swift_code?.trim().toUpperCase() || null,

      bank_logo_url: body.bank_logo_url || null,
      bank_logo_path: body.bank_logo_path || null,

      promptpay_supported:
        body.promptpay_supported ?? true,

      bank_file_format:
        body.bank_file_format || "txt",

      bank_transfer_type:
        body.bank_transfer_type || "batch",

      account_number_length:
        body.account_number_length || null,

      branch_code_required:
        body.branch_code_required ?? false,

      supports_bulk_transfer:
        body.supports_bulk_transfer ?? true,

      supports_api:
        body.supports_api ?? false,

      supports_payroll:
        body.supports_payroll ?? true,

      supports_promptpay_qr:
        body.supports_promptpay_qr ?? false,

      api_endpoint:
        body.api_endpoint?.trim() || null,

      api_version:
        body.api_version?.trim() || null,

      remarks:
        body.remarks?.trim() || null,

      sort_order:
        Number(body.sort_order) || 0,

      status:
        body.status || "active",
    };

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("banks")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลธนาคาร",
        },
        {
          status: 404,
        }
      );
    }

    if (!payload.bank_code) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสธนาคาร",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.bank_short_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อย่อธนาคาร",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.bank_name_th) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อธนาคารภาษาไทย",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.bank_name_en) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกชื่อธนาคารภาษาอังกฤษ",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("banks")
      .select("id")
      .eq("bank_code", payload.bank_code)
      .neq("id", id)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสธนาคารนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: duplicateShort,
    } = await supabaseAdmin
      .from("banks")
      .select("id")
      .eq(
        "bank_short_name",
        payload.bank_short_name
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateShort) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อย่อธนาคารนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: duplicateThai,
    } = await supabaseAdmin
      .from("banks")
      .select("id")
      .eq(
        "bank_name_th",
        payload.bank_name_th
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateThai) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อธนาคารนี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    if (payload.swift_code) {
      const {
        data: duplicateSwift,
      } = await supabaseAdmin
        .from("banks")
        .select("id")
        .eq(
          "swift_code",
          payload.swift_code
        )
        .neq("id", id)
        .maybeSingle();

      if (duplicateSwift) {
        return NextResponse.json(
          {
            success: false,
            error: "SWIFT Code นี้มีอยู่แล้ว",
          },
          {
            status: 400,
          }
        );
      }
    }

        const { data, error } = await supabaseAdmin
      .from("banks")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "Banks",
      action_type: "UPDATE",
      reference_table: "banks",
      reference_id: data.id,
      description: `แก้ไขธนาคาร ${data.bank_code} ${data.bank_name_th}`,
      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      data,
      message: "บันทึกข้อมูลเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("PATCH Bank Error:", error);

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

/* ==========================================
   DELETE : Delete Bank
========================================== */

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("banks")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบข้อมูลธนาคาร",
        },
        {
          status: 404,
        }
      );
    }

    const { error } = await supabaseAdmin
      .from("banks")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            error: "ไม่สามารถลบธนาคารนี้ได้ เนื่องจากมีข้อมูลอ้างอิงอยู่",
          },
          {
            status: 400,
          }
        );
      }

      throw error;
    }

    await writeActivityLog({
      module_name: "Banks",
      action_type: "DELETE",
      reference_table: "banks",
      reference_id: oldData.id,
      description: `ลบธนาคาร ${oldData.bank_code} ${oldData.bank_name_th}`,
      old_data: oldData,
      new_data: null,
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE Bank Error:", error);

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