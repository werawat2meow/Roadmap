"use client";

import { useEffect, useMemo, useState } from "react";
import PayrollHeader from "./components/PayrollHeader";
import PayrollSummaryCards from "./components/PayrollSummaryCards";
import PayrollToolbar from "./components/PayrollToolbar";
import PayrollTable from "./components/PayrollTable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function PayrollPage() {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. ดึงข้อมูลจริงจาก API
  useEffect(() => {
    async function fetchPayroll() {
      setIsLoading(true);
      try {
        const res = await fetch("/roadmap/api/payroll/adjustments");
        const json = await res.json();
        if (json.success) setRows(json.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
      setIsLoading(false);
    }
    fetchPayroll();
  }, []);

  const departments = useMemo(
    () => [...new Set(rows.map((row) => row.department).filter(Boolean))],
    [rows],
  );

  const levels = useMemo(
    () => [...new Set(rows.map((row) => row.level).filter(Boolean))],
    [rows],
  );

  const statuses = useMemo(
    () => [...new Set(rows.map((row) => row.status).filter(Boolean))],
    [rows],
  );

  // 2. กรองข้อมูล (filteredRows)
  const filteredRows = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return rows.filter((row) => {
      const matchesSearch =
        row.name?.toLowerCase().includes(keyword) ||
        row.employeeId?.toLowerCase().includes(keyword) ||
        row.accountNumber?.toLowerCase().includes(keyword) ||
        row.bank?.toLowerCase().includes(keyword);

      return (
        matchesSearch &&
        (!departmentFilter || row.department === departmentFilter) &&
        (!levelFilter || row.level === levelFilter) &&
        (!statusFilter || row.status === statusFilter)
      );
    });
  }, [rows, search, departmentFilter, levelFilter, statusFilter]);

  // 3. ฟังก์ชัน Export Excel (ย้ายมาไว้ข้างในนี้ เพื่อให้มองเห็น filteredRows)
  const handleExportPayrollExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payroll Adjustments");

    worksheet.columns = [
      { header: "ลำดับ", key: "no", width: 8 },
      { header: "รหัสพนักงาน", key: "employeeId", width: 15 },
      { header: "ชื่อ-นามสกุล", key: "name", width: 25 },
      { header: "แผนก", key: "department", width: 20 },
      { header: "Level", key: "level", width: 10 },
      { header: "ผลการประเมิน", key: "evaluation", width: 25 },
      { header: "เงินเดือนเดิม", key: "oldSalary", width: 15 },
      { header: "เงินเดือนใหม่", key: "newSalary", width: 15 },
      { header: "ยอดที่ปรับเพิ่ม", key: "diff", width: 15 },
      { header: "ธนาคาร", key: "bank", width: 15 },
      { header: "เลขที่บัญชี", key: "accountNumber", width: 20 },
    ];

    filteredRows.forEach((row, index) => {
      worksheet.addRow({
        no: index + 1,
        employeeId: row.employeeId,
        name: row.name,
        department: row.department,
        level: row.level,
        evaluation: row.evaluation,
        oldSalary: row.oldSalary,
        newSalary: row.newSalary,
        diff: (row.newSalary || 0) - (row.oldSalary || 0),
        bank: row.bank,
        accountNumber: row.accountNumber,
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFE599" }, // สีเหลืองไข่ไก่
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // ข้ามหัวตาราง เพราะจัดไปแล้ว
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const thaiMonth = new Intl.DateTimeFormat("th-TH", {
      month: "long",
    }).format(new Date());
    saveAs(new Blob([buffer]), `รายการปรับเงินเดือน-${thaiMonth}.xlsx`);
  };

  const summaryCards = useMemo(() => {
    return [
      {
        title: "รายการปรับเงินเดือนทั้งหมด",
        value: rows.length,
        color: "bg-slate-100",
        textColor: "text-slate-900",
      },
    ];
  }, [rows]);

  if (isLoading)
    return (
      <div className="p-10 text-center text-slate-500">
        กำลังโหลดข้อมูลรายการปรับเงินเดือน...
      </div>
    );

  return (
    <div className="p-6 lg:p-10 space-y-8">
      {/* ส่งฟังก์ชันไปให้ Header */}
      <PayrollHeader onDownload={handleExportPayrollExcel} />

      <PayrollSummaryCards cards={summaryCards} />

      <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm">
        <PayrollToolbar
          search={search}
          onSearchChange={setSearch}
          department={departmentFilter}
          level={levelFilter}
          status={statusFilter}
          departments={departments}
          levels={levels}
          statuses={statuses}
          onDepartmentChange={setDepartmentFilter}
          onLevelChange={setLevelFilter}
          onStatusChange={setStatusFilter}
        />
        <div className="mt-6 text-sm text-gray-500">
          แสดง {filteredRows.length} รายการที่มีการปรับเงินเดือน
        </div>
        <div className="mt-6 overflow-x-auto">
          <PayrollTable rows={filteredRows} />
        </div>
      </div>
    </div>
  );
}
