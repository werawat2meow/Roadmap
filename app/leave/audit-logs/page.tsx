"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

type LogRow = {
  id: string;
  created_at: string;
  actor_name: string | null;
  actor_username: string | null;
  actor_employee_code: string | null;
  page_name: string | null;
  page_path: string | null;
  action: string;
  outcome: string;
  description: string | null;
  target_type: string | null;
  target_id: string | null;
};

type LogDetail = LogRow & {
  actor_role_code: string | null;
  event_source: string;
  event_type: string;
  endpoint: string | null;
  http_method: string | null;
  http_status: number | null;
  request_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: unknown;
  before_data: unknown;
  after_data: unknown;
};

function todayBangkok() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function startOfMonthBangkok() {
  return `${todayBangkok().slice(0, 7)}-01`;
}

function displayTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function showJson(value: unknown) {
  return JSON.stringify(value ?? null, null, 2);
}

export default function LeaveAuditLogsPage() {
  const [from, setFrom] = useState(startOfMonthBangkok);
  const [to, setTo] = useState(todayBangkok);
  const [user, setUser] = useState("");
  const [pagePath, setPagePath] = useState("");
  const [action, setAction] = useState("");
  const [outcome, setOutcome] = useState("");
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<LogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const filters = useMemo(() => {
    const params = new URLSearchParams({
      from, to, page: String(page),
    });
    if (user.trim()) params.set("user", user.trim());
    if (pagePath) params.set("pagePath", pagePath);
    if (action) params.set("action", action);
    if (outcome) params.set("outcome", outcome);
    return params;
  }, [from, to, user, pagePath, action, outcome, page]);

  useEffect(() => {
    if (!from || !to || from > to) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/leave/api/audit/logs?${filters}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || "โหลดประวัติไม่สำเร็จ");
        }
        if (controller.signal.aborted) return;

        setRows(json.rows);
        setTotal(json.total);
        setTotalPages(json.totalPages);
        if (json.page !== page) setPage(json.page);
        setError("");
      } catch (caught) {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : "โหลดประวัติไม่สำเร็จ");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [filters, from, to, page]);

  function resetPage(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const response = await fetch(
        `/leave/api/audit/logs/${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "โหลดรายละเอียดไม่สำเร็จ");
      }
      setDetail(json.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "โหลดรายละเอียดไม่สำเร็จ");
    } finally {
      setDetailLoading(false);
    }
  }

  async function downloadExcel() {
    try {
      const params = new URLSearchParams(filters);
      params.delete("page");

      const response = await fetch(
        `/leave/api/audit/logs/export?${params}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || "ส่งออก Excel ไม่สำเร็จ");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `leave-audit-${from}-to-${to}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ส่งออก Excel ไม่สำเร็จ");
    }
  }

  return (
    <div className="space-y-6 p-5 text-slate-900 md:p-8">
      <div>
        <h1 className="text-2xl font-bold">ประวัติการใช้งาน</h1>
        <p className="text-sm text-slate-500">
          ตรวจสอบการเปิดเมนูและการทำรายการที่ระบบบันทึกไว้
        </p>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="text-sm">
            วันที่เริ่ม
            <input type="date" value={from}
              onChange={(e) => resetPage(setFrom, e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
          </label>
          <label className="text-sm">
            วันที่สิ้นสุด
            <input type="date" value={to}
              onChange={(e) => resetPage(setTo, e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
          </label>
          <label className="text-sm">
            ผู้ใช้ / รหัสพนักงาน
            <div className="mt-1 flex items-center rounded-xl border border-slate-200 px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input value={user}
                onChange={(e) => resetPage(setUser, e.target.value)}
                className="w-full p-3 outline-none"
                placeholder="ค้นหาผู้ใช้" />
            </div>
          </label>
          <label className="text-sm">
            เมนู
            <select value={pagePath}
              onChange={(e) => resetPage(setPagePath, e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3">
              <option value="">ทุกเมนู</option>
              <option value="/leave">Overview</option>
              <option value="/leave/schedules">Schedule tasks</option>
              <option value="/leave/attendance">Attendance</option>
              <option value="/leave/reports">Reports</option>
              <option value="/leave/approvals">Leave Entry</option>
              <option value="/leave/eligibility">Eligibility</option>
              <option value="/leave/manage-requests">Restore leave</option>
              <option value="/leave/settings">Settings</option>
              <option value="/leave/audit-logs">ประวัติการใช้งาน</option>
            </select>
          </label>
          <label className="text-sm">
            การกระทำ
            <select value={action}
              onChange={(e) => resetPage(setAction, e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3">
              <option value="">ทั้งหมด</option>
              <option value="PAGE_VIEW">เปิดหน้า</option>
              <option value="LEAVE_REFUND">คืนสิทธิ์</option>
            </select>
          </label>
          <label className="text-sm">
            ผลลัพธ์
            <select value={outcome}
              onChange={(e) => resetPage(setOutcome, e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3">
              <option value="">ทั้งหมด</option>
              <option value="INFO">ข้อมูล</option>
              <option value="SUCCESS">สำเร็จ</option>
              <option value="FAILURE">ไม่สำเร็จ</option>
              <option value="DENIED">ปฏิเสธสิทธิ์</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={downloadExcel}
            disabled={!from || !to || from > to}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            <Download className="h-4 w-4" />
            ดาวน์โหลด Excel
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {["เวลา", "ผู้ใช้", "เมนู", "การกระทำ", "ผลลัพธ์", "รายละเอียด", ""].map(
                  (header) => <th key={header} className="px-4 py-3">{header}</th>,
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="whitespace-nowrap px-4 py-3">
                    {displayTime(row.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.actor_name || row.actor_username || "ไม่ระบุ"}</div>
                    <div className="text-xs text-slate-500">{row.actor_employee_code}</div>
                  </td>
                  <td className="px-4 py-3">{row.page_name || row.page_path || "—"}</td>
                  <td className="px-4 py-3">{row.action}</td>
                  <td className="px-4 py-3">{row.outcome}</td>
                  <td className="max-w-xs truncate px-4 py-3">{row.description || "—"}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => openDetail(row.id)}
                      className="font-medium text-emerald-700 hover:underline">
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">
                  ไม่พบข้อมูลในช่วงวันที่และตัวกรองนี้
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
          <span>{loading ? "กำลังโหลด..." : `${total} รายการ · หน้า ${page}/${totalPages}`}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
              className="rounded-lg border border-slate-200 p-2 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {(detail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setDetail(null)}>
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">รายละเอียดประวัติการใช้งาน</h2>
              <button type="button" onClick={() => setDetail(null)}>ปิด</button>
            </div>
            {detailLoading && !detail ? (
              <p className="mt-5">กำลังโหลด...</p>
            ) : detail && (
              <div className="mt-5 space-y-4 text-sm">
                <p><b>เวลา:</b> {displayTime(detail.created_at)}</p>
                <p><b>ผู้ใช้:</b> {detail.actor_name || detail.actor_username || "ไม่ระบุ"}
                  {" "}({detail.actor_employee_code || "ไม่มีรหัส"})</p>
                <p><b>เมนู / การกระทำ:</b> {detail.page_name || "—"} / {detail.action}</p>
                <p><b>ผลลัพธ์:</b> {detail.outcome}</p>
                <p><b>รายละเอียด:</b> {detail.description || "—"}</p>
                <p><b>รายการ:</b> {detail.target_type || "—"} / {detail.target_id || "—"}</p>
                <p><b>HTTP:</b> {detail.http_method || "—"} {detail.endpoint || "—"}
                  {" "}({detail.http_status || "—"})</p>
                <p><b>IP:</b> {detail.ip_address || "ไม่ได้บันทึก"}</p>
                <p><b>Request ID:</b> {detail.request_id || "—"}</p>
                <div>
                  <b>ข้อมูลก่อนทำรายการ</b>
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-3">
                    {showJson(detail.before_data)}
                  </pre>
                </div>
                <div>
                  <b>ข้อมูลหลังทำรายการ</b>
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-3">
                    {showJson(detail.after_data)}
                  </pre>
                </div>
                <div>
                  <b>ข้อมูลประกอบ</b>
                  <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-50 p-3">
                    {showJson(detail.metadata)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}