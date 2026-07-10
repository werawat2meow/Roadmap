import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const company_code = body?.company_code?.trim();
    const company_name_th = body?.company_name_th?.trim();
    const company_name_en = body?.company_name_en?.trim() || null;

    const tax_id = body?.tax_id?.trim() || null;
    const branch_no = body?.branch_no?.trim() || null;

    const address = body?.address?.trim() || null;

    const country_code = body?.country_code?.trim() || "TH";

    const province_code = body?.province_code?.trim() || null;
    const province = body?.province?.trim() || null;

    const district_code = body?.district_code?.trim() || null;
    const district = body?.district?.trim() || null;

    const subdistrict_code = body?.subdistrict_code?.trim() || null;
    const subdistrict = body?.subdistrict?.trim() || null;

    const postcode = body?.postcode?.trim() || null;

    const phone = body?.phone?.trim() || null;
    const email = body?.email?.trim() || null;
    const website = body?.website?.trim() || null;

    const logo_url = body?.logo_url?.trim() || null;
    const logo_path = body?.logo_path?.trim() || null;

    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);

    if (!company_code || !company_name_th) {
      return NextResponse.json(
        {
          error: "กรุณากรอกรหัสบริษัทและชื่อบริษัท",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // Old Data
    // =========================

    const { data: oldData } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    // =========================
    // Update
    // =========================

    const { data, error } = await supabaseAdmin
      .from("companies")
      .update({
        company_code,
        company_name_th,
        company_name_en,

        tax_id,
        branch_no,

        address,

        country_code,

        province_code,
        province,

        district_code,
        district,

        subdistrict_code,
        subdistrict,

        postcode,

        phone,
        email,
        website,

        logo_url,
        logo_path,

        status,
        sort_order,

        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        company_code,
        company_name_th,
        company_name_en,

        tax_id,
        branch_no,

        address,

        country_code,

        province_code,
        province,

        district_code,
        district,

        subdistrict_code,
        subdistrict,

        postcode,

        phone,
        email,
        website,

        logo_url,
        logo_path,

        status,
        sort_order,

        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error: "รหัสบริษัทนี้มีอยู่แล้ว",
          },
          {
            status: 400,
          }
        );
      }

      throw error;
    }

    // =========================
    // Activity Log
    // =========================

    await writeActivityLog({
      module_name: "companies",
      action_type: "update",
      reference_table: "companies",
      reference_id: data.id,
      description: `แก้ไขบริษัท ${data.company_code} - ${data.company_name_th}`,
      old_data: oldData,
      new_data: data,
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลบริษัทสำเร็จ",
      data,
    });

  } catch (error) {
    console.error("UPDATE_COMPANY_ERROR:", error);

    return NextResponse.json(
      {
        error: "ไม่สามารถแก้ไขข้อมูลบริษัทได้",
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

    // =========================
    // Check Branch
    // =========================

    const { data: usedBranches, error: checkError } = await supabaseAdmin
      .from("branches")
      .select("id")
      .eq("company_id", id)
      .limit(1);

    if (checkError) throw checkError;

    if (usedBranches?.length > 0) {
      return NextResponse.json(
        {
          error: "ไม่สามารถลบบริษัทได้ เพราะมีสาขาที่อ้างอิงบริษัทนี้อยู่",
        },
        {
          status: 400,
        }
      );
    }

    // =========================
    // Old Data
    // =========================

    const { data: oldData } = await supabaseAdmin
      .from("companies")
      .select("*")
      .eq("id", id)
      .single();

    // =========================
    // Delete
    // =========================

    const { error } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // =========================
    // Activity Log
    // =========================

    await writeActivityLog({
      module_name: "companies",
      action_type: "delete",
      reference_table: "companies",
      reference_id: id,
      description: `ลบบริษัท ${oldData?.company_code} - ${oldData?.company_name_th}`,
      old_data: oldData,
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลบริษัทสำเร็จ",
    });

  } catch (error) {
    console.error("DELETE_COMPANY_ERROR:", error);

    return NextResponse.json(
      {
        error: "ไม่สามารถลบข้อมูลบริษัทได้",
      },
      {
        status: 500,
      }
    );
  }
}