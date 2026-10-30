"use client";

import { useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "ready" | "history" | "review";
type Item = {
  id: number;
  employeeCode: string;
  employeeName: string;
  kind: string;
  status: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  updatedAt: string;
  source: string;
  refundError: string | null;
  canRefund: boolean;
  returnedDays: number;

  refundHistory: {
    at: string;
    days: number;
    reason: string;
    confirmation: string;
    keys: string[];
  }[];

  units: {
    key: string;
    date: string;
    session: "AM" | "PM";
  }[];
};

const labels: Record<string, string> = {
  ANNUAL: "ลาพักร้อน",
  SICK: "ลาป่วย",
  BUSINESS: "ลากิจ",
  ANNUAL_HOLIDAY: "วันหยุดประจำปี",
  BIRTHDAY: "ลาวันเกิด",
  ORDAIN: "ลาบวช",
  MATERNITY: "ลาคลอด",
  UNPAID: "ลาไม่รับค่าจ้าง",
};

export default function ManageLeaveRequestsPage() {
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState<ViewMode>("ready");

  const [counts, setCounts] = useState({
    ready: 0,
    history: 0,
    review: 0,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reload, setReload] = useState(0);

  const [rows, setRows] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selected, setSelected] = useState<Item | null>(null);
  const [keys, setKeys] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          keyword,
          view,
          page: String(page),
        });

        const response = await fetch(`/leave/api/manage-requests?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || "โหลดใบลาไม่สำเร็จ");
        }

        if (controller.signal.aborted) return;

        setRows(json.data);
        setTotalPages(json.totalPages);
        setCounts(json.counts);

        if (json.page !== page) {
          setPage(json.page);
        }
        setError("");
      } catch (error) {
        if (controller.signal.aborted) return;

        setRows([]);
        setError(
          error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [keyword, view, page, reload]);

  function open(item: Item) {
    setSelected(item);
    setKeys([]);
    setReason("");
    setConfirmation("");
    setError("");
  }

  async function refund() {
    if (!selected || saving) return;

    if (
      keys.length === 0 ||
      reason.trim().length < 3 ||
      confirmation.trim().length < 3
    ) {
      setError("เลือกช่วงคืน พร้อมระบุเหตุผลและข้อมูลยืนยันจากหัวหน้า");
      return;
    }

    const accepted = window.confirm(
      `ยืนยันคืนสิทธิ์ ${keys.length * 0.5} วัน ให้ ${selected.employeeName}?`,
    );

    if (!accepted) return;

    try {
      setSaving(true);

      const response = await fetch("/leave/api/manage-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          id: selected.id,
          expectedUpdatedAt: selected.updatedAt,
          keys,
          reason,
          confirmation,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "คืนสิทธิ์ไม่สำเร็จ");
      }

      setSelected(null);
      setPage(1);
      setError("");
      setMessage(
        `คืนสิทธิ์แล้ว ${json.returnedDays} วัน เหลือวันลา ${json.remainingDays} วัน`,
      );
      setReload((value) => value + 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : "คืนสิทธิ์ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="min-h-screen space-y-6 p-5 text-slate-900 md:p-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          จัดการใบลา / คืนสิทธิ์
        </h1>

        <p className="mt-1 text-sm font-medium text-slate-500">
          รวมใบลาจากพนักงานและรายการที่ HR บันทึก
        </p>
      </header>

      {message && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            placeholder="ค้นหารหัสหรือชื่อพนักงาน..."
            aria-label="ค้นหาพนักงาน"
            className="h-11 w-full rounded-2xl border border-transparent bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-200 focus:bg-white focus:ring-2 focus:ring-emerald-50"
          />
        </div>

        <div
          role="group"
          aria-label="กลุ่มรายการคืนสิทธิ์"
          className="flex flex-wrap items-center gap-2"
        >
          {(
            [
              {
                value: "ready",
                label: "รายการคืนสิทธิ์",
                count: counts.ready,
              },
              {
                value: "history",
                label: "ประวัติคืนสิทธิ์",
                count: counts.history,
              },
              {
                value: "review",
                label: "ต้องตรวจสอบข้อมูล",
                count: counts.review,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={view === tab.value}
              onClick={() => {
                if (view === tab.value) return;

                setView(tab.value);
                setPage(1);
                setRows([]);
                setLoading(true);
              }}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                view === tab.value
                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                  : "border-slate-100 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab.label}

              <span
                className={`rounded-lg px-2 py-0.5 text-xs ${
                  view === tab.value
                    ? "bg-white text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {[
                  "พนักงาน",
                  "ประเภทการลา",
                  "ช่วงวันที่เดิม",
                  "วันลาคงเหลือ",
                  "ที่มา",
                  view === "history"
                    ? "ประวัติคืนสิทธิ์"
                    : view === "review"
                      ? "รายละเอียดที่ต้องตรวจสอบ"
                      : "จัดการ",
                ].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className={`whitespace-nowrap px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 ${
                      [
                        "จัดการ",
                        "ประวัติคืนสิทธิ์",
                        "รายละเอียดที่ต้องตรวจสอบ",
                      ].includes(label)
                        ? "text-center"
                        : "text-left"
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center font-medium text-slate-400"
                  >
                    กำลังโหลดข้อมูลใบลา...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                      <Search size={24} aria-hidden="true" />
                    </div>
                    <p className="font-medium text-slate-500">
                      {view === "ready"
                        ? "ไม่มีใบลาที่พร้อมคืนสิทธิ์"
                        : view === "history"
                          ? "ยังไม่มีประวัติคืนสิทธิ์"
                          : "ไม่มีรายการที่ต้องตรวจสอบ"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      ลองเปลี่ยนคำค้นหาหรือกลุ่มรายการ
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-50/30"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500"
                        >
                          {item.employeeName?.trim().charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="whitespace-nowrap font-bold text-slate-700">
                            {item.employeeName}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {item.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 font-medium text-slate-600">
                      {labels[item.kind] || item.kind}
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 text-slate-500 tabular-nums">
                      {item.startDate === item.endDate ? (
                        item.startDate
                      ) : (
                        <div className="space-y-1">
                          <div>{item.startDate}</div>
                          <div className="text-xs text-slate-400">
                            ถึง {item.endDate}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex min-w-16 items-center justify-center whitespace-nowrap rounded-xl bg-cyan-50 px-3 py-1.5 font-bold text-cyan-600">
                        {item.requestedDays} วัน
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold ${item.source === "HR" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {item.source}
                      </span>
                    </td>

                    <td className="w-[280px] px-6 py-5 text-center">
                      {view === "history" ? (
                        <div className="ml-auto text-left max-w-[380px] space-y-3">
                          <div className="inline-flex rounded-xl bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-700">
                            คืนแล้วรวม {item.returnedDays} วัน
                          </div>

                          {[...item.refundHistory]
                            .reverse()
                            .map((event, index) => (
                              <div
                                key={`${item.id}:${event.at}:${index}`}
                                className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs leading-5"
                              >
                                <div className="font-semibold text-slate-700">
                                  คืน {event.days} วัน
                                </div>

                                <div className="text-slate-400">
                                  {new Date(event.at).toLocaleString("th-TH", {
                                    timeZone: "Asia/Bangkok",
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                                </div>

                                <div className="mt-2 text-slate-600">
                                  {event.keys.map((key) => {
                                    const separator = key.lastIndexOf(":");
                                    const date = key.slice(0, separator);
                                    const session = key.slice(separator + 1);

                                    return (
                                      <div key={key}>
                                        {date}
                                        {" — "}
                                        {session === "AM"
                                          ? "ช่วงเช้า"
                                          : "ช่วงบ่าย"}
                                      </div>
                                    );
                                  })}
                                </div>

                                <p className="mt-2 whitespace-pre-wrap break-words text-slate-500">
                                  เหตุผล: {event.reason}
                                </p>

                                <p className="mt-1 whitespace-pre-wrap break-words text-slate-500">
                                  ข้อมูลยืนยัน: {event.confirmation}
                                </p>
                              </div>
                            ))}
                        </div>
                      ) : view === "review" ? (
                        <div className="ml-auto max-w-[300px] rounded-xl bg-amber-50 px-3 py-2 text-left text-xs leading-5 text-amber-700">
                          <p className="font-semibold">
                            ยังคืนสิทธิ์รายการนี้ไม่ได้
                          </p>

                          <p>{item.refundError}</p>
                        </div>
                      ) : item.canRefund ? (
                        <button
                          type="button"
                          onClick={() => open(item)}
                          className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        >
                          ปรับวันลา / คืนสิทธิ์
                        </button>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4 md:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            PAGE {page} OF {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="หน้าก่อนหน้า"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => value - 1)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              aria-label="หน้าถัดไป"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => value + 1)}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-dialog-title"
            className="max-h-[90vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 shadow-xl"
          >
            <h2
              id="refund-dialog-title"
              className="text-xl font-bold tracking-tight text-slate-900"
            >
              คืนสิทธิ์ใบลา #{selected.id}
            </h2>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold text-slate-700">
                {selected.employeeName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {selected.employeeCode} ·{" "}
                {labels[selected.kind] || selected.kind}
              </p>
            </div>

            <p className="text-sm text-slate-500">
              ติ๊กช่วงที่พนักงานมาทำงานจริง ติ๊กทั้งเช้าและบ่ายเพื่อคืนเต็มวัน
            </p>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              {selected.units.map((unit) => (
                <label
                  key={unit.key}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors ${keys.includes(unit.key) ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-transparent text-slate-600 hover:bg-white"} ${saving ? "opacity-60" : "cursor-pointer"}`}
                >
                  <input
                    type="checkbox"
                    disabled={saving}
                    checked={keys.includes(unit.key)}
                    className="h-4 w-4 shrink-0 accent-emerald-600"
                    onChange={(event) => {
                      setKeys((previous) =>
                        event.target.checked
                          ? [...previous, unit.key]
                          : previous.filter((key) => key !== unit.key),
                      );
                    }}
                  />

                  {unit.date}
                  {" — "}
                  {unit.session === "AM" ? "ช่วงเช้า" : "ช่วงบ่าย"}
                  {" (0.5 วัน)"}
                </label>
              ))}
            </div>

            <div>
              <label
                htmlFor="refund-reason"
                className="mb-2 block text-sm font-semibold text-slate-600"
              >
                เหตุผลการคืนสิทธิ์
              </label>
              <textarea
                id="refund-reason"
                value={reason}
                disabled={saving}
                onChange={(event) => setReason(event.target.value)}
                placeholder="เหตุผล เช่น ยกเลิกลาเพราะมาทำงานแทน"
                maxLength={2000}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50 disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="refund-confirmation"
                className="mb-2 block text-sm font-semibold text-slate-600"
              >
                ข้อมูลยืนยันจากหัวหน้า
              </label>
              <textarea
                id="refund-confirmation"
                value={confirmation}
                disabled={saving}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="ข้อมูลยืนยันจากหัวหน้า เช่น ชื่อหัวหน้าและวันที่ยืนยัน"
                maxLength={2000}
                className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-50 disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-cyan-50 px-4 py-3 text-cyan-700">
              <span className="text-sm font-semibold">จำนวนสิทธิ์ที่จะคืน</span>
              <span className="text-lg font-bold">{keys.length * 0.5} วัน</span>
            </div>

            {error && <p className="text-sm text-rose-700">{error}</p>}

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => setSelected(null)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                disabled={saving || keys.length === 0}
                onClick={refund}
                className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "กำลังคืนสิทธิ์..." : "ยืนยันคืนสิทธิ์"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
