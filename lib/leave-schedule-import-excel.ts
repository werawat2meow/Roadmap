import type ExcelJS from "exceljs";

import { getLeaveSchedulePeriod } from "@/lib/leave-schedule-period";
import { validateDay, weekday, type DayValue } from "@/lib/leave-schedule-model";

export type ScheduleTemplateEmployee = {
  employeeCode: string;
  name: string;
};

export type ImportedScheduleCell = {
  employeeCode: string;
  workDate: string;
  excelRow: number;
  value: DayValue;
};

const weekdayColors = [
  "FFFEE2E2", "FFFEF9C3", "FFFCE7F3", "FFDCFCE7",
  "FFFFEDD5", "FFE0F2FE", "FFF3E8FF",
];
const weekdayLabels = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

function dateHeader(date: string) {
  return `${weekdayLabels[weekday(date)]}\n${date}`;
}
const time = "(?:[01]\\d|2[0-3]):[0-5]\\d";
const workPattern = new RegExp(`^(${time})(\\+1)?\\s*-\\s*(${time})(\\+1)?$`);

function text(cell: ExcelJS.Cell): string {
  const value = cell.value;
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object" && "text" in value) {
    return String(value.text ?? "").trim();
  }
  return cell.text.trim();
}

function parseDay(raw: string): DayValue | null {
  const input = raw.trim().toUpperCase();
  if (!input) return null;
  if (input === "OFF") {
    return { dayType: "OFF", intervals: [], note: "", source: "MANUAL" };
  }

  const parts = input.split("|").map((part) => part.trim());
  if (parts.length > 8 || parts.some((part) => !part)) {
    throw new Error("ระบุช่วงงานได้ 1–8 ช่วง โดยใช้ | คั่นแต่ละช่วง");
  }

  const intervals = parts.map((part, index) => {
    const match = part.match(workPattern);
    if (!match) {
      throw new Error(
        `ช่วงที่ ${index + 1} ค่า "${part}" ไม่ถูกต้อง ใช้ 08:00-17:00 หรือ 22:00-07:00+1`,
      );
    }
    const [, startTime, nextStart, endTime, nextEnd] = match;
    return {
      startTime,
      endTime,
      startDayOffset: nextStart ? 1 : 0,
      endDayOffset: nextEnd ? 1 : 0,
    };
  });

  const value: DayValue = {
    dayType: "WORK",
    intervals,
    note: "",
    source: "MANUAL",
  };
  validateDay(value);
  return value;
}

export async function createScheduleTemplateBuffer(input: {
  year: number;
  month: number;
  employees: ScheduleTemplateEmployee[];
}) {
  const period = getLeaveSchedulePeriod(input.year, input.month);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Schedule", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 2 }],
  });

  sheet.getCell("A1").value = "schedule_period";
  sheet.getCell("B1").value = `${input.year}-${String(input.month).padStart(2, "0")}`;
  sheet.getCell("C1").value = `${period.startDate} to ${period.endDate}`;
  // Row 1 is metadata and examples. The importer reads work cells from row 3.
  const examples = [
    ["ตัวอย่างเวลาปกติ", "08:00-17:00"],
    ["ตัวอย่างวันหยุด", "OFF"],
    ["ตัวอย่างกะข้ามคืน", "22:00-07:00+1"],
    ["ตัวอย่างหลายช่วง", "06:00-10:00 | 11:00-15:00"],
    ["ตัวอย่างหลายช่วงข้ามคืน", "22:00-02:00+1 | 03:00+1-07:00+1"],
    ["ช่องวันที่ว่าง", "ไม่เปลี่ยนข้อมูลเดิม"],
  ] as const;
  for (const [index, [label, value]] of examples.entries()) {
    const cell = sheet.getRow(1).getCell(index + 4);
    cell.value = `${label}\n${value}`;
    cell.font = { bold: true, color: { argb: "FF92400E" }, size: 10 };
    cell.fill = {
      type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3C4" },
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  }
  sheet.getRow(1).height = 48;
  sheet.getRow(2).values = [
    "employee_code", "employee_name", ...period.dates.map(dateHeader),
  ];
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 30;
  sheet.getColumn(1).numFmt = "@";
  sheet.getRow(2).height = 36;
  sheet.getRow(2).font = { bold: true };
  sheet.getRow(2).getCell(1).fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" },
  };
  sheet.getRow(2).getCell(2).fill = {
    type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" },
  };
  period.dates.forEach((date, index) => {
    const column = sheet.getColumn(index + 3);
    column.width = 19;
    const cell = sheet.getRow(2).getCell(index + 3);
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: weekdayColors[weekday(date)] },
    };
  });

  for (const employee of input.employees) {
    sheet.addRow([employee.employeeCode, employee.name]);
  }

  return workbook.xlsx.writeBuffer();
}

