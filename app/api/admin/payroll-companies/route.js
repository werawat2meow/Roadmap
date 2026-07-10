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
    company_name: item.companies?.company_name_th || item.companies?.company_name_en || "-",
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

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const { data, error } = await supabaseAdmin
      .from("payroll_companies")
      .select(payrollCompanySelect)
      .order("sort_order", { ascending: true })
      .order("payroll_company_code", {
        ascending: true,
      });

    if (error) throw error;

    const mappedData = (data || []).map(mapPayrollCompany);

    const filteredData = search
      ? mappedData.filter((item) => {
          return (
            item.payroll_company_code
              ?.toLowerCase()
              .includes(search) ||
            item.payroll_company_name
              ?.toLowerCase()
              .includes(search) ||
            item.company_name
              ?.toLowerCase()
              .includes(search) ||
            item.tax_id
              ?.toLowerCase()
              .includes(search)
          );
        })
      : mappedData;

    return NextResponse.json({
      success: true,
      data: filteredData,
    });
  } catch (error) {
    console.error(
      "GET_PAYROLL_COMPANIES_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถโหลด Payroll Company ได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const payroll_company_code = body?.payroll_company_code?.trim()?.toUpperCase();
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
    };

    const { data, error } = await supabaseAdmin
      .from("payroll_companies")
      .insert([payload])
      .select(payrollCompanySelect)
      .single();

    if (error) throw error;

    const mappedData = mapPayrollCompany(data);

    await writeActivityLog({
      module_name: "payroll_companies",
      action_type: "create",
      reference_table: "payroll_companies",
      reference_id: data.id,
      description: `เพิ่ม Payroll Company ${data.payroll_company_code} - ${data.payroll_company_name}`,
      new_data: mappedData,
    });

    return NextResponse.json({
      success: true,
      message: "เพิ่ม Payroll Company สำเร็จ",
      data: mappedData,
    });
  } catch (error) {
    console.error("CREATE_PAYROLL_COMPANY_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ไม่สามารถบันทึก Payroll Company ได้",
      },
      { status: 500 }
    );
  }
}