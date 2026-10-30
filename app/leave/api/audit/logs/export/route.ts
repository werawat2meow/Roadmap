import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

import {
  auditFilters,
  findAuditLogsForExport,
  requireAuditViewer,
} from "@/lib/leave-audit-reader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function thaiTime(value: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuditViewer();
    if (!auth.ok) return auth.response;

    const params = new URL(request.url).searchParams;
    const { where, from, to } = auditFilters(params);
    const { rows } = await findAuditLogsForExport(where);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Leave HR";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("ประวัติการใช้งาน", {
      views: [{ state: "frozen", ySplit: 2 }],
    });

    sheet.mergeCells("A1:N1");
    sheet.getCell("A1").value = `ประวัติการใช้งาน Leave HR | ${from} ถึง ${to}`;
    sheet.getCell("A1").font = {
      bold: true,
      size: 14,
      color: { argb: "FFFFFFFF" },
    };
    sheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
    sheet.getRow(1).height = 28;

    const headers = [
      "เวลาไทย",
      "ชื่อผู้ใช้",
      "ชื่อบัญชี",
      "รหัสพนักงาน",
      "บทบาท",
      "เมนู",
      "เส้นทาง",
      "การกระทำ",
      "ผลลัพธ์",
      "รายละเอียด",
      "รหัสรายการ",
      "IP",
      "Request ID",
      "แหล่งข้อมูล",
    ];

    sheet.addRow(headers);
    sheet.getRow(2).font = { bold: true, color: { argb: "FF0F172A" } };
    sheet.getRow(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDDF7F0" },
    };

    for (const row of rows) {
      sheet.addRow([
        thaiTime(row.created_at),
        row.actor_name || "",
        row.actor_username || "",
        row.actor_employee_code || "",
        row.actor_role_code || "",
        row.page_name || "",
        row.page_path || "",
        row.action,
        row.outcome,
        row.description || "",
        row.target_id || "",
        row.ip_address || "",
        row.request_id || "",
        row.event_source,
      ]);
    }

    const widths = [23, 28, 20, 18, 18, 24, 32, 24, 14, 52, 18, 20, 40, 17];
    widths.forEach((width, index) => {
      sheet.getColumn(index + 1).width = width;
    });

    sheet.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: Math.max(2, rows.length + 2), column: headers.length },
    };

    for (const row of sheet.getRows(2, rows.length + 1) || []) {
      row.alignment = { vertical: "middle", wrapText: true };
      row.height = 22;
      row.eachCell((cell) => {
        cell.border = {
          bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
        };
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const bytes = new Uint8Array(buffer);
    const filename = `leave-audit-${from}-to-${to}.xlsx`;

    return new NextResponse(bytes, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      /วันที่|ช่วงวันที่|ผลลัพธ์|รายการ/.test(error.message)
    ) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    console.error("EXPORT_LEAVE_AUDIT_LOGS_FAILED", error);
    return NextResponse.json(
      { success: false, error: "ส่งออกประวัติการใช้งานไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
