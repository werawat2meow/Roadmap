import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const payrollCompanySelect = `
  id,
  payroll_company_code,
  payroll_company_name,
  company_id,
  tax_id,
  social_security_no,
  address,
  phone,
  email,
  status,
  sort_order,
  created_at,
  updated_at,
  companies (
    company_code,
    company_name_th,
    company_name_en
  )
`;

function mapPayrollCompany(item) {
  return {
    id: item.id,
    payroll_company_code: item.payroll_company_code,
    payroll_company_name: item.payroll_company_name,
    company_id: item.company_id || "",
    company_code: item.companies?.company_code || "",
    company_name: item.companies?.company_name || "-",
    tax_id: item.tax_id || "",
    social_security_no: item.social_security_no || "",
    address: item.address || "",
    phone: item.phone || "",
    email: item.email || "",
    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payroll_company_code = body?.payroll_company_code
      ?.trim()
      ?.toUpperCase();

    const payroll_company_name = body?.payroll_company_name?.trim();

    const company_id = body?.company_id || null;
    const tax_id = body?.tax_id?.trim() || null;
    const social_security_no = body?.social_security_no?.trim() || null;
    const address = body?.address?.trim() || null;
    const phone = body?.phone?.trim() || null;
    const email = body?.email?.trim() || null;
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);

    if (!payroll_company_code || !payroll_company_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสและชื่อ Payroll Company",
        },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอก Email ให้ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("payroll_companies")
      .select("id")
      .eq("payroll_company_code", payroll_company_code)
      .neq("id", id)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "รหัส Payroll Company นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("payroll_companies")
      .select(payrollCompanySelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const payload = {
      payroll_company_code,
      payroll_company_name,
      company_id,
      tax_id,
      social_security_no,
      address,
      phone,
      email,
      status,
      sort_order,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("payroll_companies")
      .update(payload)
      .eq("id", id)
      .select(payrollCompanySelect)
      .single();

    if (error) throw error;

    const mappedOldData = mapPayrollCompany(oldData);
    const mappedData = mapPayrollCompany(data);

    await writeActivityLog({
      module_name: "payroll_companies",
      action_type: "update",
      reference_table: "payroll_companies",
      reference_id: data.id,
      description: `แก้ไข Payroll Company ${data.payroll_company_code} - ${data.payroll_company_name}`,
      old_data: mappedOldData,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "อัพเดท Payroll Company สำเร็จ",
      data: mappedData,
    });
  } catch (error) {
    console.error("UPDATE_PAYROLL_COMPANY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถแก้ไข Payroll Company ได้",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { data: oldData, error: oldError } = await supabaseAdmin
      .from("payroll_companies")
      .select(payrollCompanySelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const { count, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("payroll_company_id", id);

    if (employeeError) throw employeeError;

    if (count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `ไม่สามารถลบได้ เนื่องจากมีพนักงานใช้งานอยู่ ${count} คน`,
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("payroll_companies")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name: "payroll_companies",
      action_type: "delete",
      reference_table: "payroll_companies",
      reference_id: oldData.id,
      description: `ลบ Payroll Company ${oldData.payroll_company_code} - ${oldData.payroll_company_name}`,
      old_data: mapPayrollCompany(oldData),
    });

    return NextResponse.json({
      success: true,
      message: "ลบ Payroll Company สำเร็จ",
    });
  } catch (error) {
    console.error("DELETE_PAYROLL_COMPANY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถลบ Payroll Company ได้",
      },
      { status: 500 }
    );
  }
}