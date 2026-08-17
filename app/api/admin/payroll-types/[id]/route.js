import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const payrollTypeSelect = `
  id,
<<<<<<< HEAD

  payroll_type_code,
  payroll_type_name,

  description,

  default_payment_day,

  payment_frequency,

  status,

  sort_order,

=======
  payroll_type_code,
  payroll_type_name,
  description,
  default_payment_day,
  cutoff_end_day,
  payment_offset_month,
  payment_frequency,
  status,
  sort_order,
>>>>>>> test_merge_all
  created_at,
  updated_at
`;

function mapPayrollType(item) {
  return {
    id: item.id,
    payroll_type_code: item.payroll_type_code,
    payroll_type_name: item.payroll_type_name,
    description: item.description || "",
    default_payment_day: item.default_payment_day,
<<<<<<< HEAD
=======
    cutoff_end_day: item.cutoff_end_day,
    payment_offset_month:Number(item.payment_offset_month || 0),
>>>>>>> test_merge_all
    payment_frequency: item.payment_frequency,
    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

/* =====================================
   PATCH
===================================== */

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const payroll_type_code =
      body?.payroll_type_code
        ?.trim()
        ?.toUpperCase();

    const payroll_type_name = body?.payroll_type_name?.trim();
    const description = body?.description?.trim() || null;
<<<<<<< HEAD
    const default_payment_day =
      body?.default_payment_day === "" ||
      body?.default_payment_day === null
        ? null
        : Number(body.default_payment_day);

=======
    const default_payment_day = body?.default_payment_day === "" || body?.default_payment_day === null? null: Number(body.default_payment_day);
    const cutoff_end_day = body?.cutoff_end_day? Number(body.cutoff_end_day): null;
    const payment_offset_month = Number(body?.payment_offset_month || 0);
>>>>>>> test_merge_all
    const payment_frequency = body?.payment_frequency || "monthly";
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);

    if (
      !payroll_type_code ||
      !payroll_type_name
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสและชื่อ Payroll Type",
        },
        {
          status: 400,
        }
      );
    }

    if (
      default_payment_day !== null &&
      (
        default_payment_day < 1 ||
        default_payment_day > 31
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "วันที่จ่ายเงินต้องอยู่ระหว่าง 1-31",
        },
        {
          status: 400,
        }
      );
    }

<<<<<<< HEAD
=======

    if ( default_payment_day && (default_payment_day < 1 || default_payment_day > 31)) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment Day ต้องอยู่ระหว่าง 1 - 31",
        },
        { status: 400 }
      );
    }

    if (cutoff_end_day && (cutoff_end_day < 1 ||  cutoff_end_day > 31)) {
      return NextResponse.json(
        {
          success: false,
          error: "Cutoff End Day ต้องอยู่ระหว่าง 1 - 31",
        },
        { status: 400 }
      );
    }

    if (![0, 1].includes(payment_offset_month)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment Offset Month ต้องเป็น 0 หรือ 1",
        },
        { status: 400 }
      );
    }

>>>>>>> test_merge_all
    const { data: duplicate } =
      await supabaseAdmin
        .from("payroll_types")
        .select("id")
        .eq(
          "payroll_type_code",
          payroll_type_code
        )
        .neq("id", id)
        .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัส Payroll Type นี้มีอยู่แล้ว",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("payroll_types")
      .select(payrollTypeSelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const payload = {
      payroll_type_code,
      payroll_type_name,
      description,
      default_payment_day,
<<<<<<< HEAD
=======
      cutoff_end_day,
      payment_offset_month,
>>>>>>> test_merge_all
      payment_frequency,
      status,
      sort_order,
      updated_at:
        new Date().toISOString(),
    };

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("payroll_types")
      .update(payload)
      .eq("id", id)
      .select(payrollTypeSelect)
      .single();

    if (error) throw error;

    await writeActivityLog({
      module_name: "payroll_types",
      action_type: "update",
      reference_table: "payroll_types",
      reference_id: id,
      description: `แก้ไข Payroll Type ${data.payroll_type_code}`,
      old_data: mapPayrollType(oldData),
      new_data: mapPayrollType(data),
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไข Payroll Type สำเร็จ",
      data: mapPayrollType(data),
    });
  } catch (error) {
    console.error(
      "UPDATE_PAYROLL_TYPE_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message || "ไม่สามารถแก้ไข Payroll Type ได้",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================
   DELETE
===================================== */

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("payroll_types")
      .select(payrollTypeSelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    // เช็คว่าถูกใช้งานหรือไม่
    const {
      count,
      error: useError,
    } = await supabaseAdmin
      .from("payroll_companies")
      .select("id", {
        head: true,
        count: "exact",
      })
      .eq("payroll_type_id", id);

    if (useError) throw useError;

    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบได้ เนื่องจากมี Payroll Company ใช้งานอยู่ ${count} รายการ`,
        },
        {
          status: 400,
        }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("payroll_types")
        .delete()
        .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "payroll_types",
      action_type: "delete",
      reference_table: "payroll_types",
      reference_id: id,
      description: `ลบ Payroll Type ${oldData.payroll_type_code}`,
      old_data: mapPayrollType(oldData),
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Payroll Type สำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_PAYROLL_TYPE_ERROR",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบ Payroll Type ได้",
      },
      {
        status: 500,
      }
    );
  }
}