"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
} from "lucide-react";
import ScheduleWorkspace from "./components/ScheduleWorkspace";
import { downloadScheduleExcel } from "@/lib/leave-schedule-excel";

import { getDefaultScheduleMonth } from "@/lib/leave-schedule-period";

import type {
  ScheduleEmployee,
  ScheduleItem,
  ScheduleLeave,
} from "./components/ScheduleGrid";

type Metadata = {
  branches: {
    id: string;
    branch_name: string;
  }[];

  departments: {
    id: string;
    department_name: string;
  }[];

  branchDepartments: {
    id: string;
    branch_id: string;
    department_id: string;
  }[];

  divisions: {
    id: string;
    department_id: string;
    division_name: string;
  }[];

  units: {
    id: string;
    division_id: string;
    unit_name: string;
  }[];

  shifts: {
    id: string;
    name: string;
    color: string;
    definition: unknown;
  }[];
};

type ScheduleResponse = {
  period: {
    id: string | null;
    year: number;
    month: number;
    startDate: string;
    endDate: string;
    dates: string[];
  };

  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  employees: ScheduleEmployee[];
  schedules: ScheduleItem[];
  leaves: ScheduleLeave[];
};

type Filters = {
  branchId: string;
  departmentId: string;
  divisionId: string;
  unitId: string;
  keyword: string;
};

const emptyMetadata: Metadata = {
  branches: [],
  departments: [],
  branchDepartments: [],
  divisions: [],
  units: [],
  shifts: [],
};

const monthNames = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const inputClass =
  "h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-emerald-500";

