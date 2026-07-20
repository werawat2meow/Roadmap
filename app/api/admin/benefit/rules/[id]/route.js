import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload = {
      benefit_id: body?.benefit_id || null,
      policy_id: body?.policy_id || null,

      rule_code: body?.rule_code?.trim()?.toUpperCase(),
      rule_name: body?.rule_name?.trim(),
      rule_description: body?.rule_description?.trim() || null,

      company_id: body?.company_id || null,
      branch_id: body?.branch_id || null,
      department_id: body?.department_id || null,
      division_id: body?.division_id || null,
      unit_id: body?.unit_id || null,

      position_id: body?.position_id || null,
      position_level_min: body?.position_level_min || null,
      position_level_max: body?.position_level_max || null,

      employment_type_id: body?.employment_type_id || null,
      employee_status_id: body?.employee_status_id || null,

      gender: body?.gender || null,
      nationality: body?.nationality?.trim() || null,

      min_age:
        body?.min_age === "" || body?.min_age == null
          ? null
          : Number(body.min_age),

      max_age:
        body?.max_age === "" || body?.max_age == null
          ? null
          : Number(body.max_age),

      min_service_months: Number(body?.min_service_months || 0),

      max_service_months:
        body?.max_service_months === "" || body?.max_service_months == null
          ? null
          : Number(body.max_service_months),

      quota_amount: Number(body?.quota_amount || 0),
      quota_unit: body?.quota_unit?.trim() || "THB",
      quota_frequency: body?.quota_frequency?.trim() || "YEARLY",
      discount_percent: Number(body?.discount_percent || 0),

      is_unlimited: body?.is_unlimited ?? false,

      effective_from: body?.effective_from || null,
      effective_to: body?.effective_to || null,

      rule_year: body?.rule_year
        ? Number(body.rule_year)
        : new Date().getFullYear(),

      priority: Number(body?.priority || 1),

      is_active: body?.is_active ?? true,

      updated_at: new Date().toISOString(),
    };

    if (!payload.benefit_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Benefit",
        },
        {
          status: 400,
        }
      );
    }

    if (!payload.rule_code || !payload.rule_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Rule Code และ Rule Name",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payload.max_service_months !== null &&
      payload.max_service_months < payload.min_service_months
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Max Service Months ต้องไม่น้อยกว่า Min Service Months",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payload.max_age !== null &&
      payload.min_age !== null &&
      payload.max_age < payload.min_age
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Max Age ต้องไม่น้อยกว่า Min Age",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payload.effective_from &&
      payload.effective_to &&
      payload.effective_to < payload.effective_from
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Effective To ต้องไม่น้อยกว่า Effective From",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_rules")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
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

    return NextResponse.json({
      success: true,
      message: "แก้ไข Eligibility Rule สำเร็จ",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "แก้ไขข้อมูลไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("benefit_rules")
      .delete()
      .eq("id", id);

    if (error) {
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

    return NextResponse.json({
      success: true,
      message: "ลบ Eligibility Rule สำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "ลบข้อมูลไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}