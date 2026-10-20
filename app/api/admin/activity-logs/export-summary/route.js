import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { requireScopedAccess } from "@/lib/auth/requireScopedAccess";
import { buildAuditQuery, parseFilters } from "@/lib/audit/query";
import { attachAuditEmployeeNames } from "@/lib/audit/employeeNames";
import { writeEnterpriseAudit } from "@/lib/audit/logger";
import { getVerifiedAuditActor } from "@/lib/audit/authActor";

export const runtime = "nodejs";

const LIMIT = 10000;
const BATCH = 500;
const MAX_IDLE_SECONDS = 30 * 60;
const SELECT_FIELDS = "id,created_at,username,user_account_id,employee_id,system_code,module_name,event_type,action_type,description,ip_address,http_method,endpoint,session_id,event_status";

function safeCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
}

function formatIp(value) {
  if (!value) return "";
  if (value === "::1") return "Localhost";
  return String(value).startsWith("::ffff:") ? String(value).slice(7) : String(value);
}

function methodFor(row) {
  const method = String(row.http_method || "").toUpperCase();
  if (["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) return method;
  const action = String(row.action_type || row.event_type || "").toUpperCase();
  if (action === "CREATE") return "POST (จาก Action)";
  if (action === "UPDATE") return "ไม่ระบุ (Action: UPDATE)";
  if (action === "DELETE") return "DELETE (จาก Action)";
  if (action === "PAGE_VIEW") return "GET (Page View)";
  return method || "ไม่ระบุ";
}

// Duration is an estimated interval backed by subsequent recorded activity,
// never a measured browser tab lifetime or an invented default duration.
function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remaining = rounded % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function actionFor(log) {
  return String(log.action_type || log.event_type || "").toUpperCase();
}

function makeSheet(headers, rows) {
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  sheet["!cols"] = headers.map((h, i) => ({
    wch: Math.min(55, Math.max(18, h === "Path URL" ? 46 : h.length + 5)),
  }));
  sheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: rows.length, c: headers.length - 1 },
    }),
  };
  return sheet;
}

function estimatePageDurations(logs) {
  const secondsByPageView = new Map();
  const eventsByIdentity = new Map();

  for (const log of logs) {
    const timestamp = Date.parse(log.created_at);
    if (!Number.isFinite(timestamp)) continue;

    // No cross-account mixing. For older events without an account UUID,
    // use username; IP additionally separates simultaneous browser locations.
    const account = log.user_account_id
      ? `id:${log.user_account_id}`
      : log.username
        ? `username:${String(log.username).trim().toLowerCase()}`
        : null;
    if (!account) continue;
    const identity = JSON.stringify([account, formatIp(log.ip_address), log.system_code || ""]);
    if (!eventsByIdentity.has(identity)) eventsByIdentity.set(identity, []);
    eventsByIdentity.get(identity).push({ ...log, _timestamp: timestamp });
  }

  for (const events of eventsByIdentity.values()) {
    events.sort((a, b) => a._timestamp - b._timestamp || String(a.id).localeCompare(String(b.id)));
    let activePage = null;
    let previous = null;
    let knownSession = null;

    for (const log of events) {
      const action = actionFor(log);
      const session = log.session_id || null;
      const interval = previous ? (log._timestamp - previous._timestamp) / 1000 : null;
      const isSessionSwitch = Boolean(knownSession && session && knownSession !== session);
      const idleBreak = interval === null || interval < 0 || interval > MAX_IDLE_SECONDS;

      if (idleBreak || isSessionSwitch || action === "LOGIN_SUCCESS" || action === "LOGIN" || action === "LOGOUT") {
        // A gap, a login or a session change must never be charged to a page.
        if (idleBreak || isSessionSwitch || action === "LOGIN_SUCCESS" || action === "LOGIN") activePage = null;
      }

      if (!idleBreak && !isSessionSwitch && activePage && action !== "LOGIN_SUCCESS" && action !== "LOGIN") {
        secondsByPageView.set(activePage, (secondsByPageView.get(activePage) || 0) + interval);
      }

      if (action === "PAGE_VIEW" && log.endpoint) {
        activePage = log.id;
      } else if (action === "LOGOUT" || action === "LOGIN_SUCCESS" || action === "LOGIN") {
        activePage = null;
      }

      if (session) knownSession = session;
      if (idleBreak && !session) knownSession = null;
      previous = log;
    }
  }

  return secondsByPageView;
}

