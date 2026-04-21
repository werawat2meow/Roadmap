import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const company_code = body?.company_code?.trim();
    const company_name_th = body?.company_name_th?.trim();
    const company_name_en = body?.company_name_en?.trim() || null;
    const tax_id = body?.tax_id?.trim() || null;
    const phone = body?.phone?.trim() || null;
    const email = body?.email?.trim() || null;
    const status = body?.status || "active";

    if (!company_code || !company_name_th) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสบริษัทและชื่อบริษัท" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("companies")
      .update({
        company_code,
        company_name_th,
        company_name_en,
        tax_id,
        phone,
        email,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        company_code,
        company_name_th,
        company_name_en,
        tax_id,
        phone,
        email,
        status,
        sort_order,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "รหัสบริษัทนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลบริษัทสำเร็จ",
      data,
    });
  } catch (error) {
    console.error("UPDATE_COMPANY_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถแก้ไขข้อมูลบริษัทได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: usedBranches, error: checkError } = await supabaseAdmin
      .from("branches")
      .select("id")
      .eq("company_id", id)
      .limit(1);

    if (checkError) throw checkError;

    if (usedBranches && usedBranches.length > 0) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบริษัทได้ เพราะมีสังกัดที่อ้างอิงบริษัทนี้อยู่" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลบริษัทสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_COMPANY_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถลบข้อมูลบริษัทได้" },
      { status: 500 }
    );
  }
}