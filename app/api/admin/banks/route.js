import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { writeActivityLog } from "@/lib/activityLogger";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";

    const status = searchParams.get("status") || "";

    const supportsPayroll =
      searchParams.get("supports_payroll") || "";

    const promptpaySupported =
      searchParams.get("promptpay_supported") || "";

    const all =
      searchParams.get("all") === "true";

    const page = Math.max(
      1,
      Number(searchParams.get("page")) || 1
    );

    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize")) || 20
    );

    /* ==========================================
       Base Query
    ========================================== */

    let query = supabaseAdmin
      .from("banks")
      .select("*", {
        count: "exact",
      });

    /* ==========================================
       Search
    ========================================== */

    if (search) {
      query = query.or(
        [
          `bank_code.ilike.%${search}%`,
          `bank_short_name.ilike.%${search}%`,
          `bank_name_th.ilike.%${search}%`,
          `bank_name_en.ilike.%${search}%`,
          `swift_code.ilike.%${search}%`,
        ].join(",")
      );
    }

    /* ==========================================
       Filters
    ========================================== */

    if (status) {
      query = query.eq("status", status);
    }

    if (supportsPayroll !== "") {
      query = query.eq(
        "supports_payroll",
        supportsPayroll === "true"
      );
    }

    if (promptpaySupported !== "") {
      query = query.eq(
        "promptpay_supported",
        promptpaySupported === "true"
      );
    }

    /* ==========================================
       Sort
    ========================================== */

    query = query
      .order("sort_order", {
        ascending: true,
      })
      .order("bank_code", {
        ascending: true,
      });

    /* ==========================================
       All
    ========================================== */

    if (all) {
      const { data, error } = await query;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
      });
    }

    /* ==========================================
       Pagination
    ========================================== */

    const from =
      (page - 1) * pageSize;

    const to =
      from + pageSize - 1;

    const {
      data,
      error,
      count,
    } = await query.range(from, to);

    if (error) throw error;
    const summaryQuery=supabaseAdmin.from("banks").select("id,status,supports_payroll,promptpay_supported");
const{data:summaryData,error:summaryError}=await summaryQuery;
if(summaryError)throw summaryError;
const summary={
total:summaryData?.length||0,
active:summaryData?.filter(x=>x.status==="active").length||0,
inactive:summaryData?.filter(x=>x.status==="inactive").length||0,
payroll:summaryData?.filter(x=>x.supports_payroll).length||0,
promptpay:summaryData?.filter(x=>x.promptpay_supported).length||0,
};
return NextResponse.json({
success:true,
data,
summary,
pagination:{
page,
pageSize,
total:count||0,
totalPages:Math.ceil((count||0)/pageSize),
},
});
}catch(error){
console.error("GET Banks Error:",error);
return NextResponse.json({
success:false,
error:error.message,
},{status:500});
}
}

export async function POST(req){
  try{
  const body=await req.json();
  const payload={
  bank_code:body.bank_code?.trim().toUpperCase(),
  bank_short_name:body.bank_short_name?.trim(),
  bank_name_th:body.bank_name_th?.trim(),
  bank_name_en:body.bank_name_en?.trim(),
  swift_code:body.swift_code?.trim().toUpperCase()||null,
  bank_logo_url:body.bank_logo_url||null,
  bank_logo_path:body.bank_logo_path||null,
  promptpay_supported:body.promptpay_supported??true,
  bank_file_format:body.bank_file_format||"txt",
  bank_transfer_type:body.bank_transfer_type||"batch",
  account_number_length:body.account_number_length||null,
  branch_code_required:body.branch_code_required??false,
  supports_bulk_transfer:body.supports_bulk_transfer??true,
  supports_api:body.supports_api??false,
  supports_payroll:body.supports_payroll??true,
  supports_promptpay_qr:body.supports_promptpay_qr??false,
  api_endpoint:body.api_endpoint?.trim()||null,
  api_version:body.api_version?.trim()||null,
  remarks:body.remarks?.trim()||null,
  sort_order:Number(body.sort_order)||0,
  status:body.status||"active",
  };

  if(!payload.bank_code){
  return NextResponse.json({success:false,error:"กรุณากรอกรหัสธนาคาร"},{status:400});
  }
  if(!payload.bank_short_name){
  return NextResponse.json({success:false,error:"กรุณากรอกชื่อย่อธนาคาร"},{status:400});
  }
  if(!payload.bank_name_th){
  return NextResponse.json({success:false,error:"กรุณากรอกชื่อธนาคารภาษาไทย"},{status:400});
  }
  if(!payload.bank_name_en){
  return NextResponse.json({success:false,error:"กรุณากรอกชื่อธนาคารภาษาอังกฤษ"},{status:400});
  }

  const{data:duplicateCode}=await supabaseAdmin.from("banks").select("id").eq("bank_code",payload.bank_code).maybeSingle();

  if(duplicateCode){
  return NextResponse.json({
  success:false,
  error:"รหัสธนาคารนี้มีอยู่แล้ว",
  },{status:400});
  }

  const{data:duplicateShort}=await supabaseAdmin.from("banks").select("id").eq("bank_short_name",payload.bank_short_name).maybeSingle();

  if(duplicateShort){
  return NextResponse.json({
  success:false,
  error:"ชื่อย่อธนาคารนี้มีอยู่แล้ว",
  },{status:400});
  }

  const{data:duplicateThai}=await supabaseAdmin.from("banks").select("id").eq("bank_name_th",payload.bank_name_th).maybeSingle();

  if(duplicateThai){
  return NextResponse.json({
  success:false,
  error:"ชื่อธนาคารภาษาไทยนี้มีอยู่แล้ว",
  },{status:400});
  }

  if(payload.swift_code){
    const{data:duplicateSwift}=await supabaseAdmin.from("banks").select("id").eq("swift_code",payload.swift_code).maybeSingle();
      if(duplicateSwift){
        return NextResponse.json({
        success:false,
        error:"SWIFT Code นี้มีอยู่แล้ว",
      },{status:400});
    }
  }

  const{data,error}=await supabaseAdmin.from("banks").insert(payload).select().single();

  if(error)throw error;

  await writeActivityLog({
    module_name:"Banks",
    action_type:"CREATE",
    reference_table:"banks",
    reference_id:data.id,
    description:`สร้างธนาคาร ${data.bank_code} ${data.bank_name_th}`,
    old_data:null,
    new_data:data,
  });

  return NextResponse.json({
    success:true,
    data,
    message:"สร้างธนาคารเรียบร้อยแล้ว",
  });

  }catch(error){
      console.error("POST Banks Error:",error);
      return NextResponse.json({
        success:false,
        error:error.message,
    },{status:500});
  }
}