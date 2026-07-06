import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payload = {
      fiscal_year: Number(body?.fiscal_year),
      fiscal_name: body?.fiscal_name?.trim(),
      start_date: body?.start_date || null,
      end_date: body?.end_date || null,
      is_current: body?.is_current ?? false,
      is_closed: body?.is_closed ?? false,
      description: body?.description?.trim() || null,
      sort_order: Number(body?.sort_order || 1),
      is_active: body?.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    if (!payload.fiscal_year || !payload.fiscal_name) {
      return NextResponse.json(
        { success: false, error: "กรุณากรอก Fiscal Year และชื่อปีงบประมาณ" },
        { status: 400 }
      );
    }

    if (!payload.start_date || !payload.end_date) {
      return NextResponse.json(
        { success: false, error: "กรุณาเลือก Start Date และ End Date" },
        { status: 400 }
      );
    }

    if (payload.end_date < payload.start_date) {
      return NextResponse.json(
        { success: false, error: "End Date ต้องไม่น้อยกว่า Start Date" },
        { status: 400 }
      );
    }

    if (payload.is_current) {
      await supabaseAdmin
        .from("benefit_fiscal_years")
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .neq("id", id);
    }

    const { data, error } = await supabaseAdmin
      .from("benefit_fiscal_years")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "แก้ไข Fiscal Year สำเร็จ",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "แก้ไขข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: fiscalYear, error: findError } = await supabaseAdmin
      .from("benefit_fiscal_years")
      .select("id, is_closed, is_current")
      .eq("id", id)
      .single();

    if (findError) throw findError;

    if (fiscalYear?.is_current) {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถลบ Fiscal Year ที่เป็น Current ได้" },
        { status: 400 }
      );
    }

    if (fiscalYear?.is_closed) {
      return NextResponse.json(
        { success: false, error: "ไม่สามารถลบ Fiscal Year ที่ปิดปีแล้วได้" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("benefit_fiscal_years")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบ Fiscal Year สำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "ลบข้อมูลไม่สำเร็จ" },
      { status: 500 }
    );
  }
}