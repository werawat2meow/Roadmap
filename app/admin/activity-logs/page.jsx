"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

const PAGE_SIZE = 20;

export default function ActivityLogsPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canView = hasPermission(user, "activity_logs.view");

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canView) {
      router.replace("/admin");
    }
  }, [user, canView, loadingUser, router]);

  const loadLogs = async (
    keyword = "",
    moduleName = "",
    actionType = "",
    currentPage = 1,
    from = "",
    to = ""
  ) => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (keyword) params.set("search", keyword);
      if (moduleName) params.set("module_name", moduleName);
      if (actionType) params.set("action_type", actionType);
      if (from) params.set("date_from", from);
      if (to) params.set("date_to", to);
      params.set("page", String(currentPage));
      params.set("pageSize", String(PAGE_SIZE));

      const res = await fetch(`/api/admin/activity-logs?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load activity logs failed");
      }

      setLogs(data.data || []);
      setPage(data.pagination?.page || 1);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล log");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs("", "", "", 1, "", "");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs(search, moduleFilter, actionFilter, 1, dateFrom, dateTo);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, moduleFilter, actionFilter, dateFrom, dateTo]);

  const handleClearDate = () => {
    setDateFrom("");
    setDateTo("");
  };

  const moduleOptions = useMemo(
    () => [
      "employees",
      "user_accounts",
      "roles",
      "role_permissions",
      "branches",
      "departments",
      "divisions",
      "units",
      "positions",
      "employment_types",
      "employee_statuses",
    ],
    []
  );

  const actionOptions = useMemo(() => ["create", "update", "delete"], []);

  const formatJson = (value) => {
    if (!value) return "-";
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "-";
    }
  };

  if (loadingUser) return null;
  if (!user) return null;
  if (!canView) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Activity Logs
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                ตรวจสอบประวัติการเพิ่ม แก้ไข และลบข้อมูลในระบบ
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              กลับหน้า Admin
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Search */}
            <input
              type="text"
              placeholder="ค้นหา description / module / action"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />

            {/* Module */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">ทุก Module</option>
              {moduleOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* Action */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">ทุก Action</option>
              {actionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Row */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              {/* Date From */}
              <div className="relative flex-1">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-slate-400">
                  ตั้งแต่วันที่
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo || undefined}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <span className="text-slate-400">—</span>

              {/* Date To */}
              <div className="relative flex-1">
                <label className="absolute -top-2 left-3 bg-white px-1 text-xs text-slate-400">
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            {/* Clear Date Button — แสดงเมื่อเลือกวันแล้ว */}
            {(dateFrom || dateTo) && (
              <button
                type="button"
                onClick={handleClearDate}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
              >
                ล้างวันที่
              </button>
            )}

            {/* Summary badge */}
            {dateFrom && dateTo && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                {new Date(dateFrom).toLocaleDateString("th-TH")} –{" "}
                {new Date(dateTo).toLocaleDateString("th-TH")}
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 text-left">เวลา</th>
                  <th className="px-6 py-4 text-left">Module</th>
                  <th className="px-6 py-4 text-left">Action</th>
                  <th className="px-6 py-4 text-left">Description</th>
                  <th className="px-6 py-4 text-left">Reference</th>
                  <th className="px-6 py-4 text-left">ข้อมูลเดิม</th>
                  <th className="px-6 py-4 text-left">ข้อมูลใหม่</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  [...Array(PAGE_SIZE)].map((_, i) => (
                    <tr key={i} className="border-t border-slate-200">
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-20 w-56 animate-pulse rounded bg-slate-200" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-20 w-56 animate-pulse rounded bg-slate-200" />
                      </td>
                    </tr>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-slate-200 align-top hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString("th-TH")
                          : "-"}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-700">
                        {log.module_name || "-"}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            log.action_type === "create"
                              ? "bg-green-100 text-green-700"
                              : log.action_type === "update"
                              ? "bg-yellow-100 text-yellow-700"
                              : log.action_type === "delete"
                              ? "bg-red-100 text-red-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {log.action_type || "-"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-700">
                        {log.description || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        <div>{log.reference_table || "-"}</div>
                        <div className="mt-1 break-all text-xs text-slate-400">
                          {log.reference_id || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <pre className="max-w-[320px] overflow-auto rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          {formatJson(log.old_data)}
                        </pre>
                      </td>

                      <td className="px-6 py-4">
                        <pre className="max-w-[320px] overflow-auto rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          {formatJson(log.new_data)}
                        </pre>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-slate-400"
                    >
                      ไม่พบข้อมูล log
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">ทั้งหมด {total} รายการ</p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() =>
                  loadLogs(search, moduleFilter, actionFilter, page - 1, dateFrom, dateTo)
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ก่อนหน้า
              </button>

              <span className="text-sm text-slate-600">
                หน้า {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() =>
                  loadLogs(search, moduleFilter, actionFilter, page + 1, dateFrom, dateTo)
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}