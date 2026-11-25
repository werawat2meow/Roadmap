"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { AlertTriangle, Check, ClipboardCheck, Clock3, Download, Search, X } from "lucide-react";

type ChecklistItem = {
  key: string;
  label: string;
  phase: "before" | "after";
  applicability: "required" | "conditional" | "not_applicable";
  status: "not_started" | "in_progress" | "passed" | "failed" | "pending_structure" | "not_applicable";
  note: string;
  checkedAt?: string | null;
};

type ChecklistRecord = {
  id: string;
  employeeCode: string;
  employeeName: string;
  nickname: string;
  department: string;
  evaluationType: string | null;
  evaluationStatus: "Submitted" | "Completed";
  approvedAt: string | null;
  company?: string;
  evaluatorName?: string;
  position?: string;
  level?: string;
  hireDate?: string | null;
  salaryEffectiveMonth?: string | null;
  evaluationDays?: string | number | null;
  currentPosition?: string;
  currentLevel?: string;
  currentSalary?: number | null;
  positionAllowance?: string | number;
  livingAllowance?: string | number;
  specialAllowance?: string | number;
  fuelAllowance?: string | number;
  currentTotalSalary?: string | number;
  newDesignation?: string;
  newLevel?: string;
  newSalary?: number | null;
  newPositionAllowance?: string | number;
  newLivingAllowance?: string | number;
  newSpecialAllowance?: string | number;
  newFuelAllowance?: string | number;
  newTotalSalary?: string | number;
  salaryIncrease?: string | number;
  salaryDecrease?: string | number;
  examScore?: number | null;
  disciplineScore?: string | number;
  bankName?: string;
  accountNumber?: string;
  approvalNote?: string;
  totalScore: number | null;
  maxScore: number | null;
  grade: string | null;
  checklist: ChecklistItem[];
};

const statusOptions = [
  { value: "not_started", label: "ยังไม่ตรวจ" },
  { value: "in_progress", label: "กำลังดำเนินการ" },
  { value: "passed", label: "ผ่าน" },
  { value: "failed", label: "ไม่ผ่าน" },
  { value: "pending_structure", label: "รอโครงสร้างข้อสอบ" },
  { value: "not_applicable", label: "ไม่เข้าเงื่อนไข" },
];

const statusLabels: Record<string, string> = {
  not_started: "ยังไม่ตรวจ",
  in_progress: "กำลังดำเนินการ",
  passed: "ผ่าน",
  failed: "ไม่ผ่าน",
  pending_structure: "รอโครงสร้างข้อสอบ",
  not_applicable: "ไม่เข้าเงื่อนไข",
};

function getProgress(record: ChecklistRecord) {
  // Progress is for the whole checklist. The evaluation status controls which
  // phase can be edited, but it must not hide already completed items from the
  // summary after Management changes the evaluation to Completed.
  const applicable = record.checklist.filter((item) => item.status !== "not_applicable");
  const passed = applicable.filter((item) => item.status === "passed").length;
  return { passed, total: applicable.length };
}

function getRecordStatus(record: ChecklistRecord) {
  const applicableItems = record.checklist.filter((item) => item.status !== "not_applicable");
  const { passed, total } = getProgress(record);
  if (applicableItems.some((item) => item.status === "failed")) return "failed";
  if (total > 0 && passed === total) return "complete";
  if (applicableItems.some((item) => item.status !== "not_started")) return "in_progress";
  return "not_started";
}

