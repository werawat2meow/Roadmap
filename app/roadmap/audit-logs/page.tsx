"use client";

import { useCallback, useEffect, useState } from "react";

type AuditLog = {
  id: string;
  employee_id: string | null;
  employee_code: string | null;
  employee_name: string | null;
  page: string | null;
  action: string;
  description: string | null;
  ip_address: string | null;
  created_at: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        search,
      });

      const response = await fetch(`/roadmap/api/audit?${params.toString()}`);
      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "ไม่สามารถโหลด Log ได้");
      }

      setLogs(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotal(json.pagination?.total || 0);
    } catch (error) {
      console.error("Load audit logs failed:", error);
      setLogs([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadLogs]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    void loadLogs();
  };

  return (
    <div className="min-h-screen bg-[#F9F5F2] p-6 text-slate-700 lg:p-10">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Roadmap Audit Logs
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          ตรวจสอบการเข้าใช้งานและการทำรายการในระบบ Roadmap
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="ค้นหาหน้า เมนู หรือรายละเอียด"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="button"
            onClick={handleSearch}
            className="cursor-pointer rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            ค้นหา
          </button>
        </div>

        <div className="mb-4 text-sm text-slate-600">
          พบทั้งหมด {total.toLocaleString("th-TH")} รายการ
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] border-collapse text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100 text-left text-slate-800">
                <th className="px-4 py-3 font-semibold">วันเวลา</th>
                <th className="px-4 py-3 font-semibold">ผู้ใช้งาน</th>
                <th className="px-4 py-3 font-semibold">รหัสพนักงาน</th>
                <th className="px-4 py-3 font-semibold">หน้า/เมนู</th>
                <th className="px-4 py-3 font-semibold">การกระทำ</th>
                <th className="px-4 py-3 font-semibold">รายละเอียด</th>
                <th className="px-4 py-3 font-semibold">IP Address</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-600"
                  >
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    ยังไม่มีข้อมูล Log
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 text-slate-700 transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {new Date(log.created_at).toLocaleString("th-TH")}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-900">
                      {log.employee_name || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {log.employee_code || log.employee_id || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {log.page || "-"}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {log.action}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {log.description || "-"}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {log.ip_address || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">
            หน้า {page} จาก {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => {
                setLoading(true);
                setPage((current) => current - 1);
              }}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ก่อนหน้า
            </button>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => {
                setLoading(true);
                setPage((current) => current + 1);
              }}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}