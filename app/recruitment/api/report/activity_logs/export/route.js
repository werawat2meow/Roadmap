import ExcelJS from "exceljs";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { withActivity } from "../../../../lib/activity/server";
import { parseActivityFilters } from "../../../../lib/activity/report";
import { findActivityUserIds } from "../../../../lib/activity/reportUserSearch";
import { loadActivityRows } from "../../../../lib/activity/reportData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_EXPORT_ROWS = 50000;
const failure = (message, status) => Response.json({ success: false, message }, { status, headers: { "Cache-Control": "private, no-store" } });

async function exportReport(request) {
  let filters;
  try { filters = parseActivityFilters(new URL(request.url).searchParams); }
  catch (error) { return failure(error.message, 400); }
  try {
    const snapshot = new Date().toISOString();
    const matchingUserIds = filters.userSearch ? await findActivityUserIds(supabaseAdmin, filters.userSearch) : null;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Activity logs", { views: [{ state: "frozen", ySplit: 1 }] });
    // Match the visible report columns. Store Bangkok time as text to avoid Excel timezone conversion.
    sheet.columns = [
      { header: "วันเวลา (Asia/Bangkok)", key: "created_at_bangkok", width: 25 },
      { header: "Username", key: "username", width: 24 },
      { header: "ชื่อผู้ใช้งาน", key: "employee_name", width: 32 },
      { header: "กิจกรรม", key: "action", width: 22 },
      { header: "สถานะ", key: "status", width: 16 },
      { header: "หน้าใช้งาน", key: "page_path", width: 65 },
      { header: "IP Address", key: "ip_address", width: 40 },
    ];
    let offset = 0;
    if (!matchingUserIds || matchingUserIds.length) {
      while (true) {
        if (request.signal.aborted) return failure("ยกเลิกการส่งออกแล้ว", 499);
        const result = await loadActivityRows(supabaseAdmin, filters, matchingUserIds, { offset, pageSize: 500, snapshot });
        if (result.total > MAX_EXPORT_ROWS || offset + result.data.length > MAX_EXPORT_ROWS) {
          return failure("ส่งออกได้สูงสุด 50,000 รายการต่อครั้ง กรุณาจำกัดช่วงวันที่หรือตัวกรอง", 422);
        }
        for (const record of result.data) {
          // Explicit string values cannot become Excel formulas or hyperlinks.
          sheet.addRow(Object.fromEntries(sheet.columns.map(({ key }) => [key, String(record[key] ?? "")])));
        }
        offset += result.data.length;
        if (!result.data.length || offset >= result.total) break;
      }
    }
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF123A63" } };
    sheet.getRow(1).height = 24;
    sheet.autoFilter = { from: "A1", to: `G${Math.max(sheet.rowCount, 1)}` };
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="recruitment-activity-logs.xlsx"',
      "Cache-Control": "private, no-store",
    } });
  } catch (error) {
    console.error("RECRUITMENT_ACTIVITY_EXPORT_FAILED", { code: error?.code || "EXPORT_ERROR" });
    return failure("ไม่สามารถส่งออก Excel ได้ กรุณาลองใหม่", 500);
  }
}

export const GET = withActivity(exportReport, {
  action: "EXPORT", resource_type: "recruitment_activity_logs", page_path: "/recruitment/report/activity_logs",
});