function exportRoadmapChecklistWorkbook(records: ChecklistRecord[]) {
  if (exportStyledRoadmapChecklistWorkbook(records)) return true;

  const checklistColumns = [...new Map(
    records.flatMap((record) => record.checklist).map((item) => [item.key, item]),
  ).values()];
  const statusSymbol = (status?: ChecklistItem["status"]) => {
    if (status === "passed") return "✔";
    if (status === "failed") return "✖";
    if (status === "not_applicable") return "▲";
    if (status === "in_progress" || status === "pending_structure") return "…";
    return "-";
  };
  const countStatus = (key: string, status: ChecklistItem["status"]) =>
    records.filter((record) =>
      record.checklist.some((item) => item.key === key && item.status === status),
    ).length;
  const personalHeaders = [
    "ลำดับ", "บริษัท", "ผู้ประเมิน", "แผนก", "ชื่อ - สกุล", "ชื่อเล่น",
    "ตำแหน่ง", "วันที่เข้าแผนการปรับ", "รอบเดือน", "จำนวนวัน", "ระดับ",
  ];
  const resultHeaders = [
    "เงินเดือนปัจจุบัน", "ค่าตำแหน่ง", "ค่าครองชีพ", "ค่าตอบแทนพิเศษ", "ค่าน้ำมัน/ค่าห้องพัก", "รวมค่าจ้าง",
    "ประเภท", "ตำแหน่งใหม่", "ระดับใหม่", "เงินเดือนใหม่", "ค่าตำแหน่งใหม่", "ค่าครองชีพใหม่", "ค่าตอบแทนพิเศษใหม่", "ค่าน้ำมัน/ค่าห้องพักใหม่", "รวมค่าจ้างใหม่", "เพิ่มขึ้น", "ลดลง",
    "คะแนนประเมิน", "คะแนนสอบ", "คะแนนวินัย", "ธนาคาร", "เลขที่บัญชี", "คะแนนเต็ม", "ผล Checklist", "สถานะรวม",
  ];
  const checklistHeaders = checklistColumns.map((item) => item.label);
  const headers = [...personalHeaders, ...resultHeaders, ...checklistHeaders, "หมายเหตุ Checklist"];
  const lastColumn = headers.length - 1;
  const rows: Array<Array<string | number>> = [
    [`รายการตรวจสอบ Road Map ประจำเดือน ${new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}`],
    [
      "ข้อมูลพนักงาน", ...Array(personalHeaders.length - 1).fill(""),
      "ผลการประเมิน", ...Array(resultHeaders.length - 1).fill(""),
      "หัวข้อการตรวจขั้นตอนการดำเนินการ", ...Array(checklistHeaders.length).fill(""), "",
    ],
    headers,
    [
      "สัญลักษณ์", "✅ ผ่านเงื่อนไข", "❌ ไม่ผ่านเงื่อนไข", "⚠️ ไม่เข้าเงื่อนไข", "⏳ รอตรวจ",
      ...Array(Math.max(0, lastColumn - 4)).fill(""),
    ],
    [
      "สรุปจำนวน", ...Array(personalHeaders.length + resultHeaders.length - 1).fill(""),
      ...checklistColumns.map((item) =>
        `ผ่าน ${countStatus(item.key, "passed")} / ไม่ผ่าน ${countStatus(item.key, "failed")} / ไม่เข้าเงื่อนไข ${countStatus(item.key, "not_applicable")}`,
      ),
      "",
    ],
  ];
  records.forEach((record, index) => {
    const progress = getProgress(record);
    rows.push([
      index + 1, "-", "-", record.department, record.employeeName,
      record.nickname || "-", "-", record.evaluationType || "-",
      record.approvedAt ? new Date(record.approvedAt).toLocaleDateString("th-TH") : "-",
      record.currentSalary ?? "-",
      record.positionAllowance ?? "-",
      record.livingAllowance ?? "-",
      record.specialAllowance ?? "-",
      record.fuelAllowance ?? "-",
      record.currentTotalSalary ?? "-",
      record.evaluationType || "-",
      record.newDesignation || "-",
      record.newLevel || "-",
      record.newSalary ?? "-",
      record.newPositionAllowance ?? "-",
      record.newLivingAllowance ?? "-",
      record.newSpecialAllowance ?? "-",
      record.newFuelAllowance ?? "-",
      record.newTotalSalary ?? "-",
      record.salaryIncrease ?? "-",
      record.salaryDecrease ?? "-",
      record.totalScore ?? 0,
      record.examScore ?? "-",
      record.disciplineScore ?? "-",
      record.bankName || "-",
      record.accountNumber || "-",
      record.maxScore ?? 0,
      `${progress.passed}/${progress.total}`,
      statusLabels[getRecordStatus(record)] || getRecordStatus(record),
      ...checklistColumns.map((item) => statusSymbol(
        record.checklist.find((check) => check.key === item.key)?.status,
      )),
      record.checklist.map((item) => (item.note ? `${item.label}: ${item.note}` : "")).filter(Boolean).join(" | "),
    ]);
  });
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumn } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: personalHeaders.length - 1 } },
    { s: { r: 1, c: personalHeaders.length }, e: { r: 1, c: personalHeaders.length + resultHeaders.length - 1 } },
    { s: { r: 1, c: personalHeaders.length + resultHeaders.length }, e: { r: 1, c: lastColumn - 1 } },
  ];
  worksheet["!cols"] = [
    { wch: 7 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 26 }, { wch: 14 },
    { wch: 24 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 16 },
    ...checklistColumns.map(() => ({ wch: 14 })), { wch: 42 },
  ];
  worksheet["!rows"] = [{ hpt: 28 }, { hpt: 24 }, { hpt: 42 }, { hpt: 42 }, { hpt: 30 }];
  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range({ s: { r: 2, c: 0 }, e: { r: rows.length - 1, c: lastColumn } }),
  };
  (worksheet as any)["!freeze"] = { xSplit: personalHeaders.length, ySplit: 3 };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "รายการ Road Map");
  XLSX.writeFile(workbook, `Roadmap_Checklist_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}

function exportStyledRoadmapChecklistWorkbook(records: ChecklistRecord[]) {
  const checklistColumns = [...new Map(
    records.flatMap((record) => record.checklist).map((item) => [item.key, item]),
  ).values()];
  const personalHeaders = [
    "ลำดับ", "บริษัท", "ผู้ประเมิน", "แผนก", "ชื่อ - สกุล", "ชื่อเล่น",
    "ตำแหน่ง", "วันที่เข้าแผนการปรับ", "รอบเดือน", "จำนวนวัน", "ระดับ",
  ];
  const currentSalaryHeaders = [
    "เงินเดือน", "ค่าตำแหน่ง", "ค่าครองชีพ", "ค่าตอบแทนพิเศษ", "ค่าน้ำมัน/ค่าห้องพัก", "รวมค่าจ้าง",
  ];
  const newSalaryHeaders = [
    "ตำแหน่งใหม่", "ระดับใหม่", "เงินเดือนใหม่", "ค่าตำแหน่งใหม่", "ค่าครองชีพใหม่",
    "ค่าตอบแทนพิเศษใหม่", "ค่าน้ำมัน/ค่าห้องพักใหม่", "รวมค่าจ้างใหม่",
  ];
  const resultHeaders = [
    "ประเภท", "เพิ่มขึ้น", "ลดลง", "คะแนนประเมิน", "คะแนนสอบ", "คะแนนวินัย", "ธนาคาร", "เลขที่บัญชี",
    "ใบประเมินพร้อมลายเซ็นหัวหน้างาน", "หมายเหตุHRM", "หมายเหตุHRD",
  ];
  const checklistHeaders = checklistColumns.map((item) => item.label);
  const headers = [...personalHeaders, ...currentSalaryHeaders, ...newSalaryHeaders, ...resultHeaders, ...checklistHeaders, "หมายเหตุ Checklist"];
  const currentSalaryStart = personalHeaders.length + 1;
  const currentSalaryEnd = currentSalaryStart + currentSalaryHeaders.length - 1;
  const newSalaryStart = currentSalaryEnd + 1;
  const newSalaryEnd = newSalaryStart + newSalaryHeaders.length - 1;
  const resultStart = newSalaryEnd + 1;
  const resultEnd = resultStart + resultHeaders.length - 1;
  const firstChecklistColumn = resultEnd + 1;
  const lastColumn = headers.length;
  const beforeCount = checklistColumns.filter((item) => item.phase === "before").length;
  const beforeStart = firstChecklistColumn;
  const beforeEnd = beforeStart + beforeCount - 1;
  const afterStart = beforeEnd + 1;
  const afterEnd = firstChecklistColumn + checklistColumns.length - 1;
  const border = {
    top: { style: "thin", color: { argb: "FFB7C3D0" } },
    left: { style: "thin", color: { argb: "FFB7C3D0" } },
    bottom: { style: "thin", color: { argb: "FFB7C3D0" } },
    right: { style: "thin", color: { argb: "FFB7C3D0" } },
  };
  const statusSymbol = (status?: ChecklistItem["status"]) => {
    if (status === "passed") return "✅";
    if (status === "failed") return "❌";
    if (status === "not_applicable") return "⚠️";
    if (status === "in_progress" || status === "pending_structure") return "⏳";
    return "";
  };
  const statusCount = (key: string, status: ChecklistItem["status"]) =>
    records.filter((record) => record.checklist.some((item) => item.key === key && item.status === status)).length;
  const statusSummary = (key: string) => {
    const parts = [
      { symbol: "✔", count: statusCount(key, "passed") },
      { symbol: "✖", count: statusCount(key, "failed") },
      { symbol: "▲", count: statusCount(key, "not_applicable") },
    ].filter((item) => item.count > 0);
    return parts.map((item) => `${item.symbol} ${item.count}`).join("   ");
  };

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("รายการ Road Map", {
    views: [{ state: "frozen", xSplit: personalHeaders.length, ySplit: 3 }],
  });
  sheet.mergeCells(1, 1, 1, lastColumn);
  sheet.getCell(1, 1).value = `รายการตรวจสอบ Road Map ประจำเดือน ${new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}`;
  sheet.mergeCells(2, 1, 2, personalHeaders.length);
  sheet.getCell(2, 1).value = "ข้อมูลพนักงาน";
  sheet.mergeCells(2, currentSalaryStart, 2, currentSalaryEnd);
  sheet.mergeCells(2, newSalaryStart, 2, newSalaryEnd);
  sheet.getCell(2, currentSalaryStart).value = "เงินเดือนปัจจุบัน";
  sheet.getCell(2, newSalaryStart).value = "เงินเดือนใหม่";
  if (beforeCount > 0) {
    sheet.mergeCells(2, beforeStart, 2, beforeEnd);
    sheet.getCell(2, beforeStart).value = "ก่อนนำเสนอ (ข้อ 1–10)";
  }
  if (afterStart <= afterEnd) {
    sheet.mergeCells(2, afterStart, 2, afterEnd);
    sheet.getCell(2, afterStart).value = "หลังนำเสนอ (ข้อ 11–13)";
  }
  sheet.getRow(3).values = headers;
  for (let columnNumber = resultStart; columnNumber <= resultEnd; columnNumber += 1) {
    sheet.mergeCells(2, columnNumber, 3, columnNumber);
    sheet.getCell(2, columnNumber).value = headers[columnNumber - 1];
  }
  sheet.getRow(4).values = [
    "สัญลักษณ์", "✔ ผ่านเงื่อนไข", "✖ ไม่ผ่านเงื่อนไข", "▲ ไม่เข้าเงื่อนไข", "… รอตรวจ",
    ...Array(Math.max(0, lastColumn - 5)).fill(""),
  ];
  sheet.getRow(5).values = ["สรุปจำนวน", ...Array(personalHeaders.length + resultHeaders.length - 1).fill("")];
  checklistColumns.forEach((item, index) => {
    sheet.getCell(5, firstChecklistColumn + index).value =
      statusSummary(item.key);
  });

  records.forEach((record, index) => {
    const row = sheet.addRow([
      index + 1, record.company || "-", record.evaluatorName || "-", record.department || "-", record.employeeName || "-", record.nickname || "-", record.position || "-",
      record.hireDate ? new Date(record.hireDate).toLocaleDateString("th-TH") : "-",
      record.salaryEffectiveMonth || "-", record.evaluationDays ?? "-", record.level || "-",
      record.currentSalary ?? "-", record.positionAllowance ?? "-", record.livingAllowance ?? "-",
      record.specialAllowance ?? "-", record.fuelAllowance ?? "-", record.currentTotalSalary ?? "-",
      record.newDesignation || "-", record.newLevel || "-",
      record.newSalary ?? "-", record.newPositionAllowance ?? "-", record.newLivingAllowance ?? "-",
      record.newSpecialAllowance ?? "-", record.newFuelAllowance ?? "-", record.newTotalSalary ?? "-",
      record.evaluationType || "-", record.salaryIncrease ?? "-", record.salaryDecrease ?? "-",
      record.totalScore ?? "-", record.examScore ?? "-", record.disciplineScore ?? "-",
      record.bankName || "-", record.accountNumber || "-", record.approvalNote || "-", record.approvalNote || "-", "-",
      ...checklistColumns.map((item) => statusSymbol(record.checklist.find((check) => check.key === item.key)?.status)),
      record.checklist.map((item) => (item.note ? `${item.label}: ${item.note}` : "")).filter(Boolean).join(" | "),
    ]);
    row.eachCell((cell, columnNumber) => {
      const item = checklistColumns[columnNumber - firstChecklistColumn];
      if (!item) return;
      if (cell.value === "✔") {
        cell.font = { name: "Aptos", size: 14, color: { argb: "FF15803D" }, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCFCE7" } };
      }
      if (cell.value === "✖") {
        cell.font = { name: "Aptos", size: 14, color: { argb: "FFB91C1C" }, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
      }
      if (cell.value === "▲") {
        cell.font = { name: "Aptos", size: 14, color: { argb: "FFB45309" }, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
      }
      if (cell.value === "…") {
        cell.font = { name: "Aptos", size: 14, color: { argb: "FF1D4ED8" }, bold: true };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
      }
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  for (let rowNumber = 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.height = rowNumber === 1 ? 30 : rowNumber === 3 ? 55 : rowNumber === 4 ? 30 : 24;
    row.eachCell((cell) => {
      cell.border = border as any;
      cell.alignment = { vertical: "middle", wrapText: true, ...cell.alignment };
    });
  }
  sheet.getCell(1, 1).font = { name: "Aptos Display", size: 16, bold: true, color: { argb: "FF0F172A" } };
  sheet.getCell(1, 1).alignment = { horizontal: "left", vertical: "middle" };
  [2, 3, 4, 5].forEach((rowNumber) => {
    sheet.getRow(rowNumber).eachCell((cell) => {
      cell.font = { name: "Aptos", size: rowNumber === 3 ? 10 : 10, bold: true, color: { argb: "FF0F172A" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    });
  });
  sheet.getRow(2).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9EAF7" } }; });
  sheet.getRow(3).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEAF0F6" } }; });
  sheet.getRow(4).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7D6" } }; });
  sheet.getRow(5).eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } }; });
  const legendStyles = [
    { color: "FF15803D", fill: "FFDCFCE7" },
    { color: "FFB91C1C", fill: "FFFEE2E2" },
    { color: "FFB45309", fill: "FFFEF3C7" },
    { color: "FF1D4ED8", fill: "FFDBEAFE" },
  ];
  legendStyles.forEach((style, index) => {
    const cell = sheet.getCell(4, index + 2);
    cell.font = { name: "Aptos", size: 11, bold: true, color: { argb: style.color } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.fill } };
  });
  if (beforeCount > 0) sheet.getCell(2, beforeStart).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE7A8" } };
  if (afterStart <= afterEnd) sheet.getCell(2, afterStart).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD6A5" } };
  sheet.columns.forEach((column, index) => {
    column.width = index === 0 ? 8 : index === 4 ? 24 : index === lastColumn - 1 ? 42 : index >= firstChecklistColumn - 1 && index < lastColumn - 1 ? 14 : 16;
  });
  sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: sheet.rowCount, column: lastColumn } };
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: "A3" as any };

  void workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Roadmap_Checklist_${new Date().toISOString().slice(0, 10)}.xlsx`;
    anchor.click();
    URL.revokeObjectURL(url);
  });
  return true;
}