export async function GET(req) {
  try {
    const guard = await requireScopedAccess("access.activity_logs", "view");
    if (!guard.ok) return guard.response;
    const actor = getVerifiedAuditActor(req);
    if (!actor) {
      return NextResponse.json({ success: false, error: "ไม่พบผู้ใช้ที่ยืนยันตัวตน" }, { status: 401 });
    }

    const filters = parseFilters(req.url);
    const logs = [];
    for (let start = 0; start < LIMIT; start += BATCH) {
      const { data, error } = await buildAuditQuery(supabaseAdmin, filters, SELECT_FIELDS)
        .range(start, start + BATCH - 1);
      if (error) throw error;
      logs.push(...(data || []));
      if (!data || data.length < BATCH) break;
    }
    if (logs.length === LIMIT) {
      const { data, error } = await buildAuditQuery(supabaseAdmin, filters, "id").range(LIMIT, LIMIT);
      if (error) throw error;
      if (data?.length) {
        return NextResponse.json({ success: false, error: "ข้อมูลเกิน 10,000 รายการ กรุณาจำกัดช่วงวันที่ก่อน Export" }, { status: 413 });
      }
    }

    const enriched = await attachAuditEmployeeNames(logs);
    const approximateSeconds = estimatePageDurations(enriched);

    const detailHeaders = [
      "วันเวลา (ประเทศไทย)", "Username", "ชื่อ-นามสกุล", "Path URL",
      "เวลาประมาณ (ชม:นาที:วินาที)", "Module", "HTTP Method", "Action", "IP Address", "System",
    ];
    const detail = enriched.map((log) => [
      new Date(log.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour12: false }),
      safeCell(log.username), safeCell(log.employee_full_name), safeCell(log.endpoint),
      approximateSeconds.has(log.id) ? formatDuration(approximateSeconds.get(log.id)) : "",
      safeCell(log.module_name), methodFor(log), safeCell(log.action_type || log.event_type),
      formatIp(log.ip_address), safeCell(log.system_code),
    ]);

    const grouped = new Map();
    for (const log of enriched) {
      const props = [
        log.username || "", log.employee_full_name || "", log.endpoint || "",
        log.module_name || "", methodFor(log), log.action_type || log.event_type || "",
        formatIp(log.ip_address), log.system_code || "",
      ];
      const key = JSON.stringify(props);
      if (!grouped.has(key)) grouped.set(key, { props, count: 0, seconds: 0, estimatedRows: 0 });
      const item = grouped.get(key);
      item.count += 1;
      if (approximateSeconds.has(log.id)) {
        item.seconds += approximateSeconds.get(log.id);
        item.estimatedRows += 1;
      }
    }

    const summaryHeaders = [
      "Username", "ชื่อ-นามสกุล", "Path URL", "Module", "HTTP Method",
      "Action", "IP Address", "System", "จำนวน Log", "เวลาประมาณรวม (ชม:นาที:วินาที)",
    ];
    const summary = [...grouped.values()].map((item) => [
      ...item.props.map(safeCell), item.count,
      item.estimatedRows ? formatDuration(item.seconds) : "",
    ]);

    const totalKnownSeconds = [...grouped.values()].reduce((sum, item) => sum + item.seconds, 0);
    const totalEstimatedRows = [...grouped.values()].reduce((sum, item) => sum + item.estimatedRows, 0);
    summary.push([
      "รวมทั้งหมด", "", "", "", "", "", "", "", enriched.length,
      totalEstimatedRows ? formatDuration(totalKnownSeconds) : "",
    ]);

    const byUser = new Map();
    for (const item of grouped.values()) {
      const [username, fullName] = item.props;
      const key = JSON.stringify([username, fullName]);
      if (!byUser.has(key)) byUser.set(key, { username, fullName, count: 0, seconds: 0, estimatedRows: 0 });
      const u = byUser.get(key);
      u.count += item.count;
      u.seconds += item.seconds;
      u.estimatedRows += item.estimatedRows;
    }
    const userHeaders = ["Username", "ชื่อ-นามสกุล", "จำนวน Log", "จำนวนรายการที่คำนวณเวลาได้", "เวลาประมาณรวม (ชม:นาที:วินาที)"];
    const userRows = [...byUser.values()].map((u) => [
      safeCell(u.username), safeCell(u.fullName), u.count, u.estimatedRows,
      u.estimatedRows ? formatDuration(u.seconds) : "",
    ]);
    userRows.push(["รวมทั้งหมด", "", enriched.length, totalEstimatedRows,
      totalEstimatedRows ? formatDuration(totalKnownSeconds) : ""]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, makeSheet(summaryHeaders, summary), "สรุปการใช้งาน");
    XLSX.utils.book_append_sheet(workbook, makeSheet(userHeaders, userRows), "รวมรายผู้ใช้");
    XLSX.utils.book_append_sheet(workbook, makeSheet(detailHeaders, detail), "รายการ Log");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ["คำอธิบายรายงาน", "รายละเอียด"],
      ["แหล่งข้อมูล", "activity_logs ตามตัวกรองที่เลือกบนหน้า Activity Logs"],
      ["เวลาประมาณ", "ไม่ใช่เวลาใช้งานจริง: นำช่วงห่างระหว่างกิจกรรมของบัญชี+IP เดียวกัน (และ session_id เดียวกันเมื่อระบุ) มารวมให้ PAGE_VIEW ล่าสุด เฉพาะช่วงต่อเนื่องไม่เกิน 30 นาที"],
      ["ไม่มี session_id", "ใช้บัญชีและ IP เดียวกันเป็นการประมาณ เมื่อมีหลักฐานกิจกรรมต่อเนื่อง ไม่สามารถแยกหลายแท็บหรือทุกเซสชันได้แน่นอน"],
      ["เวลาว่าง", "ไม่มีข้อมูลกิจกรรมถัดไปหรือช่วงห่างเกิน 30 นาที จึงไม่สามารถประมาณได้ ไม่ได้หมายถึง 0 นาที"],
      ["การคำนวณเวลา", "หยุดต่อเนื่องเมื่อมีช่องว่างเกิน 30 นาที / เปลี่ยน session_id ที่ระบุ / Login ใหม่ / Logout"],
      ["รายการที่คิดเวลา", "คิดให้ PAGE_VIEW ที่มีข้อมูลต่อเนื่องเท่านั้น ไม่คิด POST/UPDATE/DELETE เป็นหน้าใหม่"],
      ["จำนวน Log", "นับทุกกิจกรรมตามตัวกรอง แต่เวลารวมเป็นผลประมาณของ PAGE_VIEW ที่มีข้อมูลเท่านั้น"],
      ["ความครบถ้วน", "ผลลัพธ์ขึ้นอยู่กับ Log ภายในตัวกรอง; ถ้ากรองเฉพาะบาง Module/Action หรือช่วงวัน เวลาอาจขาดตอน"],
      ["HTTP Method", "กรณีไม่มี http_method จะแสดงวิธีที่อนุมานจาก Action พร้อมคำกำกับ"],
      ["จำนวนสูงสุด", "10,000 รายการ"],
    ]), "คำอธิบาย");

    const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx", compression: true });
    try {
      await writeEnterpriseAudit({
        actor, event_type: "AUDIT_EXPORT", module_name: "AUDIT", system_code: "HRMS",
        event_status: "SUCCESS", description: `Export audit XLSX ${enriched.length} rows`,
        new_data: { row_count: enriched.length, filters }, request: req,
        endpoint: "/api/admin/activity-logs/export-summary", http_method: "GET",
      });
    } catch (auditError) {
      console.error("AUDIT_EXPORT_LOG_ERROR", auditError);
    }

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="hrms-activity-summary-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("AUDIT_XLSX_EXPORT_ERROR", error);
    return NextResponse.json({
      success: false,
      error: error.message?.includes("ไม่ถูกต้อง") ? error.message : "ไม่สามารถ Export Excel ได้",
    }, { status: 500 });
  }
}
