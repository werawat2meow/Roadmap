import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

/* =========================================================
   Helper
========================================================= */

function mapRow(item) {
  return {
    id: item.id,

    component_code: item.component_code,
    component_name: item.component_name,

    description:
      item.description || "",

    component_type:
      item.component_type,

    calculation_type:
      item.calculation_type,

    taxable:
      item.taxable,

    social_security:
      item.social_security,

    provident_fund:
      item.provident_fund,

    accounting_code:
      item.accounting_code || "",

    sort_order:
      item.sort_order,

    status:
      item.status,

    created_at:
      item.created_at,

    updated_at:
      item.updated_at,
  };
}

/* =========================================================
   GET BY ID
========================================================= */

export async function GET(
  req,
  { params }
) {
  try {
    const { id } = await params;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("salary_components")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบรายการเงินเดือน",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      data: mapRow(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message,
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

    const body = await req.json();

    /* ==========================
       Validation
    ========================== */

    if (!body.component_code?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุรหัสรายการเงินเดือน",
        },
        { status: 400 }
      );
    }

    if (!body.component_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุชื่อรายการเงินเดือน",
        },
        { status: 400 }
      );
    }

    if (!body.component_type) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกประเภทรายการ",
        },
        { status: 400 }
      );
    }

    if (!body.calculation_type) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกประเภทการคำนวณ",
        },
        { status: 400 }
      );
    }

    /* ==========================
       Old Data
    ========================== */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("salary_components")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบรายการเงินเดือน",
        },
        { status: 404 }
      );
    }

    /* ==========================
       Duplicate Code
    ========================== */

    const {
      data: duplicateCode,
    } = await supabaseAdmin
      .from("salary_components")
      .select("id")
      .eq(
        "component_code",
        body.component_code
          .trim()
          .toUpperCase()
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateCode) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัสรายการเงินเดือนนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ==========================
       Duplicate Name
    ========================== */

    const {
      data: duplicateName,
    } = await supabaseAdmin
      .from("salary_components")
      .select("id")
      .eq(
        "component_name",
        body.component_name.trim()
      )
      .neq("id", id)
      .maybeSingle();

    if (duplicateName) {
      return NextResponse.json(
        {
          success: false,
          error: "ชื่อรายการเงินเดือนนี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    /* ==========================
       Payload
    ========================== */

    const payload = {
      component_code:
        body.component_code
          .trim()
          .toUpperCase(),

      component_name:
        body.component_name.trim(),

      description:
        body.description?.trim() ||
        null,

      component_type:
        body.component_type,

      calculation_type:
        body.calculation_type,

      taxable:
        body.taxable ?? true,

      social_security:
        body.social_security ??
        false,

      provident_fund:
        body.provident_fund ??
        false,

      accounting_code:
        body.accounting_code?.trim() ||
        null,

      sort_order:
        Number(
          body.sort_order
        ) || 0,

      status:
        body.status || "active",

      updated_at:
        new Date().toISOString(),
    };

    /* ==========================
       Update
    ========================== */

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("salary_components")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    /* ==========================
       Activity Log
    ========================== */

    await writeActivityLog({
      module_name:
        "Salary Components",

      action_type:
        "UPDATE",

      reference_table:
        "salary_components",

      reference_id:
        data.id,

      description: `แก้ไขรายการเงินเดือน ${data.component_name}`,

      old_data: oldData,

      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message:
        "แก้ไขรายการเงินเดือนสำเร็จ",
      data: mapRow(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error.message,
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

export async function DELETE(
  req,
  { params }
) {
  try {
    const { id } = await params;

    /* ==========================
       Get Old Data
    ========================== */

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("salary_components")
      .select("*")
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    if (!oldData) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบรายการเงินเดือน",
        },
        {
          status: 404,
        }
      );
    }

    /* ==========================
       Delete
    ========================== */

    const { error } =
      await supabaseAdmin
        .from("salary_components")
        .delete()
        .eq("id", id);

    if (error) {
      // Foreign Key หรือ Constraint Error
      if (error.code === "23503") {
        return NextResponse.json(
          {
            success: false,
            error:
              "ไม่สามารถลบรายการนี้ได้ เนื่องจากมีข้อมูลอ้างอิงอยู่ในระบบ",
          },
          {
            status: 400,
          }
        );
      }

      throw error;
    }

    /* ==========================
       Activity Log
    ========================== */

    await writeActivityLog({
      module_name:
        "Salary Components",

      action_type: "DELETE",

      reference_table:
        "salary_components",

      reference_id: id,

      description: `ลบรายการเงินเดือน ${oldData.component_name}`,

      old_data: oldData,
    });

    return NextResponse.json({
      success: true,
      message:
        "ลบรายการเงินเดือนสำเร็จ",
    });
  } catch (error) {
    console.error(error);

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
