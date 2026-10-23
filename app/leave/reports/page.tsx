"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { AttendanceAssessment } from "@/lib/leave-attendance-assessment";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Search,
  Users,
  XCircle,
} from "lucide-react";

interface AttendanceItem {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface ExportEmployee {
  dailyResults: AttendanceAssessment[];
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  division: string;
  unit: string;
  weeklyHoliday: string;
  workStartTime: string;
  workEndTime: string;
  attendance: AttendanceItem[];
}

interface ReportRow {
  id: number;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  division: string;
  unit: string;
  weeklyHoliday: string;
  workStartTime: string;
  workEndTime: string;
  attendance: AttendanceItem[];
  kind: string;
  kindLabel: string;
  startDate: string;
  endDate: string;
  session: string;
  requestedDays: number;
  status: string;
  statusLabel: string;
  approverName: string;
  reason: string;
  source: string;
  createdAt: string;
}

interface ReportSummary {
  employeeCount: number;
  requestCount: number;
  totalDays: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

interface SummaryItem {
  kind?: string;
  label?: string;
  name?: string;
  count?: number;
  days?: number;
  employeeCount?: number;
  requestCount?: number;
  totalDays?: number;
}

interface OptionItem {
  value: string;
  label: string;
}

const leaveKindOptions = [
  { value: "", label: "ประเภททั้งหมด" },
  { value: "ANNUAL", label: "ลาพักร้อน" },
  { value: "SICK", label: "ลาป่วย" },
  { value: "BUSINESS", label: "ลากิจ" },
  { value: "ANNUAL_HOLIDAY", label: "วันหยุดประจำปี" },
  { value: "BIRTHDAY", label: "ลาวันเกิด" },
  { value: "ORDAIN", label: "ลาบวช" },
  { value: "MATERNITY", label: "ลาคลอด" },
  { value: "UNPAID", label: "ลาไม่รับค่าจ้าง" },
];

const statusOptions = [
  { value: "", label: "สถานะทั้งหมด" },
  { value: "PENDING", label: "รออนุมัติ" },
  { value: "APPROVED", label: "อนุมัติแล้ว" },
  { value: "REJECTED", label: "ไม่อนุมัติ" },
];

const sourceOptions = [
  { value: "", label: "แหล่งที่มาทั้งหมด" },
  { value: "system", label: "จากระบบ" },
  { value: "paper", label: "HR บันทึกย้อนหลัง" },
];

const leaveColorMap: Record<string, string> = {
  SICK: "#fecaca",
  BUSINESS: "#fed7aa",
  ANNUAL: "#fbcfe8",
  ANNUAL_HOLIDAY: "#fde68a",
  BIRTHDAY: "#bae6fd",
  ORDAIN: "#fdba74",
  MATERNITY: "#ddd6fe",
  UNPAID: "#d1d5db",
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // เริ่มวันที่ 21 ของเดือนที่แล้ว
  const fromDate = new Date(year, month - 1, 21);

  // สิ้นสุดวันที่ 20 ของเดือนปัจจุบัน
  const toDate = new Date(year, month, 20);

  return {
    from: formatDateInput(fromDate),
    to: formatDateInput(toDate),
  };
}

function toDateOnly(value: string) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() + 7 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function parseDateOnly(value: string) {
  const dateOnly = toDateOnly(value);

  if (!dateOnly) return null;

  const [year, month, day] = dateOnly.split("-").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRangeColumns(fromDate: string, toDate: string) {
  const start = parseDateOnly(fromDate);
  const end = parseDateOnly(toDate);

  if (!start || !end) return [];
  if (start > end) return [];

  const dates: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function formatDayHeader(date: Date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${month}/${day}`;
}

function formatThaiDate(date: string) {
  if (!date) return "-";

  const parsed = parseDateOnly(date);

  if (!parsed) return date;

  return parsed.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateRange(startDate: string, endDate: string) {
  if (startDate === endDate) return formatThaiDate(startDate);

  return `${formatThaiDate(startDate)} - ${formatThaiDate(endDate)}`;
}

function formatDateForExcel(value: string) {
  const parsed = parseDateOnly(value);

  if (!parsed) return value;

  const month = parsed.getMonth() + 1;
  const day = parsed.getDate();
  const year = parsed.getFullYear();

  return `${month}/${day}/${year}`;
}

function getStatusClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-600";
  if (status === "REJECTED") return "bg-rose-50 text-rose-600";

  return "bg-amber-50 text-amber-600";
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatExcelAttendanceCell(item: AttendanceAssessment) {
  let text = "-";
  let background = "#ffffff";
  let color = "#111827";

  const hasScan = Boolean(item.checkIn || item.checkOut);
  const notes = [...item.warnings];

  const shortLabels: Record<string, string> = {
    ANNUAL: "AL",
    SICK: "SL",
    BUSINESS: "PL",
    ANNUAL_HOLIDAY: "PH",
    BIRTHDAY: "BD",
    ORDAIN: "OR",
    MATERNITY: "MT",
    UNPAID: "LWP",
  };

  const fullLabels: Record<string, string> = {
    ANNUAL: "ลาพักร้อน",
    SICK: "ลาป่วย",
    BUSINESS: "ลากิจ",
    ANNUAL_HOLIDAY: "วันหยุดประจำปี",
    BIRTHDAY: "ลาวันเกิด",
    ORDAIN: "ลาบวช",
    MATERNITY: "ลาคลอด",
    UNPAID: "ลาไม่รับค่าจ้าง",
  };

  // ใบลาอนุมัติมีผลก่อนวันหยุดและสแกน
  if (item.leaveKinds.length > 0) {
    text = item.text;

    for (const kind of item.leaveKinds) {
      if (fullLabels[kind]) {
        text = text.split(fullLabels[kind]).join(shortLabels[kind]);
      }
    }

    text = text
      .replace(/ เต็มวัน/g, "")
      .replace(/ครึ่งวันเช้า/g, "0.5 เช้า")
      .replace(/ครึ่งวันบ่าย/g, "0.5 บ่าย");

    background = leaveColorMap[item.leaveKinds[0]] || "#e5e7eb";

    if (item.leaveDays === null) {
      notes.push("ตรวจสอบจำนวนวันลาก่อนสรุปยอด");
    }
  } else if (item.scheduledType === "OFF") {
    text = "OFF";
    background = "#7f1d1d";
    color = "#ffffff";
  } else if (!hasScan) {
    text = "-";
  } else if (item.lateMinutes !== null && item.earlyMinutes !== null) {
    const messages: string[] = [];

    if (item.lateMinutes > 0) {
      messages.push(`สาย ${item.lateMinutes} นาที`);
    }

    if (item.earlyMinutes > 0) {
      messages.push(`ออกก่อน ${item.earlyMinutes} นาที`);
    }

    if (messages.length === 0) {
      // ออกเกินเวลาไม่ถือว่าออกก่อน จึงยังเป็น ✓
      text = "✓";
      background = "#dcfce7";
      color = "#15803d";
    } else {
      text = messages.join(" / ");

      if (item.lateMinutes > 0) {
        background = "#fed7aa";
        color = "#9a3412";
      } else {
        background = "#ddd6fe";
        color = "#5b21b6";
      }
    }
  } else {
    // เช่น สแกนไม่ครบ ไม่มีตาราง หรือกะที่ยังประเมินไม่ได้
    text = "ตรวจสอบ";
    background = "#fef3c7";
    notes.push(item.text);
  }

  const uniqueNotes = [...new Set(notes)];

  return {
    text: text + (uniqueNotes.length > 0 ? " *" : ""),
    background,
    color,
    notes: uniqueNotes,
  };
}

export default function LeaveReportsPage() {
  const monthRange = useMemo(() => getCurrentMonthRange(), []);

  const [from, setFrom] = useState(monthRange.from);
  const [to, setTo] = useState(monthRange.to);
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const [department, setDepartment] = useState("");
  const [division, setDivision] = useState("");
  const [unit, setUnit] = useState("");

  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");

  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<ReportSummary>({
    employeeCount: 0,
    requestCount: 0,
    totalDays: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
  });

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [exportEmployees, setExportEmployees] = useState<ExportEmployee[]>([]);
  const [leaveTypeSummary, setLeaveTypeSummary] = useState<SummaryItem[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<SummaryItem[]>([]);

  const [departmentOptions, setDepartmentOptions] = useState<OptionItem[]>([]);
  const [divisionOptions, setDivisionOptions] = useState<OptionItem[]>([]);
  const [unitOptions, setUnitOptions] = useState<OptionItem[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));

  const currentRows = rows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [keyword]);

  useEffect(() => {
    let ignore = false;

    async function run() {
      // รอให้เลือกช่วงวันที่ถูกต้องก่อน ไม่เรียก API หรือเด้งแจ้งเตือน
      if (!from || !to || from > to) {
        setLoading(false);
        setExportEmployees([]);
        return;
      }

      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (from) params.set("from", from);
        if (to) params.set("to", to);

        if (debouncedKeyword.trim()) {
          params.set("keyword", debouncedKeyword.trim());
        }

        if (department) params.set("department", department);
        if (division) params.set("division", division);
        if (unit) params.set("unit", unit);

        if (kind) params.set("kind", kind);
        if (status) params.set("status", status);
        if (source) params.set("source", source);

        const res = await fetch(`/leave/api/reports?${params.toString()}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "โหลดรายงานการลาไม่สำเร็จ");
        }

        if (ignore) return;

        setSummary(json.summary);
        setRows(json.data || []);
        setExportEmployees(json.employees || []);
        setLeaveTypeSummary(json.leaveTypeSummary || []);
        setDepartmentSummary(json.departmentSummary || []);

        setDepartmentOptions(json.filterOptions?.departments || []);
        setDivisionOptions(json.filterOptions?.divisions || []);
        setUnitOptions(json.filterOptions?.units || []);

        setCurrentPage(1);
      } catch (error: any) {
        if (ignore) return;

        setExportEmployees([]);
        console.error("Load leave reports failed:", error);
        alert(error.message || "โหลดรายงานการลาไม่สำเร็จ");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      ignore = true;
    };
  }, [
    from,
    to,
    debouncedKeyword,
    department,
    division,
    unit,
    kind,
    status,
    source,
  ]);

  const clearFilters = () => {
    setFrom(monthRange.from);
    setTo(monthRange.to);
    setKeyword("");
    setDepartment("");
    setDivision("");
    setUnit("");
    setKind("");
    setStatus("");
    setSource("");
  };

  const exportExcel = () => {
    if (loading || exportEmployees.length === 0) {
      alert("ไม่พบข้อมูลพร้อมส่งออก กรุณารอให้โหลดรายงานสำเร็จ");
      return;
    }
    const dateColumns = getDateRangeColumns(from, to);
    if (dateColumns.length === 0) {
      alert("กรุณาเลือกช่วงวันที่ให้ถูกต้อง");
      return;
    }
    const expectedDates = dateColumns.map(getDateKey);
    const incomplete = exportEmployees.some((employee) => {
      const available = new Set(
        (employee.dailyResults || []).map((item) => item.workDate),
      );
      return expectedDates.some((date) => !available.has(date));
    });
    if (incomplete) {
      alert("ผลตรวจรายวันยังไม่ครบ กรุณาโหลดรายงานใหม่ก่อนส่งออก");
      return;
    }
    const headerCells = [
      "รหัสพนักงาน",
      "ชื่อพนักงาน",
      "แผนก",
      "ฝ่าย",
      "หน่วย",
      ...dateColumns.map(formatDayHeader),
      "รวมวันลาอนุมัติ",
    ];
    const legend = `
  <table class="legend">
    <tr>
      <td style="background:#fecaca;">SL ลาป่วย</td>
      <td style="background:#fed7aa;">PL ลากิจ</td>
      <td style="background:#fbcfe8;">AL ลาพักร้อน</td>
      <td style="background:#fde68a;">PH วันหยุดประจำปี</td>
      <td style="background:#bae6fd;">BD ลาวันเกิด</td>
      <td style="background:#fdba74;">OR ลาบวช</td>
      <td style="background:#ddd6fe;">MT ลาคลอด</td>
      <td style="background:#d1d5db;">LWP ลาไม่รับค่าจ้าง</td>
      <td style="background:#7f1d1d;color:#ffffff;">OFF วันหยุดตามตาราง</td>
    </tr>
  </table>

  <div class="subtitle">
    ✓ = เข้า–ออกตามเวลา /
    - = ไม่มีข้อมูลสแกน /
    * = มีหมายเหตุใต้ตาราง
  </div>
`;
    const reportNotes: string[] = [];
    const detailRows = exportEmployees
      .map((employee) => {
        const dayMap = new Map(
          employee.dailyResults.map((item) => [item.workDate, item]),
        );
        let totalLeave = 0;
        let needsLeaveReview = false;
        const dayCells = expectedDates
          .map((date) => {
            const item = dayMap.get(date)!;
            if (item.leaveDays === null) needsLeaveReview = true;
            else totalLeave += item.leaveDays;
            const cell = formatExcelAttendanceCell(item);

            if (cell.notes.length > 0) {
              reportNotes.push(`
    <tr>
      <td>${htmlEscape(employee.employeeCode)}</td>
      <td>${htmlEscape(employee.employeeName)}</td>
      <td>${htmlEscape(date)}</td>
      <td style="white-space:normal;">
        ${cell.notes.map(htmlEscape).join("<br/>")}
      </td>
    </tr>
  `);
            }

            return `
  <td
    class="day"
    style="
      background:${cell.background};
      color:${cell.color};
      text-align:center;
      font-weight:700;
      white-space:nowrap;
    "
  >
    ${htmlEscape(cell.text)}
  </td>
`;
          })
          .join("");
        const totalText = needsLeaveReview
          ? totalLeave + " + รอตรวจสอบวันลา"
          : String(totalLeave);
        return (
          `<tr><td style='mso-number-format:"\\@";'>` +
          htmlEscape(employee.employeeCode) +
          "</td>" +
          "<td>" +
          htmlEscape(employee.employeeName) +
          "</td>" +
          "<td>" +
          htmlEscape(employee.department) +
          "</td>" +
          "<td>" +
          htmlEscape(employee.division) +
          "</td>" +
          "<td>" +
          htmlEscape(employee.unit) +
          "</td>" +
          dayCells +
          '<td class="total">' +
          htmlEscape(totalText) +
          "</td></tr>"
        );
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Calibri, Arial, sans-serif;
            }

            .title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .subtitle {
              font-size: 12px;
              margin-bottom: 12px;
            }

            table {
              border-collapse: collapse;
              width: 100%;
            }

            th {
              background: #fde68a;
              color: #111827;
              font-weight: bold;
              border: 1px solid #000;
              padding: 6px;
              text-align: center;
              white-space: nowrap;
            }

            td {
              border: 1px solid #000;
              padding: 4px 6px;
              font-size: 11px;
              white-space: nowrap;
              vertical-align: middle;
            }

            .day {
              text-align: center;
              font-weight: bold;
              min-width: 45px;
            }

            .ok {
              color: #16a34a;
              background: #ffffff;
            }

            .leave {
              color: #111827;
            }

            .total {
              text-align: center;
              font-weight: bold;
              background: #e0f2fe;
            }

            .legend {
              margin: 12px 0;
              width: auto;
            }

            .legend td {
              font-size: 12px;
              font-weight: bold;
              text-align: center;
            }

            .legend-title {
              background: #e5e7eb;
            }

            .section-title {
              margin-top: 18px;
              margin-bottom: 8px;
              font-size: 15px;
              font-weight: bold;
            }

            .weekly-off {
              background: #7f1d1d;
              color: #ffffff;
              font-weight: 700;
            }
          </style>
        </head>

        <body>
          <div class="title">รายงานการลา</div>
          <div class="subtitle">
            ช่วงวันที่ ${htmlEscape(formatDateForExcel(from))} - ${htmlEscape(formatDateForExcel(to))}
          </div>

          ${legend}

          <div class="section-title">ตารางสรุปรายวัน</div>
          <table>
            <thead>
              <tr>
                ${headerCells.map((header) => `<th>${htmlEscape(header)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${detailRows}
            </tbody>
          </table>
          ${
            reportNotes.length > 0
              ? `
      <div class="section-title">หมายเหตุรายการ *</div>

      <table>
        <thead>
          <tr>
            <th>รหัสพนักงาน</th>
            <th>ชื่อพนักงาน</th>
            <th>วันที่</th>
            <th>รายละเอียด</th>
          </tr>
        </thead>

            <tbody>
              ${reportNotes.join("")}
            </tbody>
          </table>
        `
              : ""
          }
        </body>
      </html>
    `;

    const blob = new Blob(["\uFEFF" + html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `leave-report-${from || "all"}-${to || "all"}.xls`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="w-full min-h-screen p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Reports
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            รายงานการลาของพนักงาน — ค้นหา กรองข้อมูล และส่งออก Excel
          </p>
        </div>

        <button
          onClick={exportExcel}
          className="flex items-center cursor-pointer gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-green-800"
        >
          <Download size={18} />
          ส่งออก Excel
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="พนักงานที่ลา"
          value={`${summary.employeeCount} คน`}
          icon={<Users size={26} />}
          iconClass="bg-cyan-50 text-cyan-500"
        />

        <SummaryCard
          label="รายการลาทั้งหมด"
          value={`${summary.requestCount} รายการ`}
          icon={<FileSpreadsheet size={26} />}
          iconClass="bg-indigo-50 text-indigo-500"
        />

        <SummaryCard
          label="จำนวนวันลารวม"
          value={`${summary.totalDays} วัน`}
          icon={<CalendarDays size={26} />}
          iconClass="bg-emerald-50 text-emerald-500"
        />

        <SummaryCard
          label="รออนุมัติ"
          value={`${summary.pendingCount} รายการ`}
          icon={<Clock size={26} />}
          iconClass="bg-amber-50 text-amber-500"
        />
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ตัวกรองรายงาน
            </h2>
            <p className="text-xs font-medium text-slate-500">
              เลือกตัวกรองแล้วระบบจะอัปเดตรายงานให้อัตโนมัติ
            </p>
          </div>

          <button
            onClick={clearFilters}
            className="rounded-xl cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:from-amber-500 hover:to-yellow-600 hover:shadow-lg active:scale-95"
          >
            ล้างตัวกรอง
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
          <div className="xl:col-span-2">
            <InputBox
              label="วันที่เริ่ม"
              type="date"
              value={from}
              onChange={setFrom}
            />
          </div>

          <div className="xl:col-span-2">
            <InputBox
              label="วันที่สิ้นสุด"
              type="date"
              value={to}
              onChange={setTo}
            />
          </div>

          <div className="xl:col-span-4">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
              ค้นหาพนักงาน
            </label>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <Search size={16} className="text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="ชื่อหรือรหัสพนักงาน..."
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="xl:col-span-2">
            <SelectBox
              label="แผนก"
              value={department}
              onChange={setDepartment}
              options={[{ value: "", label: "ทุกแผนก" }, ...departmentOptions]}
            />
          </div>

          <div className="xl:col-span-2">
            <SelectBox
              label="ฝ่าย"
              value={division}
              onChange={setDivision}
              options={[{ value: "", label: "ทุกฝ่าย" }, ...divisionOptions]}
            />
          </div>

          <div className="xl:col-span-2">
            <SelectBox
              label="หน่วย"
              value={unit}
              onChange={setUnit}
              options={[{ value: "", label: "ทุกหน่วย" }, ...unitOptions]}
            />
          </div>

          <div className="xl:col-span-2">
            <SelectBox
              label="ประเภทการลา"
              value={kind}
              onChange={setKind}
              options={leaveKindOptions}
            />
          </div>

          <div className="xl:col-span-2">
            <SelectBox
              label="สถานะ"
              value={status}
              onChange={setStatus}
              options={statusOptions}
            />
          </div>

          <div className="xl:col-span-2">
            <SelectBox
              label="แหล่งที่มา"
              value={source}
              onChange={setSource}
              options={sourceOptions}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_1fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            สรุปตามประเภทการลา
          </h3>
          <p className="mb-4 text-sm text-slate-500">
            รวมจำนวนรายการและจำนวนวันตามตัวกรอง
          </p>

          <div className="space-y-3">
            {leaveTypeSummary.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-slate-400">
                ไม่มีข้อมูล
              </p>
            ) : (
              leaveTypeSummary.map((item) => (
                <div
                  key={item.kind}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs font-semibold text-slate-400">
                      {item.count} รายการ
                    </p>
                  </div>
                  <p className="text-xl font-extrabold text-emerald-500">
                    {item.days} วัน
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-900">สรุปตามแผนก</h3>
            <p className="text-sm text-slate-500">
              ดูว่าแผนกไหนมีรายการลามากที่สุดในช่วงที่เลือก
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  <TableHead>แผนก</TableHead>
                  <TableHead align="center">พนักงานที่ลา</TableHead>
                  <TableHead align="center">รายการลา</TableHead>
                  <TableHead align="right">จำนวนวัน</TableHead>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departmentSummary.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-sm font-semibold text-slate-400"
                    >
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                ) : (
                  departmentSummary.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-50/60">
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">
                        {item.employeeCount} คน
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-600">
                        {item.requestCount} รายการ
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-500">
                        {item.totalDays} วัน
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              รายการลาทั้งหมด
            </h3>
            <p className="text-sm text-slate-500">
              แสดง {rows.length} รายการ ตามตัวกรองที่เลือก
            </p>
          </div>

          <div className="flex gap-2">
            <StatusPill
              icon={<CheckCircle2 size={16} />}
              label={`อนุมัติแล้ว ${summary.approvedCount}`}
              className="bg-emerald-50 text-emerald-600"
            />

            <StatusPill
              icon={<Clock size={16} />}
              label={`รออนุมัติ ${summary.pendingCount}`}
              className="bg-amber-50 text-amber-600"
            />

            <StatusPill
              icon={<XCircle size={16} />}
              label={`ไม่อนุมัติ ${summary.rejectedCount}`}
              className="bg-rose-50 text-rose-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                <TableHead>พนักงาน</TableHead>
                <TableHead>หน่วยงาน</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>วันที่ลา</TableHead>
                <TableHead align="center">วัน</TableHead>
                <TableHead align="center">สถานะ</TableHead>
                <TableHead>ผู้อนุมัติ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-sm font-semibold text-slate-400"
                  >
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : currentRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-sm font-semibold text-slate-400"
                  >
                    ไม่มีรายการลาในช่วงที่เลือก
                  </td>
                </tr>
              ) : (
                currentRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {row.employeeName || "-"}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">
                        {row.employeeCode || "-"}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">
                        {row.department}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">
                        {row.division} / {row.unit}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-600">
                        {row.kindLabel}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {formatDateRange(row.startDate, row.endDate)}
                    </td>

                    <td className="px-6 py-4 text-center font-bold text-slate-800">
                      {row.requestedDays}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(row.status)}`}
                      >
                        {row.statusLabel}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                      {row.approverName}
                    </td>

                    <td className="max-w-[260px] px-6 py-4">
                      <p className="truncate text-sm font-semibold text-slate-500">
                        {row.reason || "-"}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {row.source}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Page {currentPage} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ←
            </button>

            <button
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <h3 className="mt-2 text-3xl font-extrabold text-slate-900">{value}</h3>
      </div>

      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClass}`}
      >
        {icon}
      </div>
    </div>
  );
}

function InputBox({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
      />
    </div>
  );
}

function SelectBox({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionItem[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
      >
        {options.map((item) => (
          <option key={`${label}-${item.value}`} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  const alignClass =
    align === "center"
      ? "text-center"
      : align === "right"
        ? "text-right"
        : "text-left";

  return (
    <th
      className={`px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 ${alignClass}`}
    >
      {children}
    </th>
  );
}

function StatusPill({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  return (
    <span
      className={`hidden items-center gap-1 rounded-full px-3 py-1 text-xs font-bold md:flex ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