export async function parseScheduleTemplate(
  file: File,
  year: number,
  month: number,
): Promise<ImportedScheduleCell[]> {
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("กรุณาใช้ไฟล์ .xlsx จาก Template ตารางงาน");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("ไฟล์ตารางงานต้องไม่เกิน 10 MB");
  }

  const period = getLeaveSchedulePeriod(year, month);
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.getWorksheet("Schedule");
  if (!sheet) throw new Error("ไม่พบชีต Schedule ในไฟล์ Template");

  const expectedPeriod = `${year}-${String(month).padStart(2, "0")}`;
  if (text(sheet.getCell("A1")) !== "schedule_period" ||
      text(sheet.getCell("B1")) !== expectedPeriod) {
    throw new Error(`ไฟล์นี้ไม่ใช่รอบ ${period.startDate}–${period.endDate}`);
  }
  if (text(sheet.getCell("A2")) !== "employee_code" ||
      text(sheet.getCell("B2")) !== "employee_name") {
    throw new Error("หัวตารางพนักงานไม่ตรงกับ Template");
  }
  period.dates.forEach((date, index) => {
    const header = text(sheet.getRow(2).getCell(index + 3));
    if (header !== date && header !== dateHeader(date)) {
      throw new Error(`หัววันที่คอลัมน์ ${index + 3} ต้องเป็น ${date}`);
    }
  });
  for (let column = period.dates.length + 3; column <= sheet.columnCount; column++) {
    for (let row = 3; row <= sheet.rowCount; row++) {
      if (text(sheet.getRow(row).getCell(column))) {
        throw new Error(`พบข้อมูลนอกช่วงวันที่ของรอบเดือนที่คอลัมน์ ${column}`);
      }
    }
  }

  const cells: ImportedScheduleCell[] = [];
  const seenCodes = new Set<string>();
  for (let rowNumber = 3; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const employeeCode = text(row.getCell(1));
    if (!employeeCode) {
      if (period.dates.some((_, index) => text(row.getCell(index + 3)))) {
        throw new Error(`แถว ${rowNumber}: ไม่มีรหัสพนักงาน`);
      }
      continue;
    }
    if (seenCodes.has(employeeCode)) {
      throw new Error(`แถว ${rowNumber}: รหัสพนักงาน ${employeeCode} ซ้ำในไฟล์`);
    }
    seenCodes.add(employeeCode);
    for (const [index, workDate] of period.dates.entries()) {
      const raw = text(row.getCell(index + 3));
      try {
        const value = parseDay(raw);
        if (value) cells.push({ employeeCode, workDate, excelRow: rowNumber, value });
      } catch (error) {
        throw new Error(
          `แถว ${rowNumber} วันที่ ${workDate}: ${error instanceof Error ? error.message : "ข้อมูลไม่ถูกต้อง"}`,
        );
      }
    }
  }
  if (!cells.length) throw new Error("ไม่พบช่องตารางงานที่กรอกในไฟล์");
  if (cells.length > 20_000) throw new Error("ไฟล์มีเกิน 20,000 ช่องต่อครั้ง");
  return cells;
}
