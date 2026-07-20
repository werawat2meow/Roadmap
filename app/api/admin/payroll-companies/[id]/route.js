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
    description,
    default_payment_day,
    payment_frequency,
    status
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

    payroll_type_description:
      item.payroll_types?.description || "",

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

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payroll_company_code =
      body?.payroll_company_code
        ?.trim()
        ?.toUpperCase();

    const payroll_company_name =
      body?.payroll_company_name?.trim();

    const company_id =
      body?.company_id || null;

    const social_security_no =
      body?.social_security_no?.trim() || null;

    const payroll_type_id =
      body?.payroll_type_id || null;

    const rawPaymentDay = body?.payment_day;

    const status =
      body?.status || "active";

    const sort_order =
      Number(body?.sort_order || 0);

    if (
      !payroll_company_code ||
      !payroll_company_name
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณากรอกรหัสและชื่อ Payroll Company",
        },
        { status: 400 }
      );
    }

    if (!company_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือก Company Master",
        },
        { status: 400 }
      );
    }

    if (!payroll_type_id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "กรุณาเลือกประเภท Payroll",
        },
        { status: 400 }
      );
    }

    if (
      !["active", "inactive"].includes(status)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "สถานะไม่ถูกต้อง",
        },
        { status: 400 }
      );
    }

    const {
      data: company,
      error: companyError,
    } = await supabaseAdmin
      .from("companies")
      .select("id")
      .eq("id", company_id)
      .maybeSingle();

    if (companyError) throw companyError;

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบ Company Master ที่เลือก",
        },
        { status: 400 }
      );
    }

    const {
      data: payrollType,
      error: payrollTypeError,
    } = await supabaseAdmin
      .from("payroll_types")
      .select(`
        id,
        payroll_type_code,
        default_payment_day,
        payment_frequency,
        status
      `)
      .eq("id", payroll_type_id)
      .maybeSingle();

    if (payrollTypeError) {
      throw payrollTypeError;
    }

    if (!payrollType) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ไม่พบประเภท Payroll ที่เลือก",
        },
        { status: 400 }
      );
    }

    if (payrollType.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error:
            "ประเภท Payroll ที่เลือกถูกปิดใช้งาน",
        },
        { status: 400 }
      );
    }

    const payment_day =
      rawPaymentDay === "" ||
      rawPaymentDay === null ||
      rawPaymentDay === undefined
        ? payrollType.default_payment_day
        : Number(rawPaymentDay);

    if (
      payment_day !== null &&
      payment_day !== undefined &&
      (
        !Number.isInteger(payment_day) ||
        payment_day < 1 ||
        payment_day > 31
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "วันที่จ่ายเงินเดือนต้องอยู่ระหว่างวันที่ 1 ถึง 31",
        },
        { status: 400 }
      );
    }

    const {
      data: existing,
      error: existingError,
    } = await supabaseAdmin
      .from("payroll_companies")
      .select("id")
      .eq(
        "payroll_company_code",
        payroll_company_code
      )
      .neq("id", id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error:
            "รหัส Payroll Company นี้มีอยู่แล้ว",
        },
        { status: 400 }
      );
    }

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("payroll_companies")
      .select(payrollCompanySelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const payload = {
      payroll_company_code,
      payroll_company_name,
      company_id,
      social_security_no,
      payroll_type_id,
      payment_day:
        payment_day === undefined
          ? null
          : payment_day,
      status,
      sort_order,
      updated_at:
        new Date().toISOString(),
    };

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("payroll_companies")
      .update(payload)
      .eq("id", id)
      .select(payrollCompanySelect)
      .single();

    if (error) throw error;

    const mappedOldData =
      mapPayrollCompany(oldData);

    const mappedData =
      mapPayrollCompany(data);

    await writeActivityLog({
      module_name:
        "payroll_companies",
      action_type:
        "update",
      reference_table:
        "payroll_companies",
      reference_id:
        data.id,
      description:
        `แก้ไข Payroll Company ${data.payroll_company_code} - ${data.payroll_company_name}`,
      old_data:
        mappedOldData,
      new_data:
        mappedData,
    });

    return NextResponse.json({
      success: true,
      message:
        "อัปเดต Payroll Company สำเร็จ",
      data:
        mappedData,
    });
  } catch (error) {
    console.error(
      "UPDATE_PAYROLL_COMPANY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถแก้ไข Payroll Company ได้",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const {
      data: oldData,
      error: oldError,
    } = await supabaseAdmin
      .from("payroll_companies")
      .select(payrollCompanySelect)
      .eq("id", id)
      .single();

    if (oldError) throw oldError;

    const {
      count,
      error: employeeError,
    } = await supabaseAdmin
      .from("employees")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("payroll_company_id", id);

    if (employeeError) {
      throw employeeError;
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            `ไม่สามารถลบได้ เนื่องจากมีพนักงานใช้งานอยู่ ${
              count || 0
            } คน`,
        },
        { status: 400 }
      );
    }

    const { error } =
      await supabaseAdmin
        .from("payroll_companies")
        .delete()
        .eq("id", id);

    if (error) throw error;

    await writeActivityLog({
      module_name:
        "payroll_companies",
      action_type:
        "delete",
      reference_table:
        "payroll_companies",
      reference_id:
        oldData.id,
      description:
        `ลบ Payroll Company ${oldData.payroll_company_code} - ${oldData.payroll_company_name}`,
      old_data:
        mapPayrollCompany(oldData),
    });

    return NextResponse.json({
      success: true,
      message:
        "ลบ Payroll Company สำเร็จ",
    });
  } catch (error) {
    console.error(
      "DELETE_PAYROLL_COMPANY_ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "ไม่สามารถลบ Payroll Company ได้",
      },
      { status: 500 }
    );
  }
}