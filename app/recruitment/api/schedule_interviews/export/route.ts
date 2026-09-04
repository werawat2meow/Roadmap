import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const positionId = searchParams.get("position_id");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  let query = supabaseAdmin
    .from("recruit_job_applications")
    .select(
      `
      id,
      first_name,
      last_name,
      nickname_th,
      nickname_en,
      phone_number,
      expected_salary,
      profile_image_url,
      position_id,
      titles (title_name_th),
      positions ( position_name ),
      recruit_job_interviews ( id, interview_datetime, remark, interview_order ),
      recruit_job_documents ( document_type, file_url )
      `
    )
    .eq("status", 5) // เฉพาะผู้สมัครยืนยันการสัมภาษณ์
    .order("created_at", { ascending: true });

  if (status) query = query.eq("status", Number(status));
  if (positionId) query = query.eq("position_id", Number(positionId));
  // หมายเหตุ: ถ้าต้องกรองตาม "วันที่สัมภาษณ์" จริง ๆ (ไม่ใช่วันสมัคร)
  // field นี้อยู่ในตารางลูก recruit_job_interviews จึงกรองฝั่ง query ตรง ๆ ไม่ได้ง่าย
  // ด้านล่างผมกรองซ้ำอีกชั้นหลังดึงข้อมูลมาแล้วแทน

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("รายชื่อผู้สมัคร");

  sheet.columns = [
    { header: "ลำดับ", key: "no", width: 8 },
    { header: "ชื่อ-นามสกุล", key: "fullname", width: 25 },
    { header: "ชื่อเล่น", key: "nickname", width: 15 },
    { header: "เบอร์โทร", key: "phone", width: 15 },
    { header: "ตำแหน่งที่ต้องการ", key: "position", width: 25 },
    { header: "เงินเดือนที่คาดหวัง", key: "salary", width: 18 },
    { header: "วันและเวลาที่สัมภาษณ์", key: "interview_datetime", width: 22 },
    { header: "หมายเหตุ", key: "remark", width: 30 },
    { header: "รูปภาพผู้สมัคร", key: "photo", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  const rows = (data ?? []) as any[];
  let excelRowIndex = 2; // แถวที่ 1 คือ header

  for (let i = 0; i < rows.length; i++) {
    const app = rows[i];

    const latestInterview = [...(app.recruit_job_interviews ?? [])].sort(
      (a: any, b: any) =>
        new Date(b.interview_datetime).getTime() -
        new Date(a.interview_datetime).getTime()
    )[0];

    // กรองตามช่วงวันที่สัมภาษณ์ (ถ้ามีการส่ง date_from/date_to มา)
    if (dateFrom || dateTo) {
      const d = latestInterview?.interview_datetime
        ? new Date(latestInterview.interview_datetime)
        : null;
      if (!d) continue;
      if (dateFrom && d < new Date(dateFrom)) continue;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) continue;
    }

    const photoDoc = (app.recruit_job_documents ?? []).find(
      (d: any) => d.document_type === "photo"
    );
    const photoUrl: string | null = app.profile_image_url || photoDoc?.file_url || null;

    sheet.addRow({
      no: excelRowIndex - 1,
      fullname: `${app.titles?.title_name_th ?? ""} ${app.first_name ?? ""} ${app.last_name ?? ""}`.trim(),
      nickname: app.nickname_th || app.nickname_en || "-",
      phone: app.phone_number || "-",
      position: app.positions?.position_name || "-",
      salary: app.expected_salary ?? "-",
      interview_datetime: latestInterview
        ? new Date(latestInterview.interview_datetime).toLocaleString("th-TH", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "-",
      remark: latestInterview?.remark || "-",
      photo: "",
    });

    const row = sheet.getRow(excelRowIndex);
    row.height = 60;

    if (photoUrl) {
      try {
        const imgRes = await fetch(photoUrl);
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const contentType = imgRes.headers.get("content-type") || "";
          const ext = contentType.includes("png") ? "png" : "jpeg";

          const imageId = workbook.addImage({
            buffer: buffer as any,
            extension: ext as "png" | "jpeg",
          });

          // col: 8 คือคอลัมน์ที่ 9 (photo) นับจาก 0, row: excelRowIndex - 1 นับจาก 0
          sheet.addImage(imageId, {
            tl: { col: 8, row: excelRowIndex - 1 },
            ext: { width: 60, height: 60 },
          });
        }
      } catch (err) {
        console.error("โหลดรูปผู้สมัครไม่สำเร็จ:", photoUrl, err);
      }
    }

    excelRowIndex++;
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="schedule_interviews_${Date.now()}.xlsx"`,
    },
  });
}