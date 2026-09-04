import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "edge";

// เลือกแถวสัมภาษณ์ที่มี interview_order สูงสุด
function getLatestInterview(interviews?: any[]) {
  if (!interviews?.length) return null;
  return [...interviews].sort(
    (a, b) => (b.interview_order ?? 0) - (a.interview_order ?? 0)
  )[0];
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function formatSalary(value?: number | null) {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString("th-TH");
}

function resolvePhotoUrl(app: any): string | null {
  if (app.profile_image_url) return app.profile_image_url;

  const photoDoc = (app.recruit_job_documents ?? []).find(
    (d: any) => d.document_type === "photo"
  );

  return photoDoc?.file_url ?? null;
}

export async function GET(req: Request) {
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
    status,
    titles (title_name_th),
    positions ( position_name ),
    recruit_job_interviews ( id, interview_datetime, remark, interview_order ),
    recruit_job_documents ( document_type, file_url )
    `
    )
    .order("created_at", { ascending: true });

  if (status) query = query.eq("status", Number(status));
  if (positionId) query = query.eq("position_id", Number(positionId));
  if (dateFrom && dateTo) {
    query = query
      .gte("recruit_job_interviews.interview_datetime", `${dateFrom}T00:00:00`)
      .lte("recruit_job_interviews.interview_datetime", `${dateTo}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // กรองเฉพาะ application ที่มีข้อมูลการสัมภาษณ์ (recruit_job_interviews) แล้ว
  // ต้องลงข้อมูลนัดสัมภาษณ์ก่อน ถึงจะแสดงในรายงานนี้
  const rows = (data ?? [])
    .map((app: any) => {
      const latest = getLatestInterview(app.recruit_job_interviews);
      if (!latest) return null;

      const nickname =
        app.nickname_th || app.nickname_en
          ? `${app.nickname_th ?? ""}${
              app.nickname_en ? ` (${app.nickname_en})` : ""
            }`
          : "-";

      return {
        name: `${app.titles?.title_name_th ?? ""} ${app.first_name ?? ""} ${app.last_name ?? ""}`.trim() || "-",
        nickname,
        phone: app.phone_number || "-",
        position: app.positions?.position_name ?? "-",
        salary: formatSalary(app.expected_salary),
        interviewDateTime: formatDateTime(latest?.interview_datetime),
        remark: latest?.remark || "-",
        photoUrl: resolvePhotoUrl(app),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .map((row, index) => ({ ...row, no: index + 1 }));

  const fontData = await fetch(
    new URL("./Sarabun-Regular.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  const colWidths = {
    no: 50,
    name: 170,
    nickname: 140,
    phone: 120,
    position: 160,
    salary: 110,
    interview: 160,
    remark: 180,
    photo: 60,
  };
  const tableContentWidth = Object.values(colWidths).reduce((a, b) => a + b, 0);
  const tableWidth = tableContentWidth + 48;

  const headerCellStyle = (width: number, isLast: boolean) => ({
    display: "flex" as const,
    width,
    padding: "10px 8px",
    fontWeight: 700,
    fontSize: 13,
    color: "#475569",
    ...(isLast ? {} : { borderRight: "1px solid #cbd5e1" }),
  });

  const bodyCellStyle = (width: number, isLast: boolean) => ({
    display: "flex" as const,
    width,
    padding: "8px",
    fontSize: 13,
    color: "#1e293b",
    ...(isLast ? {} : { borderRight: "1px solid #e2e8f0" }),
  });

  const isEmpty = rows.length === 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: tableWidth,
          padding: 24,
          background: "#ffffff",
          fontFamily: "Sarabun",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 16,
            color: "#1e293b",
          }}
        >
          Schedule Interviews
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              background: "#f1f5f9",
              borderBottom: "1px solid #cbd5e1",
            }}
          >
            <div style={headerCellStyle(colWidths.no, false)}>ลำดับ</div>
            <div style={headerCellStyle(colWidths.name, false)}>ชื่อ-นามสกุล</div>
            <div style={headerCellStyle(colWidths.nickname, false)}>ชื่อเล่น</div>
            <div style={headerCellStyle(colWidths.phone, false)}>เบอร์โทร</div>
            <div style={headerCellStyle(colWidths.position, false)}>ตำแหน่งที่ต้องการ</div>
            <div style={headerCellStyle(colWidths.salary, false)}>เงินเดือนคาดหวัง</div>
            <div style={headerCellStyle(colWidths.interview, false)}>วันเวลาสัมภาษณ์</div>
            <div style={headerCellStyle(colWidths.remark, false)}>หมายเหตุ</div>
            <div style={headerCellStyle(colWidths.photo, true)}>รูป</div>
          </div>

          {/* กรณีไม่มีข้อมูล — ต้องกำหนด width ชัดเจน ไม่งั้น satori จะ render กล่องกว้าง 0 */}
          {isEmpty ? (
            <div
              style={{
                display: "flex",
                width: tableContentWidth,
                justifyContent: "center",
                alignItems: "center",
                padding: "32px 0",
                paddingBottom: 16,
              }}
            >
              <div style={{ display: "flex", color: "#94a3b8", fontSize: 14 }}>
                ไม่พบข้อมูล
              </div>
            </div>
          ) : (
            rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: i % 2 === 1 ? "#f8fafc" : "#ffffff",
                  borderBottom:
                    i === rows.length - 1 ? "none" : "1px solid #e2e8f0",
                }}
              >
                <div style={bodyCellStyle(colWidths.no, false)}>{r.no}</div>
                <div style={bodyCellStyle(colWidths.name, false)}>{r.name}</div>
                <div style={bodyCellStyle(colWidths.nickname, false)}>{r.nickname}</div>
                <div style={bodyCellStyle(colWidths.phone, false)}>{r.phone}</div>
                <div style={bodyCellStyle(colWidths.position, false)}>{r.position}</div>
                <div style={bodyCellStyle(colWidths.salary, false)}>{r.salary}</div>
                <div style={bodyCellStyle(colWidths.interview, false)}>{r.interviewDateTime}</div>
                <div style={{ ...bodyCellStyle(colWidths.remark, false), fontSize: 12, color: "#475569" }}>
                  {r.remark}
                </div>
                <div style={bodyCellStyle(colWidths.photo, true)}>
                  {r.photoUrl ? (
                    <img
                      src={r.photoUrl}
                      width={40}
                      height={40}
                      style={{ borderRadius: 8, objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "#e2e8f0",
                        color: "#94a3b8",
                        fontSize: 10,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      N/A
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    ),
    {
      width: tableWidth,
      height: isEmpty ? 190 : 110 + rows.length * 62,
      fonts: [
        {
          name: "Sarabun",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}