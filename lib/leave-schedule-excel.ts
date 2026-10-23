import {
  cellKey,
  savedValue,
  weekday,
} from "@/lib/leave-schedule-model";

import { getLeaveSchedulePeriod } from "@/lib/leave-schedule-period";

import type {
  ScheduleEmployee,
  ScheduleItem,
} from "@/app/leave/schedules/components/ScheduleGrid";

type ExportOptions = {
  year: number;
  month: number;
  filters: Record<string, string>;
  filterDescription: string;
};

type ScheduleResponse = {
  success: boolean;
  error?: string;

  pagination: {
    total: number;
    totalPages: number;
  };

  employees: ScheduleEmployee[];
  schedules: ScheduleItem[];
};

const weekdayNames = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const weekdayColors = [
  "FFFEE2E2", // อาทิตย์
  "FFFEF9C3", // จันทร์
  "FFFCE7F3", // อังคาร
  "FFDCFCE7", // พุธ
  "FFFFEDD5", // พฤหัสบดี
  "FFE0F2FE", // ศุกร์
  "FFF3E8FF", // เสาร์
];

function organizationName(
  value: ScheduleEmployee["organization"]["branch"],
  field: string,
) {
  const item = Array.isArray(value) ? value[0] : value;
  return item?.[field] || "-";
}

function thaiDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function offsetLabel(offset: number) {
  return offset > 0 ? ` (+${offset})` : "";
}

