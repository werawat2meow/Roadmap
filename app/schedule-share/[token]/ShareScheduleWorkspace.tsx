"use client";

import { useEffect, useState } from "react";
import ScheduleWorkspace from "@/app/leave/schedules/components/ScheduleWorkspace";
import type {
  ScheduleEmployee,
  ScheduleItem,
} from "@/app/leave/schedules/components/ScheduleGrid";

type SharedData = {
  success: boolean;
  error?: string;
  period: { year: number; month: number; startDate: string; endDate: string; dates: string[] };
  expiresAt: string;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  employees: ScheduleEmployee[];
  schedules: ScheduleItem[];
};

export default function ShareScheduleWorkspace({ token }: { token: string }) {
  const [data, setData] = useState<SharedData | null>(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/schedule-share/${encodeURIComponent(token)}?page=${page}`, {
          cache: "no-store", signal: controller.signal,
        });
        const json = await response.json();
        if (!response.ok || !json.success) throw new Error(json.error || "โหลดตารางไม่สำเร็จ");
        if (!controller.signal.aborted) { setData(json); setError(""); }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "โหลดตารางไม่สำเร็จ");
      }
    }
    void load();
    return () => controller.abort();
  }, [token, page, reloadKey]);

  function changePage(nextPage: number) {
    if (pending || busy) {
      if (busy || !window.confirm("มีตารางที่ยังไม่บันทึก ต้องการเปลี่ยนหน้าหรือไม่?")) return;
    }
    setPage(nextPage);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-bold">จัดตารางงานของแผนก</h1>
          {data && <p className="mt-1 text-sm text-slate-600">
            รอบ {data.period.startDate} – {data.period.endDate} · ลิงก์หมดอายุ {new Date(data.expiresAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
          </p>}
          <p className="mt-1 text-xs text-slate-500">กรอกหรือ Import Excel แล้วกดบันทึกตาราง ข้อมูลจะมีผลทันที</p>
        </header>
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-700">{error}</p>}
        {!data && !error && <p>กำลังโหลดตาราง...</p>}
        {data && !error && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ScheduleWorkspace
            key={`${page}-${reloadKey}`}
            year={data.period.year}
            month={data.period.month}
            dates={data.period.dates}
            employees={data.employees}
            schedules={data.schedules}
            filters={{}}
            shareToken={token}
            onReload={() => setReloadKey((value) => value + 1)}
            onPendingChange={setPending}
            onBusyChange={setBusy}
          />
          <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm">
            <span>พนักงาน {data.pagination.total} คน · หน้า {page}/{data.pagination.totalPages || 1}</span>
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={page <= 1 || busy} onClick={() => changePage(page - 1)}>ก่อนหน้า</button>
              <button type="button" className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={page >= data.pagination.totalPages || busy} onClick={() => changePage(page + 1)}>ถัดไป</button>
            </div>
          </div>
        </section>}
      </div>
    </main>
  );
}
