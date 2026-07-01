import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const branch_code = body?.branch_code?.trim();
    const branch_name = body?.branch_name?.trim();
    const company_id = body?.company_id || null;
    const phone = body?.phone?.trim() || null;
    const status = body?.status || "active";
    const branch_image_url = body?.branch_image_url || null;
    const branch_image_path = body?.branch_image_path || null;

    if (!branch_code || !branch_name) {
      return NextResponse.json(
        { error: "กรุณากรอกรหัสสังกัดและชื่อสังกัด" },
        { status: 400 }
      );
    }

    if (!company_id) {
      return NextResponse.json(
        { error: "กรุณาเลือกบริษัท" },
        { status: 400 }
      );
    }

    const { data: oldBranch, error: oldBranchError } = await supabaseAdmin
      .from("branches")
      .select(`
        id,
        branch_code,
        branch_name,
        company_id,
        phone,
        status,
        branch_image_url,
        branch_image_path,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .eq("id", id)
      .single();

    if (oldBranchError) throw oldBranchError;

    const { data, error } = await supabaseAdmin
      .from("branches")
      .update({
        branch_code,
        branch_name,
        company_id,
        phone,
        status,
        branch_image_url,
        branch_image_path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        id,
        branch_code,
        branch_name,
        company_id,
        phone,
        status,
        sort_order,
        branch_image_url,
        branch_image_path,
        created_at,
        updated_at,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "รหัสสังกัดนี้มีอยู่แล้ว" },
          { status: 400 }
        );
      }

      throw error;
    }

    await writeActivityLog({
      module_name: "branches",
      action_type: "update",
      reference_table: "branches",
      reference_id: data.id,
      description: `แก้ไขสังกัด ${data.branch_code} - ${data.branch_name}`,
      old_data: {
        branch_code: oldBranch.branch_code,
        branch_name: oldBranch.branch_name,
        company_id: oldBranch.company_id,
        company_code: oldBranch.companies?.company_code || "",
        branch_image_url: oldBranch.branch_image_url,
        branch_image_path: oldBranch.branch_image_path,
        company_name:
          oldBranch.companies?.company_name_th ||
          oldBranch.companies?.company_name_en ||
          "",
        phone: oldBranch.phone,
        status: oldBranch.status,
      },
      new_data: {
        branch_code: data.branch_code,
        branch_name: data.branch_name,
        company_id: data.company_id,
        company_code: data.companies?.company_code || "",
        branch_image_url: data.branch_image_url,
        branch_image_path: data.branch_image_path,
        company_name:
          data.companies?.company_name_th ||
          data.companies?.company_name_en ||
          "",
        phone: data.phone,
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขข้อมูลสังกัดสำเร็จ",
      data: {
        id: data.id,
        branch_code: data.branch_code,
        branch_name: data.branch_name,
        company_id: data.company_id,
        company_name:
          data.companies?.company_name_th ||
          data.companies?.company_name_en ||
          "-",
        company_code: data.companies?.company_code || "",
        phone: data.phone,
        status: data.status,
        sort_order: data.sort_order,
        branch_image_url: data.branch_image_url || "",
        branch_image_path: data.branch_image_path || "",
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });
  } catch (error) {
    console.error("UPDATE_BRANCH_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถแก้ไขข้อมูลสังกัดได้" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("branches")
      .delete()
      .eq("id", id);

    
    const { data: oldBranch, error: oldBranchError } = await supabaseAdmin
      .from("branches")
      .select(`
        id,
        branch_code,
        branch_name,
        company_id,
        phone,
        status,
        companies (
          id,
          company_code,
          company_name_th,
          company_name_en
        )
      `)
      .eq("id", id)
      .single();

    if (oldBranchError) throw oldBranchError;

    if (error) throw error;


    await writeActivityLog({
      module_name: "branches",
      action_type: "delete",
      reference_table: "branches",
      reference_id: oldBranch.id,
      description: `ลบสังกัด ${oldBranch.branch_code} - ${oldBranch.branch_name}`,
      old_data: {
        branch_code: oldBranch.branch_code,
        branch_name: oldBranch.branch_name,
        company_id: oldBranch.company_id,
        company_code: oldBranch.companies?.company_code || "",
        company_name:
          oldBranch.companies?.company_name_th ||
          oldBranch.companies?.company_name_en ||
          "",
        phone: oldBranch.phone,
        status: oldBranch.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "ลบข้อมูลสังกัดสำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_BRANCH_ERROR:", error);

    return NextResponse.json(
      { error: "ไม่สามารถลบข้อมูลสังกัดได้" },
      { status: 500 }
    );
  }
}