export async function downloadScheduleExcel({
  year,
  month,
  filters,
  filterDescription,
}: ExportOptions) {
  const period = getLeaveSchedulePeriod(year, month);

  const employees = new Map<string, ScheduleEmployee>();
  const schedules = new Map<string, ScheduleItem>();

  let expectedTotal: number | null = null;
  let totalPages = 1;

  // อ่านทุกหน้า ไม่ใช้เฉพาะข้อมูล 30 คนที่แสดงบนหน้าจอ
  for (let page = 1; page <= totalPages; page++) {
    const params = new URLSearchParams({
      year: String(year),
      month: String(month),
      page: String(page),
      pageSize: "100",
    });

    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }

    const response = await fetch(`/leave/api/schedules?${params}`, {
      cache: "no-store",
    });

    const json: ScheduleResponse = await response.json();

    if (!response.ok || !json.success) {
      throw new Error(json.error || "โหลดข้อมูลสำหรับส่งออกไม่สำเร็จ");
    }

    if (expectedTotal === null) {
      expectedTotal = json.pagination.total;
    } else if (expectedTotal !== json.pagination.total) {
      throw new Error(
        "รายชื่อพนักงานเปลี่ยนระหว่างส่งออก กรุณากด Download ใหม่",
      );
    }

    totalPages = Math.max(1, json.pagination.totalPages);

    for (const employee of json.employees) {
      if (employees.has(employee.id)) {
        throw new Error(
          "รายชื่อพนักงานซ้ำระหว่างหน้า กรุณากด Download ใหม่",
        );
      }

      employees.set(employee.id, employee);
    }

    for (const item of json.schedules) {
      // ใช้เฉพาะตารางที่บันทึกใช้งานแล้ว
      if (item.state !== "PUBLISHED") continue;

      const key = cellKey(item.employeeId, item.workDate);
      const current = schedules.get(key);

      if (!current || item.revision > current.revision) {
        schedules.set(key, item);
      }
    }
  }

  if (employees.size === 0) {
    throw new Error("ไม่พบพนักงานตามตัวกรองที่เลือก");
  }

  if (employees.size !== expectedTotal) {
    throw new Error("อ่านรายชื่อพนักงานไม่ครบ กรุณาลองใหม่");
  }

  // โหลด ExcelJS เฉพาะเมื่อกด Download
  const ExcelJS = (await import("exceljs")).default;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Leave";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("ตารางงาน", {
    views: [
      {
        state: "frozen",
        xSplit: 6,
        ySplit: 5,
      },
    ],
    pageSetup: {
      orientation: "landscape",
      paperSize: 9,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  const columnCount = 6 + period.dates.length + 1;

  sheet.mergeCells(1, 1, 1, columnCount);
  sheet.getCell(1, 1).value =
    `ตารางงาน ${thaiDate(period.startDate)} – ${thaiDate(period.endDate)}`;
  sheet.getCell(1, 1).font = {
    name: "Tahoma",
    size: 16,
    bold: true,
    color: { argb: "FF0F172A" },
  };
  sheet.getRow(1).height = 30;

  sheet.mergeCells(2, 1, 2, columnCount);
  sheet.getCell(2, 1).value =
    `${filterDescription} | พนักงาน ${employees.size} คน`;
  sheet.getRow(2).height = 26;

  sheet.mergeCells(3, 1, 3, columnCount);
  sheet.getCell(3, 1).value =
    "สีเขียว = บันทึกแล้ว | สีเทา = OFF | - = ยังไม่จัดตาราง | (+1) = วันถัดไป";
  sheet.getRow(3).height = 24;

  sheet.getRow(4).height = 8;

  const headers = [
    "รหัสพนักงาน",
    "ชื่อพนักงาน",
    "สังกัด",
    "แผนก",
    "ฝ่าย",
    "หน่วย",
    ...period.dates.map(
      (date) =>
        `${weekdayNames[weekday(date)]}\n${date.slice(8, 10)}/${date.slice(5, 7)}`,
    ),
    "สรุปรอบเดือน",
  ];

  const headerRow = sheet.getRow(5);
  headerRow.values = headers;
  headerRow.height = 38;

  headerRow.eachCell((cell, column) => {
    const isDate = column >= 7 && column < columnCount;

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb: isDate
          ? weekdayColors[weekday(period.dates[column - 7])]
          : column === columnCount
            ? "FF1E293B"
            : "FFF1F5F9",
      },
    };

    cell.font = {
      name: "Tahoma",
      size: 10,
      bold: true,
      color: {
        argb: column === columnCount ? "FFFFFFFF" : "FF0F172A",
      },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  });

  sheet.getColumn(1).width = 17;
  sheet.getColumn(1).numFmt = "@";
  sheet.getColumn(2).width = 28;

  for (let column = 3; column <= 6; column++) {
    sheet.getColumn(column).width = 23;
  }

  for (let column = 7; column < columnCount; column++) {
    sheet.getColumn(column).width = 20;
  }

  sheet.getColumn(columnCount).width = 24;

  for (const employee of employees.values()) {
    const row = sheet.addRow([
      employee.employeeCode,
      employee.name || "ไม่ระบุชื่อ",
      organizationName(employee.organization.branch, "branch_name"),
      organizationName(
        employee.organization.department,
        "department_name",
      ),
      organizationName(employee.organization.division, "division_name"),
      organizationName(employee.organization.unit, "unit_name"),
    ]);

    row.height = 58;

    let workDays = 0;
    let offDays = 0;
    let missingDays = 0;

    period.dates.forEach((date, index) => {
      const cell = row.getCell(index + 7);
      const item = schedules.get(cellKey(employee.id, date));

      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      if (!item) {
        missingDays++;
        cell.value = "-";
        cell.font = {
          name: "Tahoma",
          size: 10,
          color: { argb: "FF94A3B8" },
        };
        return;
      }

      if (item.dayType === "OFF") {
        offDays++;
        cell.value = "OFF\nบันทึกแล้ว";
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      } else {
        workDays++;

        const day = savedValue(item);

        const times = day.intervals.map(
          (interval) =>
            `${interval.startTime}${offsetLabel(interval.startDayOffset)}` +
            `–${interval.endTime}${offsetLabel(interval.endDayOffset)}`,
        );

        cell.value = [
          "ทำงาน",
          ...times,
          "บันทึกแล้ว",
        ].join("\n");

        // เพิ่มความสูงเมื่อวันนั้นมีหลายช่วงงาน
        row.height = Math.max(row.height || 58, 40 + times.length * 15);

        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFECFDF5" },
        };
      }

      if (item.note) cell.note = item.note;
    });

    const summary = row.getCell(columnCount);

    summary.value =
      `ทำงาน ${workDays} วัน\n` +
      `หยุด ${offDays} วัน\n` +
      `ยังไม่จัด ${missingDays} วัน`;

    summary.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8FAFC" },
    };

    summary.font = {
      name: "Tahoma",
      size: 10,
      bold: true,
    };
  }

  // เส้นขอบและฟอนต์สำหรับทุกช่อง
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber < 5) return;

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      cell.alignment = {
        vertical: "middle",
        wrapText: true,
        ...cell.alignment,
      };

      if (!cell.font?.name) {
        cell.font = {
          name: "Tahoma",
          size: 10,
          color: { argb: "FF0F172A" },
          ...cell.font,
        };
      }
    });
  });

  sheet.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: sheet.rowCount, column: columnCount },
  };

  sheet.pageSetup.printTitlesRow = "1:5";

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `work-schedule-${period.startDate}-${period.endDate}.xlsx`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  // เว้นเวลาให้ browser เริ่มดาวน์โหลด
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}