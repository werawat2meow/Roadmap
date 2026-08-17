import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import {
  ensureEmployeeAccessible,
  requireCompensationAccess,
} from "@/lib/compensation/compensationAccess";
import {
  cleanText,
  toNumber,
} from "@/lib/compensation/compensationService";

async function loadCompensation(id) {
  const { data, error } = await supabaseAdmin
    .from("employee_compensations")
    .select("id, employee_id, status")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function GET(req, { params }) {
  try {
    const guard = await requireCompensationAccess("view");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const compensation = await loadCompensation(id);

    if (!compensation) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Compensation" },
        { status: 404 }
      );
    }

    const access = await ensureEmployeeAccessible(
      guard,
      compensation.employee_id
    );
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("employee_compensation_components")
      .select("*, salary_component:salary_components(*)")
      .eq("employee_compensation_id", id)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error("GET compensation components error:", error);
    return NextResponse.json(
      { success: false, error: "ไม่สามารถโหลด Compensation Components ได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const guard = await requireCompensationAccess("edit");
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await req.json();
    const compensation = await loadCompensation(id);

    if (!compensation) {
      return NextResponse.json(
        { success: false, error: "ไม่พบ Compensation" },
        { status: 404 }
      );
    }

    const access = await ensureEmployeeAccessible(
      guard,
      compensation.employee_id
    );
    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    if (compensation.status !== "draft") {
      return NextResponse.json(
        {
          success: false,
          error:
            "แก้ Compensation Components ได้เฉพาะรายการ draft เท่านั้น หาก Active ให้สร้าง Salary Adjustment",
        },
        { status: 409 }
      );
    }

    const components = Array.isArray(body?.components)
      ? body.components
      : [];

    const rows = components
      .filter((item) => item?.salary_component_id)
      .map((item, index) => ({
        employee_compensation_id: id,
        salary_component_id: item.salary_component_id,
        calculation_type: cleanText(item.calculation_type) || "fixed",
        amount: toNumber(item.amount, 0),
        percentage: toNumber(item.percentage, null),
        status: cleanText(item.status) || "active",
        sort_order: Number(item.sort_order ?? index),
        remark: cleanText(item.remark),
      }));

    const { error: deleteError } = await supabaseAdmin
      .from("employee_compensation_components")
      .delete()
      .eq("employee_compensation_id", id);

    if (deleteError) throw deleteError;

    if (rows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("employee_compensation_components")
        .insert(rows);

      if (insertError) throw insertError;
    }

    const { data, error } = await supabaseAdmin
      .from("employee_compensation_components")
      .select("*, salary_component:salary_components(*)")
      .eq("employee_compensation_id", id)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "บันทึก Compensation Components เรียบร้อยแล้ว",
      data: data || [],
    });
  } catch (error) {
    console.error("PUT compensation components error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "ไม่สามารถบันทึก Compensation Components ได้",
      },
      { status: 500 }
    );
  }
}
