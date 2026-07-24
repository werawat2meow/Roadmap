import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

const payrollTypeSelect = `
  id,
  payroll_type_code,
  payroll_type_name,
  description,
  default_payment_day,
  payment_frequency,
  status,
  sort_order,
  created_at,
  updated_at
`;

function mapPayrollType(item) {
  return {
    id: item.id,
    payroll_type_code: item.payroll_type_code,
    payroll_type_name: item.payroll_type_name,
    description: item.description || "",
    default_payment_day: item.default_payment_day,
    payment_frequency: item.payment_frequency,
    status: item.status || "active",
    sort_order: Number(item.sort_order || 0),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export async function GET(req) {
  try {

    const { searchParams } = new URL(req.url);

    const search =
      searchParams
        .get("search")
        ?.trim()
        ?.toLowerCase() || "";
    const status =
      searchParams
        .get("status")
        ?.trim();
    let query =
      supabaseAdmin
        .from("payroll_types")
        .select(payrollTypeSelect)
        .order("sort_order")
        .order("payroll_type_code");
    if (status) {
      query =
        query.eq(
          "status",
          status
        );
    }
    const {
      data,
      error,
    } = await query;
    if (error) throw error;
    let rows =
      (data || [])
      .map(mapPayrollType);

    if (search) {
      rows =
        rows.filter((item)=>
          item.payroll_type_code
            ?.toLowerCase()
            .includes(search)
          ||
          item.payroll_type_name
            ?.toLowerCase()
            .includes(search)
          ||
          item.description
            ?.toLowerCase()
            .includes(search)
        );
    }
    return NextResponse.json({
      success:true,
      data:rows,
    });

  } catch (error) {
    console.error(
      "GET_PAYROLL_TYPES_ERROR",
      error
    );

    return NextResponse.json({
      success:false,
      error:
        error.message ||
        "ไม่สามารถโหลด Payroll Type ได้",
    },{
      status:500,
    });

  }
}

export async function POST(req) {

  try {
    const body = await req.json();

    const payroll_type_code =
      body
        ?.payroll_type_code
        ?.trim()
        ?.toUpperCase();

    const payroll_type_name =
      body
        ?.payroll_type_name
        ?.trim();

    const description =
      body
        ?.description
        ?.trim() || null;

    const default_payment_day =
      body
        ?.default_payment_day
        ? Number(
            body.default_payment_day
          )
        : null;

    const payment_frequency = body ?.payment_frequency || "monthly";
    const status = body?.status || "active";
    const sort_order = Number(body?.sort_order || 0 );

    if(!payroll_type_code || !payroll_type_name){
      return NextResponse.json({
        success:false,
        error:
        "กรุณากรอกรหัสและชื่อ Payroll Type",
      },{
        status:400,
      });
    }

    const {data:exists,} =
      await supabaseAdmin
      .from("payroll_types")
      .select("id")
      .eq(
        "payroll_type_code",
        payroll_type_code
      )
      .maybeSingle();

    if(exists){
      return NextResponse.json({
        success:false,
        error:
        "รหัส Payroll Type นี้มีอยู่แล้ว",
      },{
        status:400,
      });
    }

    const payload={
      payroll_type_code,
      payroll_type_name,
      description,
      default_payment_day,
      payment_frequency,
      status,
      sort_order,
    };

    const {data,error,} =
      await supabaseAdmin
      .from("payroll_types")
      .insert(payload)
      .select(
        payrollTypeSelect
      )
      .single();
    if(error)
      throw error;

    const mapped = mapPayrollType(data);

    await writeActivityLog({
      module_name: "payroll_types",
      action_type: "create",
      reference_table: "payroll_types",
      reference_id: data.id,
      description: `เพิ่ม Payroll Type ${data.payroll_type_code}`,
      new_data:mapped,
    });

    return NextResponse.json({
      success:true,
      message: "เพิ่ม Payroll Type สำเร็จ",
      data:mapped,
    });
  } catch(error){
    console.error(
      "CREATE_PAYROLL_TYPE_ERROR",
      error
    );
    return NextResponse.json({
      success:false,
      error:
      error.message || "ไม่สามารถบันทึก Payroll Type ได้",
    },{
      status:500,
    });
  }
}