export default function ChecklistPage() {
  const [records, setRecords] = useState<ChecklistRecord[]>([]);
  const [selected, setSelected] = useState<ChecklistRecord | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/roadmap/api/checklist", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error);
      setRecords(result.data || []);
    } catch (error) {
      console.error("Failed to load checklist", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRecords(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRecords]);

  const filteredRecords = useMemo(() => records.filter((record) => {
    const matchesSearch = `${record.employeeCode} ${record.employeeName} ${record.nickname}`.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || record.evaluationType === typeFilter;
    const matchesStatus = statusFilter === "all" || getRecordStatus(record) === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [records, search, typeFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: records.length,
    complete: records.filter((record) => getRecordStatus(record) === "complete").length,
    inProgress: records.filter((record) => getRecordStatus(record) === "in_progress").length,
    failed: records.filter((record) => getRecordStatus(record) === "failed").length,
  }), [records]);

  const updateSelectedItem = (key: string, changes: Partial<ChecklistItem>) => {
    setSelected((current) => current ? ({
      ...current,
      checklist: current.checklist.map((item) => {
        if (item.key !== key) return item;
        if (current.evaluationStatus !== "Completed" && item.phase === "after") return item;
        return { ...item, ...changes };
      }),
    }) : current);
  };

  const saveChecklist = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const response = await fetch("/roadmap/api/checklist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evaluationId: selected.id, checklist: selected.checklist }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error);
      setRecords((current) => current.map((record) => record.id === selected.id ? selected : record));
      window.alert("บันทึก Checklist เรียบร้อยแล้ว");
    } catch (error: any) {
      window.alert(error?.message || "บันทึก Checklist ไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const exportChecklist = () => {
    if (filteredRecords.length === 0) {
      window.alert("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    if (exportRoadmapChecklistWorkbook(filteredRecords)) return;

    const checklistColumns = [...new Map(
      filteredRecords.flatMap((record) => record.checklist).map((item) => [item.key, item]),
    ).values()];

    const rows = filteredRecords.map((record, index) => {
      const progress = getProgress(record);
      const row: Record<string, string | number> = {
        "ลำดับ": index + 1,
        "รหัสพนักงาน": record.employeeCode,
        "ชื่อ-สกุล": record.employeeName,
        "ชื่อเล่น": record.nickname,
        "แผนก": record.department,
        "ประเภทการประเมิน": record.evaluationType || "-",
        "คะแนน": `${record.totalScore ?? 0}/${record.maxScore ?? 0}`,
        "ผลรวม Checklist": `${progress.passed}/${progress.total}`,
        "สถานะรวม": statusLabels[getRecordStatus(record)] || getRecordStatus(record),
        "วันที่อนุมัติ": record.approvedAt ? new Date(record.approvedAt).toLocaleDateString("th-TH") : "-",
      };

      checklistColumns.forEach((item) => {
        const current = record.checklist.find((check) => check.key === item.key);
        row[item.label] = statusLabels[current?.status || "not_started"];
        row[`${item.label} - หมายเหตุ`] = current?.note || "";
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0]).map((key) => ({
      wch: key.includes("หมายเหตุ") ? 28 : key.length > 24 ? 22 : 18,
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Checklist");
    XLSX.writeFile(workbook, `Roadmap_Checklist_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <style jsx global>{`
        [class~="z-50"][class~="justify-end"] {
          background: rgb(15 23 42 / 0.48);
          backdrop-filter: blur(5px);
        }
        [class~="z-50"][class~="justify-end"] > div {
          border-left: 1px solid rgb(226 232 240);
          border-radius: 24px 0 0 24px;
          box-shadow: -18px 0 45px rgb(15 23 42 / 0.18);
        }
        [class~="z-50"][class~="justify-end"] > div > div:first-child {
          background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
          border-bottom-color: rgb(226 232 240);
        }
        [class~="z-50"][class~="justify-end"] button,
        [class~="z-50"][class~="justify-end"] select,
        [class~="z-50"][class~="justify-end"] input {
          cursor: pointer;
        }
        [class~="z-50"][class~="justify-end"] [class~="space-y-3"] > div {
          border-color: rgb(226 232 240);
          box-shadow: 0 4px 14px rgb(15 23 42 / 0.04);
          transition: transform 150ms ease, box-shadow 150ms ease;
        }
        [class~="z-50"][class~="justify-end"] [class~="space-y-3"] > div:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgb(15 23 42 / 0.08);
        }
        [class~="z-50"][class~="justify-end"] [class~="border-t"][class~="pt-5"] button:first-child {
          border: 1px solid rgb(252 165 165);
          background: linear-gradient(180deg, #fca5a5 0%, #dc2626 100%);
          color: white;
          box-shadow: 0 4px 10px rgb(220 38 38 / 0.22);
        }
        [class~="z-50"][class~="justify-end"] [class~="border-t"][class~="pt-5"] button:last-child {
          background: linear-gradient(180deg, #34d399 0%, #059669 100%);
          color: white;
          box-shadow: 0 4px 10px rgb(5 150 105 / 0.22);
        }
        [class~="z-50"][class~="justify-end"] [class~="border-t"][class~="pt-5"] button:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8 text-slate-900">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><h1 className="text-4xl font-black">Checklist</h1><p className="mt-1 text-gray-500">ตรวจสอบขั้นตอนการดำเนินการหลัง Management อนุมัติ</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportChecklist} className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-emerald-600 hover:to-emerald-800 active:scale-95"><Download className="h-4 w-4" /> Export Excel</button>
          <button type="button" onClick={() => void loadRecords()} className="cursor-pointer rounded-xl border border-amber-300 bg-gradient-to-b from-yellow-200 to-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 shadow-md transition hover:from-yellow-300 hover:to-amber-500 active:scale-95">รีเฟรชข้อมูล</button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<ClipboardCheck />} label="รายการทั้งหมด" value={stats.total} tone="blue" />
        <StatCard icon={<Check />} label="ตรวจครบแล้ว" value={stats.complete} tone="green" />
        <StatCard icon={<Clock3 />} label="กำลังตรวจ" value={stats.inProgress} tone="amber" />
        <StatCard icon={<AlertTriangle />} label="พบรายการไม่ผ่าน" value={stats.failed} tone="rose" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือรหัสพนักงาน" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></div>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="all">ทุกประเภท</option><option>Probation</option><option>Performance</option><option>Promote</option><option>Progression</option></select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm"><option value="all">ทุกสถานะ</option><option value="not_started">ยังไม่ตรวจ</option><option value="in_progress">กำลังตรวจ</option><option value="complete">ตรวจครบแล้ว</option><option value="failed">ไม่ผ่าน</option></select>
        </div>

        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">พนักงาน</th><th className="px-5 py-3">ประเภท</th><th className="px-5 py-3">แผนก</th><th className="px-5 py-3">คะแนน</th><th className="px-5 py-3">ความคืบหน้า</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3 text-right">ดำเนินการ</th></tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">กำลังโหลดข้อมูล...</td></tr> : filteredRecords.length === 0 ? <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-500">ยังไม่มีรายการที่ผ่านการอนุมัติ</td></tr> : filteredRecords.map((record) => { const progress = getProgress(record); return <tr key={record.id} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="font-semibold">{record.employeeName}</div><div className="text-xs text-slate-500">{record.employeeCode} · {record.nickname}</div></td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{record.evaluationType || "-"}</span></td><td className="px-5 py-4">{record.department}</td><td className="px-5 py-4 font-semibold">{record.totalScore ?? 0}/{record.maxScore ?? 0}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress.total ? (progress.passed / progress.total) * 100 : 0}%` }} /></div><span className="text-xs">{progress.passed}/{progress.total}</span></div></td><td className="px-5 py-4"><StatusBadge status={getRecordStatus(record)} /></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelected(record)} className="cursor-pointer rounded-lg bg-gradient-to-b from-orange-400 to-orange-600 px-3 py-2 text-xs font-semibold text-white shadow-md transition hover:from-orange-500 hover:to-orange-700 active:scale-95">ตรวจสอบ</button></td></tr>; })}</tbody></table></div>
      </div>

      {selected && <ChecklistDrawer record={selected} saving={saving} onClose={() => setSelected(null)} onChange={updateSelectedItem} onSave={saveChecklist} />}
      </div>
    </>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "blue" | "green" | "amber" | "rose" }) { const styles = { blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", rose: "bg-rose-50 text-rose-600" }; return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}>{icon}</div><div className="text-sm text-slate-500">{label}</div><div className="mt-1 text-3xl font-black">{value}</div></div>; }

function StatusBadge({ status }: { status: string }) { const config: Record<string, { label: string; className: string }> = { complete: { label: "ตรวจครบแล้ว", className: "bg-emerald-50 text-emerald-700" }, in_progress: { label: "กำลังตรวจ", className: "bg-amber-50 text-amber-700" }, failed: { label: "ไม่ผ่าน", className: "bg-rose-50 text-rose-700" }, not_started: { label: "ยังไม่ตรวจ", className: "bg-slate-100 text-slate-600" } }; const item = config[status] || config.not_started; return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>; }

function ChecklistDrawer({ record, saving, onClose, onChange, onSave }: { record: ChecklistRecord; saving: boolean; onClose: () => void; onChange: (key: string, changes: Partial<ChecklistItem>) => void; onSave: () => void }) { return <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"><div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4"><div><h2 className="text-xl font-bold">ตรวจสอบ Checklist</h2><p className="text-sm text-slate-500">{record.employeeName} · {record.employeeCode}</p></div><button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X /></button></div><div className="p-6"><div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm"><div><span className="text-slate-500">ประเภท</span><div className="font-semibold">{record.evaluationType || "-"}</div></div><div><span className="text-slate-500">คะแนน</span><div className="font-semibold">{record.totalScore ?? 0}/{record.maxScore ?? 0}</div></div></div><div className="space-y-3">{record.checklist.map((item, index) => <div key={item.key} className={`rounded-2xl border p-4 ${item.status === "not_applicable" ? "border-slate-200 bg-slate-50" : "border-slate-200"}`}><div className="flex items-start gap-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">{index + 1}</div><div className="min-w-0 flex-1"><div className="font-semibold">{item.label}</div>{item.status === "not_applicable" && <div className="mt-1 text-xs text-slate-500">หัวข้อนี้ไม่เข้าเงื่อนไขสำหรับประเภทการประเมินนี้</div>}<div className="mt-3 grid gap-2 sm:grid-cols-2"><select disabled={item.status === "not_applicable"} value={item.status} onChange={(event) => onChange(item.key, { status: event.target.value as ChecklistItem["status"] })} className="rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="not_started">ยังไม่ตรวจ</option><option value="in_progress">กำลังดำเนินการ</option><option value="passed">ผ่าน</option><option value="failed">ไม่ผ่าน</option><option value="pending_structure">รอโครงสร้างข้อสอบ</option><option value="not_applicable">ไม่เข้าเงื่อนไข</option></select><input value={item.note} onChange={(event) => onChange(item.key, { note: event.target.value })} placeholder="หมายเหตุ / หลักฐาน" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" /></div></div></div></div>)}</div><div className="mt-6 flex justify-end gap-3 border-t pt-5"><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm font-semibold">ยกเลิก</button><button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? "กำลังบันทึก..." : "บันทึก Checklist"}</button></div></div></div></div>; }
