import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    console.log(id);    

    // 1. หาเจ้าของใบสมัคร
    const { data: applicant, error: applicantError } = await supabaseAdmin
      .from("recruit_job_applications")
      .select("first_name, last_name")
      .eq("id", id)
      .single();

    if (applicantError) {
      return NextResponse.json(
        { error: applicantError.message },
        { status: 404 }
      );
    }

    // 2. ดึงประวัติการสมัครทั้งหมด
    const { data: history, error: historyError } = await supabaseAdmin
      .from("recruit_job_applications")
      .select(`
        id,
        first_name,
        last_name,
        created_at,
        updated_at,
        status,
        position_id,
        positions (
          position_name
        )
      `)
      .eq("first_name", applicant.first_name)
      .eq("last_name", applicant.last_name)
      .order("created_at", { ascending: false });

    if (historyError) {
      return NextResponse.json(
        { error: historyError.message },
        { status: 500 }
      );
    }

    const candidate = {
      first_name: applicant.first_name,
      last_name: applicant.last_name,
      count_num: history.length,
    };

    const historyData = history.map((item) => ({
      id: item.id,
      created_at: item.created_at,
      status: item.status,
      display_status:
        item.created_at === item.updated_at
          ? "สมัครเข้ามาใหม่"
          : getStatusText(item.status),
    }));

    return NextResponse.json({
      candidate,
      history: historyData,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message ?? "Unexpected server error",
      },
      {
        status: 500,
      }
    );
  }
}

function getStatusText(status) {
  switch (status) {
    case 1:
      return "รอพิจารณา";
    case 2:
      return "ผ่านการคัดกรอง";
    case 3:
      return "นัดสัมภาษณ์";
    case 4:
      return "ผ่านสัมภาษณ์";
    case 5:
      return "ผ่านการอนุมัติ";
    case 6:
      return "ไม่ผ่าน";
    case 7:
      return "ยกเลิก";
    case 8:
      return "รับเข้าทำงาน";
    case 15:
      return "Resume";
    case 99:
      return "Archive";
    default:
      return "ไม่ทราบสถานะ";
  }
}