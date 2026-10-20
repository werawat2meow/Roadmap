"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";
import { AlertCircle, CheckCircle2, FileText, Upload } from "lucide-react";

interface AttendanceRow {
  sourceEmployeeCode: string;
  workDate: string;
  checkIn: string;
  checkOut: string;
}

interface ImportResult {
  totalRows: number;
  matchedRows: number;
  unmatchedRows: number;
}

const attendanceHeaders = [
  "employee_code",
  "work_date",
  "check_in",
  "check_out",
];

function normalizeWorkDate(value: unknown): string {
  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const text = String(value ?? "").trim();

  if (!text) return "";

  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) {
    const [year, month, day] = text.split("-");

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const [, month, day, year] = slashMatch;

    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function normalizeTime(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  const text = String(value ?? "").trim();

  if (!text) return "";

  const match = text.match(/^(\d{1,2}):(\d{2})/);

  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }

  return text;
}

export default function AttendancePage() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setFileName(file.name);
      setResult(null);

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: "",
          raw: true,
          range: 0,
        },
      );

      const parsedRows: AttendanceRow[] = rawRows
        .map((row) => ({
          sourceEmployeeCode: String(row.employee_code ?? "").trim(),
          workDate: normalizeWorkDate(row.work_date),
          checkIn: normalizeTime(row.check_in),
          checkOut: normalizeTime(row.check_out),
        }))
        .filter((row) => row.sourceEmployeeCode && row.workDate);

      setRows(parsedRows);

      if (parsedRows.length === 0) {
        alert(
          "ไม่พบข้อมูล กรุณาตรวจสอบว่าชื่อหัวตารางเป็น employee_code, work_date, check_in, check_out",
        );
      }
    } catch (error) {
      console.error("Read attendance file failed:", error);

      alert(
        "ไม่สามารถอ่านไฟล์ได้ กรุณาใช้ไฟล์ CSV หรือ Excel ตามรูปแบบตัวอย่าง",
      );

      setFileName("");
      setRows([]);
    }
  };

  const downloadTemplate = () => {
    const templateRows = [
      {
        employee_code: "12600013",
        work_date: "2026-10-12",
        check_in: "08:30",
        check_out: "17:30",
      },
      {
        employee_code: "12600014",
        work_date: "2026-10-12",
        check_in: "08:45",
        check_out: "17:32",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows, {
      header: attendanceHeaders,
    });

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    worksheet["!cols"] = [{ wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 12 }];

    XLSX.writeFile(workbook, "leave-attendance-template.xlsx");
  };

  const handleImport = async () => {
    if (rows.length === 0) {
      alert("กรุณาเลือกไฟล์ที่มีข้อมูลก่อน");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/leave/api/attendance/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          rows,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "นำเข้าข้อมูลไม่สำเร็จ");
      }

      setResult({
        totalRows: json.totalRows,
        matchedRows: json.matchedRows,
        unmatchedRows: json.unmatchedRows,
      });
    } catch (error: any) {
      console.error("Attendance import failed:", error);

      alert(error.message || "นำเข้าข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Upload className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                นำเข้าข้อมูลสแกนนิ้ว
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                นำเข้าข้อมูลเวลาเข้างานและเวลาออกงานจากเครื่องสแกนนิ้ว
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              เลือกไฟล์ข้อมูล
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              รองรับไฟล์ CSV และ Excel (.xlsx, .xls)
            </p>

            <button
              type="button"
              onClick={downloadTemplate}
              className="mt-5 w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              ดาวน์โหลดไฟล์ตัวอย่าง Excel
            </button>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
              <FileText className="h-10 w-10 text-slate-400" />

              <span className="mt-3 font-semibold text-slate-700">
                คลิกเพื่อเลือกไฟล์
              </span>

              <span className="mt-1 text-xs text-slate-500">
                employee_code, work_date, check_in, check_out
              </span>

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {fileName && (
              <div className="mt-4 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                ไฟล์ที่เลือก: {fileName}
              </div>
            )}

            <button
              type="button"
              onClick={handleImport}
              disabled={loading || rows.length === 0}
              className="mt-6 w-full cursor-pointer rounded-xl bg-emerald-500 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "กำลังนำเข้า..." : "นำเข้าข้อมูล"}
            </button>

            {result && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                  <FileText className="h-5 w-5" />
                  ข้อมูลทั้งหมด {result.totalRows} รายการ
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                  จับคู่ได้ {result.matchedRows} รายการ
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                  ยังจับคู่ไม่ได้ {result.unmatchedRows} รายการ
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900">
                ตัวอย่างข้อมูล
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                แสดงตัวอย่างไม่เกิน 20 รายการ จากทั้งหมด {rows.length} รายการ
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">รหัสจากไฟล์</th>
                    <th className="px-6 py-4">วันที่</th>
                    <th className="px-6 py-4">เวลาเข้า</th>
                    <th className="px-6 py-4">เวลาออก</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.slice(0, 20).map((row, index) => (
                    <tr
                      key={`${row.sourceEmployeeCode}-${row.workDate}-${index}`}
                      className="border-t border-slate-100"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {row.sourceEmployeeCode}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {row.workDate}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {row.checkIn || "-"}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {row.checkOut || "-"}
                      </td>
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-16 text-center text-slate-400"
                      >
                        ยังไม่มีข้อมูลสำหรับแสดง
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
