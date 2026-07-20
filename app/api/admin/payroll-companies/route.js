import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const payrollCompanySelect = `
  id,

  payroll_company_code,
  payroll_company_name,

  company_id,

  social_security_no,

  payroll_type_id,
  payment_day,

  status,
  sort_order,

  created_at,
  updated_at,

  companies (
    id,
    company_code,
    company_name_th,
    company_name_en,
    tax_id,
    branch_no,
    address,
    province,
    district,
    subdistrict,
    postcode,
    phone,
    email,
    website
  ),

  payroll_types (
    id,
    payroll_type_code,
    payroll_type_name,
    payment_frequency,
    default_payment_day
  )
`;

function mapPayrollCompany(item) {
  return {
    id: item.id,

    payroll_company_code:
      item.payroll_company_code || "",

    payroll_company_name:
      item.payroll_company_name || "",

    company_id:
      item.company_id || "",

    company_code:
      item.companies?.company_code || "",

    company_name:
      item.companies?.company_name_th ||
      item.companies?.company_name_en ||
      "-",

    company_name_th:
      item.companies?.company_name_th || "",

    company_name_en:
      item.companies?.company_name_en || "",

    company_tax_id:
      item.companies?.tax_id || "",

    company_branch_no:
      item.companies?.branch_no || "",

    company_address:
      item.companies?.address || "",

    company_province:
      item.companies?.province || "",

    company_district:
      item.companies?.district || "",

    company_subdistrict:
      item.companies?.subdistrict || "",

    company_postcode:
      item.companies?.postcode || "",

    company_phone:
      item.companies?.phone || "",

    company_email:
      item.companies?.email || "",

    company_website:
      item.companies?.website || "",

    social_security_no:
      item.social_security_no || "",

    payroll_type_id:
      item.payroll_type_id || "",

    payroll_type_code:
      item.payroll_types?.payroll_type_code || "",

    payroll_type_name:
      item.payroll_types?.payroll_type_name || "",

    payment_frequency:
      item.payroll_types?.payment_frequency || "",

    default_payment_day:
      item.payroll_types?.default_payment_day === null ||
      item.payroll_types?.default_payment_day === undefined
        ? null
        : Number(item.payroll_types.default_payment_day),

    payment_day:
      item.payment_day === null ||
      item.payment_day === undefined
        ? null
        : Number(item.payment_day),

    status:
      item.status || "active",

    sort_order:
      Number(item.sort_order || 0),

    created_at:
      item.created_at,

    updated_at:
      item.updated_at,
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
            item.company_tax_id
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
    const social_security_no = body?.social_security_no?.trim() || null;
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0);
    const payroll_type_id = body?.payroll_type_id || null;
    const payment_day = body?.payment_day === "" || body?.payment_day === null || body?.payment_day === undefined ? payrollType.default_payment_day : Number(body.payment_day);

    if (!payroll_company_code || !payroll_company_name) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณากรอกรหัสและชื่อ Payroll Company",
        },
        { status: 400 }
      );
    }


    if ( payment_day !== null && ( !Number.isInteger(Number(payment_day)) || Number(payment_day) < 1 ||  Number(payment_day) > 31)) {
      return NextResponse.json(
        {
          success: false,
          error: "วันที่จ่ายเงินเดือนต้องอยู่ระหว่าง 1 ถึง 31",
        },
        { status: 400 }
      );
    }


    if (!company_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือก Company Master",
        },
        { status: 400 }
      );
    }

    if (!payroll_type_id) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเลือกประเภท Payroll",
        },
        { status: 400 }
      );
    }

    const { data: payrollType, error: payrollTypeError } =
      await supabaseAdmin
        .from("payroll_types")
        .select(`
          id,
          payment_frequency,
          default_payment_day,
          status
        `)
        .eq("id", payroll_type_id)
        .maybeSingle();

    if (payrollTypeError) throw payrollTypeError;

    if (!payrollType) {
      return NextResponse.json(
        {
          success: false,
          error: "ไม่พบประเภท Payroll ที่เลือก",
        },
        { status: 400 }
      );
    }

    if (payrollType.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "ประเภท Payroll ที่เลือกถูกปิดใช้งาน",
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
      social_security_no,
      payroll_type_id,
      payment_day,
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