function thaiDate(value: string) {
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function LeaveSchedulesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState(() =>
    getDefaultScheduleMonth(),
  );

  const [filters, setFilters] = useState<Filters>({
    branchId: "",
    departmentId: "",
    divisionId: "",
    unitId: "",
    keyword: "",
  });

  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasPending, setHasPending] = useState(false);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [metadata, setMetadata] = useState<Metadata>(emptyMetadata);

  const [data, setData] = useState<ScheduleResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [metadataError, setMetadataError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMetadata() {
      try {
        const response = await fetch("/leave/api/schedules/meta", {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || "โหลดตัวกรองไม่สำเร็จ");
        }

        if (!controller.signal.aborted) {
          setMetadata(json.data);
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setMetadataError(
            error instanceof Error ? error.message : "โหลดตัวกรองไม่สำเร็จ",
          );
        }
      }
    }

    void loadMetadata();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSchedules() {
      const params = new URLSearchParams({
        year: String(selectedPeriod.year),
        month: String(selectedPeriod.month),
        page: String(page),
        pageSize: "30",
      });

      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
      }

      try {
        const response = await fetch(`/leave/api/schedules?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
          throw new Error(json.error || "โหลดตารางงานไม่สำเร็จ");
        }

        if (!controller.signal.aborted) {
          setData(json);
          setError("");
        }
      } catch (error: unknown) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error ? error.message : "โหลดตารางงานไม่สำเร็จ",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadSchedules();

    return () => controller.abort();
  }, [selectedPeriod, filters, page, refreshKey]);

  function handleScheduleSaved() {
    setWorkspaceBusy(false);
    setHasPending(false);
    setSaveMessage("ดำเนินการเรียบร้อยแล้ว");
    setError("");
    setLoading(true);
    setRefreshKey((value) => value + 1);
  }

  async function handleDownloadExcel() {
    if (exporting || loading || workspaceBusy || error) return;

    if (hasPending) {
      window.alert("กรุณาบันทึกตารางงานก่อน Download Excel");
      return;
    }

    const filterDescription = [
      `สังกัด: ${
        metadata.branches.find((item) => item.id === filters.branchId)
          ?.branch_name || "ทั้งหมด"
      }`,

      `แผนก: ${
        metadata.departments.find((item) => item.id === filters.departmentId)
          ?.department_name || "ทั้งหมด"
      }`,

      `ฝ่าย: ${
        metadata.divisions.find((item) => item.id === filters.divisionId)
          ?.division_name || "ทั้งหมด"
      }`,

      `หน่วย: ${
        metadata.units.find((item) => item.id === filters.unitId)?.unit_name ||
        "ทั้งหมด"
      }`,

      filters.keyword ? `ค้นหา: ${filters.keyword}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      setExporting(true);

      await downloadScheduleExcel({
        year: selectedPeriod.year,
        month: selectedPeriod.month,
        filters: { ...filters },
        filterDescription,
      });
    } catch (error: unknown) {
      window.alert(
        error instanceof Error ? error.message : "Download Excel ไม่สำเร็จ",
      );
    } finally {
      setExporting(false);
    }
  }

  function canChangeView() {
    if (workspaceBusy || exporting) return false;
    if (!hasPending) return true;

    const discard = window.confirm(
      "มีตารางที่ยังไม่บันทึก ต้องการทิ้งการแก้ไขแล้วเปลี่ยนหน้าหรือไม่?",
    );

    if (discard) setHasPending(false);

    return discard;
  }

  function changeFilter(
    key: "branchId" | "departmentId" | "divisionId" | "unitId",
    value: string,
  ) {
    if (!canChangeView()) return;
    setLoading(true);
    setError("");
    setPage(1);

    setFilters((previous) => {
      const next = { ...previous, [key]: value };

      if (key === "branchId") {
        next.departmentId = "";
        next.divisionId = "";
        next.unitId = "";
      }

      if (key === "departmentId") {
        next.divisionId = "";
        next.unitId = "";
      }

      if (key === "divisionId") {
        next.unitId = "";
      }

      return next;
    });
  }

  function changePeriod(year: number, month: number) {
    if (!canChangeView()) return;
    setLoading(true);
    setError("");
    setPage(1);
    setSelectedPeriod({ year, month });
  }

  function changePage(nextPage: number) {
    if (!canChangeView()) return;
    setLoading(true);
    setError("");
    setPage(nextPage);
  }

  function changeSearch(value: string) {
    if (!canChangeView()) return;
    setLoading(true);
    setError("");
    setPage(1);

    setFilters((previous) => ({
      ...previous,
      keyword: value,
    }));
  }
  const departments = useMemo(() => {
    if (!filters.branchId) return metadata.departments;

    const ids = new Set(
      metadata.branchDepartments
        .filter((item) => item.branch_id === filters.branchId)
        .map((item) => item.department_id),
    );

    return metadata.departments.filter((item) => ids.has(item.id));
  }, [metadata, filters.branchId]);

  const divisions = useMemo(() => {
    const departmentIds = new Set(departments.map((item) => item.id));

    return metadata.divisions.filter((item) =>
      filters.departmentId
        ? item.department_id === filters.departmentId
        : departmentIds.has(item.department_id),
    );
  }, [metadata.divisions, departments, filters.departmentId]);

  const units = useMemo(() => {
    const divisionIds = new Set(divisions.map((item) => item.id));

    return metadata.units.filter((item) =>
      filters.divisionId
        ? item.division_id === filters.divisionId
        : divisionIds.has(item.division_id),
    );
  }, [metadata.units, divisions, filters.divisionId]);

  const scheduledCellCount = new Set(
    (data?.schedules || []).map(
      (item) => `${item.employeeId}:${item.workDate}`,
    ),
  ).size;

  const years = Array.from(
    { length: 7 },
    (_, index) => selectedPeriod.year - 3 + index,
  );

  const totalPages = data?.pagination.totalPages || 0;
  const pageSize = data?.pagination.pageSize || 30;
  const total = data?.pagination.total || 0;
  const firstItem = total ? (page - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div className="min-h-screen space-y-6 bg-slate-50/60 p-5 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <CalendarDays size={26} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">ตารางงาน</h1>

            <p className="mt-1 text-sm text-slate-500">
              ตารางเวลาทำงานและวันหยุด รอบวันที่ 21–20
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={
              loading ||
              workspaceBusy ||
              exporting ||
              hasPending ||
              Boolean(error) ||
              !data ||
              data.pagination.total === 0
            }
            title={
              hasPending
                ? "กรุณาบันทึกตารางก่อน Download"
                : "ส่งออกตารางที่บันทึกแล้ว ตามตัวกรองทุกหน้า"
            }
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            {exporting ? "กำลังสร้าง Excel..." : "Download Excel"}
          </button>

          <button
            type="button"
            disabled={loading || workspaceBusy || exporting}
            onClick={() => {
              if (!canChangeView()) return;

              setLoading(true);
              setError("");
              setRefreshKey((value) => value + 1);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2.5 text-sm font-bold text-slate-900 shadow-md transition hover:from-amber-500 hover:to-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} />
            รีเฟรช
          </button>
        </div>
      </header>

      {saveMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <span>{saveMessage}</span>

          <button
            type="button"
            onClick={() => setSaveMessage("")}
            className="font-semibold"
          >
            ปิด
          </button>
        </div>
      )}

      {(metadataError || error) && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {metadataError && <p>{metadataError}</p>}
          {error && <p>{error}</p>}
        </div>
      )}

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">รอบเดือน</span>

          <select
            aria-label="เดือนที่รอบสิ้นสุด"
            value={selectedPeriod.month}
            onChange={(event) =>
              changePeriod(selectedPeriod.year, Number(event.target.value))
            }
            className={inputClass}
          >
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            aria-label="ปีของรอบ"
            value={selectedPeriod.year}
            onChange={(event) =>
              changePeriod(Number(event.target.value), selectedPeriod.month)
            }
            className={inputClass}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year + 543}
              </option>
            ))}
          </select>

          {!loading && !error && data && (
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {thaiDate(data.period.startDate)}
              {" – "}
              {thaiDate(data.period.endDate)}
            </span>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <select
            aria-label="สังกัด"
            value={filters.branchId}
            onChange={(event) => changeFilter("branchId", event.target.value)}
            className={inputClass}
          >
            <option value="">ทุกสังกัด</option>
            {metadata.branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.branch_name}
              </option>
            ))}
          </select>

          <select
            aria-label="แผนก"
            value={filters.departmentId}
            onChange={(event) =>
              changeFilter("departmentId", event.target.value)
            }
            className={inputClass}
          >
            <option value="">ทุกแผนก</option>
            {departments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.department_name}
              </option>
            ))}
          </select>

          <select
            aria-label="ฝ่าย"
            value={filters.divisionId}
            onChange={(event) => changeFilter("divisionId", event.target.value)}
            className={inputClass}
          >
            <option value="">ทุกฝ่าย</option>
            {divisions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.division_name}
              </option>
            ))}
          </select>

          <select
            aria-label="หน่วย"
            value={filters.unitId}
            onChange={(event) => changeFilter("unitId", event.target.value)}
            className={inputClass}
          >
            <option value="">ทุกหน่วย</option>
            {units.map((item) => (
              <option key={item.id} value={item.id}>
                {item.unit_name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="search"
          value={filters.keyword}
          onChange={(event) => changeSearch(event.target.value)}
          placeholder="พิมพ์รหัสหรือชื่อพนักงานเพื่อค้นหา"
          aria-label="ค้นหาพนักงาน"
          className={`${inputClass} w-full`}
        />
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="font-bold text-slate-900">ตารางรายวัน</h2>

            <p className="mt-1 text-xs text-slate-500">
              {!loading && !error && data
                ? `พนักงานตามตัวกรอง ${total} คน · ${data.period.dates.length} วัน · มีตารางบันทึกแล้ว ${scheduledCellCount} ช่องในหน้านี้`
                : "กำลังอ่านข้อมูล"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-b border-slate-100 px-5 py-3 text-xs text-slate-600">
          <span>🟧 ยังไม่บันทึก</span>
          <span>🟨 ร่าง</span>
          <span>🟩 บันทึกแล้ว</span>
          <span>OFF = หยุดตามตาราง</span>
          <span>(+1) = เลิกวันถัดไป</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            กำลังโหลดตารางงาน...
          </div>
        ) : error ? (
          <div className="py-20 text-center text-sm text-rose-600">
            โหลดตารางไม่สำเร็จ กรุณากดรีเฟรช
          </div>
        ) : data ? (
          <ScheduleWorkspace
            key={`${selectedPeriod.year}-${selectedPeriod.month}-${page}-${refreshKey}`}
            year={selectedPeriod.year}
            month={selectedPeriod.month}
            dates={data.period.dates}
            employees={data.employees}
            schedules={data.schedules}
            filters={filters}
            onReload={handleScheduleSaved}
            onPendingChange={setHasPending}
            onBusyChange={setWorkspaceBusy}
          />
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
          <p className="text-xs text-slate-500">
            {loading
              ? "กำลังโหลด..."
              : `${firstItem}–${lastItem} จาก ${total} คน`}
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="หน้าก่อน"
              disabled={loading || page <= 1}
              onClick={() => changePage(page - 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs text-slate-700">
              {page} / {totalPages || 1}
            </span>

            <button
              type="button"
              aria-label="หน้าถัดไป"
              disabled={loading || totalPages === 0 || page >= totalPages}
              onClick={() => changePage(page + 1)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <p className="text-xs leading-6 text-slate-500">
        คลิกช่องเพื่อตั้งเวลาและวันหยุด แล้วกดบันทึกตาราง
        การคัดลอกและใช้เวลาเดียวกันทุกคนครอบคลุมพนักงานตามตัวกรองทุกหน้า
        ไม่มีการหักเวลาพักอัตโนมัติ
      </p>
    </div>
  );
}
