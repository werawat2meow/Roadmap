import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

const RECRUIT_STATUS = {
  1: "รอพิจารณา",
  2: "HRD ส่งต่อ HRM",
  3: "ผ่านการคัดเลือกเข้าสัมภาษณ์",
  4: "นัดสัมภาษณ์",
  5: "ยืนยันการสัมภาษณ์",
  6: "เลื่อนการสัมภาษณ์",
  7: "ขาดการสัมภาษณ์",
  8: "ส่งต่อการสัมภาษณ์",
  9: "ต้นสังกัดปล่อยให้ใช้ข้อมูลร่วมกัน",
  10: "ผ่านการคัดเลือก",
  11: "ไม่ผ่านการคัดเลือก",
  12: "นัดวันเริ่มทำงาน",
  13: "เลื่อนวันเริ่มทำงาน",
  14: "ไม่มาทำงานตามนัด",
  15: "อัพเดตเข้าฐานข้อมูลกลาง",
  16: "ฝาก resume",
  17: "รอเริ่มงาน",
  18: "รออัปเดตข้อมูล resume",
  19: "รอพิจารณาอีกครั้ง",
  0: "ยกเลิก",
  99: "backlist",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";

    if (!search) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    const keyword = `%${search}%`;

    // --------------------------------------------------
    // 1. ค้นหาจาก recruit_job_applications
    // --------------------------------------------------
    const { data: applications, error: applicationError } =
      await supabaseAdmin
        .from("recruit_job_applications")
        .select(`
          id,
          first_name,
          last_name,
          nickname_th,
          nickname_en,
          status
        `)
        .or(
          [
            `first_name.ilike.${keyword}`,
            `last_name.ilike.${keyword}`,
            `nickname_th.ilike.${keyword}`,
            `nickname_en.ilike.${keyword}`,
          ].join(",")
        );

    if (applicationError) {
      console.error(
        "Search recruit_job_applications error:",
        applicationError
      );

      return NextResponse.json(
        {
          success: false,
          message: applicationError.message,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 2. ค้นหาจาก employees
    // --------------------------------------------------
    const { data: employees, error: employeeError } = await supabaseAdmin
      .from("employees")
      .select(`
        id,
        first_name_th,
        last_name_th,
        first_name_en,
        last_name_en,
        nick_name,
        nickname_th,
        nickname_en,
        status
      `)
      .or(
        [
          `first_name_th.ilike.${keyword}`,
          `last_name_th.ilike.${keyword}`,
          `first_name_en.ilike.${keyword}`,
          `last_name_en.ilike.${keyword}`,
          `nick_name.ilike.${keyword}`,
          `nickname_th.ilike.${keyword}`,
          `nickname_en.ilike.${keyword}`,
        ].join(",")
      );

    if (employeeError) {
      console.error("Search employees error:", employeeError);

      return NextResponse.json(
        {
          success: false,
          message: employeeError.message,
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 3. แปลง recruit_job_applications
    // --------------------------------------------------
    const applicationResults = (applications || []).map((item) => ({
      id: item.id,
      first_name: item.first_name,
      last_name: item.last_name,
      nickname: item.nickname_th || item.nickname_en || null,
      status: item.status,
      status_name:
        RECRUIT_STATUS[item.status] ??
        String(item.status ?? ""),
      source: "recruit_job_applications",
    }));

    // --------------------------------------------------
    // 4. แปลง employees
    // --------------------------------------------------
    const employeeResults = (employees || []).map((item) => ({
      id: item.id,
      first_name:
        item.first_name_th || item.first_name_en || "",
      last_name:
        item.last_name_th || item.last_name_en || "",
      nickname:
        item.nickname_th ||
        item.nickname_en ||
        item.nick_name ||
        null,

      // employees ให้แสดง status เดิม
      status: item.status,
      status_name: item.status,

      source: "employees",
    }));

    // --------------------------------------------------
    // 5. รวมข้อมูล
    // --------------------------------------------------
    const data = [
      ...applicationResults,
      ...employeeResults,
    ];

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("Employee search API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการค้นหาข้อมูล",
      },
      { status: 500 }
    );
  }
}