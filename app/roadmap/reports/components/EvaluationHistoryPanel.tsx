"use client";

import { useEffect, useMemo, useState } from "react";
import SearchBar from "@/app/roadmap/components/SearchBar";
import ReportTable from "./ReportTable";
import EvaluationPreviewModal from "./EvaluationPreviewModal";
// 1. Import library สำหรับ Excel
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type FilterState = {
  department: string;
  division: string;
  unit: string;
  level: string;
};

type EvaluationRecord = {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  branch: string;
  department: string;
  division: string;
  unit: string;
  level: string;
  evaluationType: string;
  latestDate: string;
  score: number | null;
  status: string;
  evaluationCount: number;
  scorePercent: string;
};

export default function EvaluationHistoryPanel({
  evaluationType,
}: {
  evaluationType: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    department: "",
    division: "",
    unit: "",
    level: "",
  });
  const [rows, setRows] = useState<EvaluationRecord[]>([]);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // ... (useMemo ส่วน branches, departments, etc. คงไว้เหมือนเดิม)
  const branches = useMemo(
    () => [...new Set(rows.map((row) => row.branch).filter(Boolean))],
    [rows],
  );
  const departments = useMemo(
    () => [...new Set(rows.map((row) => row.department).filter(Boolean))],
    [rows],
  );
  const divisions = useMemo(
    () => [...new Set(rows.map((row) => row.division).filter(Boolean))],
    [rows],
  );
  const units = useMemo(
    () => [...new Set(rows.map((row) => row.unit).filter(Boolean))],
    [rows],
  );
  const levels = useMemo(
    () => [...new Set(rows.map((row) => row.level).filter(Boolean))],
    [rows],
  );
  const items = useMemo(
    () =>
      rows.map((row) => ({
        branch: row.branch || "",
        department: row.department || "",
        division: row.division || "",
        unit: row.unit || "",
        level: row.level || "",
      })),
    [rows],
  );

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/roadmap/api/reports/evaluation-history?type=${evaluationType}`,
      );
      const json = await res.json();
      if (json.success) setRows(json.data || []);
    }
    load();
  }, [evaluationType]);

  const handlePreview = async (record: EvaluationRecord) => {
    setIsLoadingPreview(true);
    const res = await fetch(
      `/roadmap/api/reports/evaluation-preview?id=${encodeURIComponent(record.id)}`,
    );
    const json = await res.json();
    if (json.success) {
      setPreviewData(json.data);
      setIsPreviewOpen(true);
    }
    setIsLoadingPreview(false);
  };

  const columns: {
    header: string;
    key: string;
    align: "left" | "center" | "right";
  }[] = [
    { header: "พนักงาน", key: "name", align: "center" },
    { header: "สังกัด", key: "branch", align: "center" },
    { header: "แผนก", key: "department", align: "center" },
    { header: "ฝ่าย", key: "division", align: "center" },
    { header: "หน่วย", key: "unit", align: "center" },
    { header: "Level", key: "level", align: "center" },
    { header: "คะแนน", key: "scorePercent", align: "center" },
    { header: "สถานะ", key: "status", align: "center" },
    { header: "Actions", key: "actions", align: "center" },
  ];

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = row.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDepartment = filters.department
        ? row.department === filters.department
        : true;
      const matchesDivision = filters.division
        ? row.division === filters.division
        : true;
      const matchesUnit = filters.unit ? row.unit === filters.unit : true;
      const matchesLevel = filters.level ? row.level === filters.level : true;
      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDivision &&
        matchesUnit &&
        matchesLevel
      );
    });
  }, [rows, searchTerm, filters]);

  // --- ฟังก์ชัน Export เป็น Excel ---
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Roadmap Report");

    // --- 1. เตรียมข้อมูลวันที่ ---
    const thaiMonth = new Intl.DateTimeFormat("th-TH", {
      month: "long",
    }).format(new Date());
    const thaiYear = new Date().getFullYear() + 543;

    // --- 2. สร้างหัวข้อใหญ่ (Row 1) ---
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `รายการปรับ Road Map ประจำเดือน${thaiMonth} ${thaiYear}`;
    titleCell.font = { name: "Sarabun", size: 16, bold: true };
    worksheet.mergeCells("A1:Y1"); // รวมเซลล์ข้ามคอลัมน์ทั้งหมด

    // --- 3. สร้างหัวกลุ่ม (Row 2) ---
    const row2 = worksheet.getRow(2);
    row2.values = [
      "ลำดับ",
      "ข้อมูลผู้ขอปรับ",
      "",
      "",
      "",
      "",
      "",
      "เงินเดือนปัจจุบัน",
      "",
      "",
      "",
      "",
      "",
      "",
      "เงินเดือนใหม่",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "ครั้งที่",
      "หมายเหตุ",
    ];

    // --- 4. สร้างหัวย่อย (Row 3) ---
    const row3 = worksheet.getRow(3);
    row3.values = [
      "",
      "รหัส",
      "ผู้ขอปรับ",
      "แผนก",
      "ชื่อ-สกุล",
      "สังกัด",
      "ตำแหน่ง",
      "ระดับเดิม",
      "เงินเดือนเดิม",
      "ค่าตำแหน่งเดิม",
      "ค่าครองชีพเดิม",
      "ค่าพาหนะเดิม",
      "ค่าเบี้ยเลี้ยงเดิม",
      "ยอดปรับเดิม",
      "ประเภท",
      "ตำแหน่งใหม่",
      "ระดับใหม่",
      "เงินเดือนใหม่",
      "ค่าตำแหน่งใหม่",
      "ค่าครองชีพใหม่",
      "ค่าพาหนะใหม่",
      "ค่าเบี้ยเลี้ยงใหม่",
      "รวมปรับ",
      "",
      "",
    ];

    // --- 5. การ Merge เซลล์หัวตาราง ---
    worksheet.mergeCells("A2:A3"); // ลำดับ
    worksheet.mergeCells("B2:G2"); // ข้อมูลผู้ขอปรับ
    worksheet.mergeCells("H2:N2"); // เงินเดือนปัจจุบัน
    worksheet.mergeCells("O2:W2"); // เงินเดือนใหม่
    worksheet.mergeCells("X2:X3"); // ครั้งที่
    worksheet.mergeCells("Y2:Y3"); // หมายเหตุ

    // --- 6. ใส่ข้อมูลจาก filteredRows ---
    filteredRows.forEach((row, index) => {
      worksheet.addRow([
        index + 1,
        row.employeeId || "H01", // ตัวอย่างรหัส
        "คุณโอ / ผู้จัดการ", // ตัวอย่างผู้ขอปรับ
        row.department || "",
        row.name || "",
        row.branch || "",
        "Executive Chef", // ตัวอย่างตำแหน่ง
        row.level || "P2",
        "",
        "",
        "",
        "1,000",
        "",
        "45,000", // เงินปัจจุบัน
        "Partition", // ประเภท
        "",
        "P7", // ระดับใหม่
        "",
        "",
        "",
        "",
        "",
        "46,000", // เงินใหม่
        index + 1, // ครั้งที่
        "", // หมายเหตุ
      ]);
    });

    // --- 7. จัดสไตล์ (สี, เส้นขอบ, จัดวาง) ---
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        // ใส่เส้นขอบทุกเซลล์
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.font = { name: "Sarabun", size: 10 };

        // สไตล์สำหรับ Header (Row 2 & 3)
        if (rowNumber === 2 || rowNumber === 3) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE7E6E6" }, // สีเทาอ่อนพื้นฐาน
          };
          cell.font = { bold: true, name: "Sarabun" };

          // สีฟ้าอ่อนสำหรับกลุ่มเงินเดือนใหม่
          if (colNumber >= 15 && colNumber <= 23) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFDDEBF7" },
            };
          }
          // สีเขียวสำหรับ "ครั้งที่"
          if (colNumber === 24) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF2E7D32" },
            };
            cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          }
          // สีเหลืองสำหรับ "หมายเหตุ"
          if (colNumber === 25) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFEB3B" },
            };
          }
        }

        // สีเขียวในคอลัมน์ "ครั้งที่" ของแถวข้อมูล
        if (rowNumber > 3 && colNumber === 24) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4CAF50" },
          };
          cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
        }
      });
    });

    // กำหนดความกว้างคอลัมน์
    worksheet.getColumn(5).width = 25; // ชื่อ-สกุล
    worksheet.getColumn(4).width = 15; // แผนก
    worksheet.getColumn(25).width = 20; // หมายเหตุ

    // --- 8. บันทึกไฟล์ ---
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Roadmap-Report-${thaiMonth}-${thaiYear}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            ประวัติการประเมิน {evaluationType}
          </h2>
          <p className="text-sm text-slate-500">แสดงพนักงานที่ถูกประเมินแล้ว</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* เปลี่ยนปุ่มเป็น Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Export Excel
          </button>

          <SearchBar
            placeholder="ค้นหาชื่อพนักงาน..."
            onSearch={setSearchTerm}
            onFilter={setFilters}
            filterOptions={{
              branches,
              departments,
              divisions,
              units,
              levels,
              statuses: ["Active", "On Leave"],
              items,
            }}
          />
        </div>
      </div>

      <ReportTable
        columns={columns}
        rows={filteredRows.map((row) => ({
          ...row,
          actions: (
            <button
              className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 active:from-amber-600 active:to-yellow-600 text-amber-950 text-xs font-semibold px-4 py-2 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => handlePreview(row)}
              disabled={isLoadingPreview}
            >
              Preview
            </button>
          ),
        }))}
      />

      <EvaluationPreviewModal
        open={isPreviewOpen}
        data={previewData}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
