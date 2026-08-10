import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      application_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      position_level_id,
      start_date,
      base_salary,
      position_allowance,
      living_allowance,
      special_allowance,
      fuel_allowance,
      incentive_type,
      incentive_amount,
      oc,
      phone_allowance,
      employment_type_id,
      role_id,
    } = body;   

    if (!application_id) {
      return NextResponse.json(
        { message: "ไม่พบ Application ID", },
        { status: 400, }
      );
    }

    if (!branch_id) {
      return NextResponse.json(
        { message: "กรุณาเลือก Branch", },
        { status: 400, }
      );
    }

    if (!department_id) {
      return NextResponse.json(
        { message: "กรุณาเลือก Department", },
        { status: 400, }
      );
    }

    if (!division_id) {
      return NextResponse.json(
        { message: "กรุณาเลือก Division", },
        { status: 400, }
      );
    }

    if (!unit_id) {
      return NextResponse.json(
        { message: "กรุณาเลือก Unit", },
        { status: 400, }
      );
    }

    if (!position_id) {
      return NextResponse.json(
        { message: "กรุณาเลือก Position", },
        { status: 400, }
      );
    }

    if (!position_level_id) {
      return NextResponse.json(
        { message: "กรุณาเลือก Position Level", },
        { status: 400, }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { message: "กรุณาระบุวันที่เริ่มงาน", },
        { status: 400, }
      );
    }

    if (!employment_type_id) {
      return NextResponse.json(
        { message: "กรุณาเลือกประเภทการจ้างงาน", },
        { status: 400, }
      );
    }

    const { get_data_emp_recrut, get_data_emp_recrut_error } = await supabaseAdmin
        .from("recruit_job_applications")
        .select(`*`)
        .eq("id", application_id)
        .single();

    console.log(get_data_emp_recrut);    

    const insertData = {
      application_id,
      branch_id,
      department_id,
      division_id,
      unit_id,
      position_id,
      position_level_id,
      start_date,
      base_salary: Number(base_salary || 0),
      position_allowance: Number(position_allowance || 0),
      living_allowance: Number(living_allowance || 0),
      special_allowance: Number(special_allowance || 0),
      fuel_allowance: Number(fuel_allowance || 0),
      incentive_type: incentive_type || null,
      incentive_amount: Number(incentive_amount || 0),
      oc: oc || null,
      phone_allowance: Number(phone_allowance || 0),
      employment_type_id,
      role_id: role_id || null,
    };

    

    // const { data, error } = await supabaseAdmin
    //   .from("employee")
    //   .insert(insertData)
    //   .select()
    //   .single();

    // if (error) {
    //   console.error("SUPABASE INSERT ERROR:", error);

    //   return NextResponse.json(
    //     { message: error.message,},
    //     { status: 500, }
    //   );
    // }

    return NextResponse.json(
      {
        success: true,
        message: "บันทึกข้อมูลเรียบร้อยแล้ว",
        // data,
      },
      { status: 201,}
    );
  } catch (error) {
    console.error("SAVE EMPLOYEE ERROR:", error);

    return NextResponse.json(
      { message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล", },
      { status: 500, }
    );
  }
}