'use client';

import { useEffect, useMemo, useState } from 'react';
import PayrollHeader from './components/PayrollHeader';
import PayrollSummaryCards from './components/PayrollSummaryCards';
import PayrollToolbar from './components/PayrollToolbar';
import PayrollTable from './components/PayrollTable';

export default function PayrollPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPayroll() {
      setIsLoading(true);
      try {
        const res = await fetch('/roadmap/api/payroll/adjustments');
        const json = await res.json();
        if (json.success) setRows(json.data);
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    }
    fetchPayroll();
  }, []);

  // กรองเฉพาะการค้นหาชื่อ/รหัส/ธนาคาร เท่านั้น (ไม่กรองสถานะแล้ว)
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const keyword = search.toLowerCase().trim();
      return (
        row.name.toLowerCase().includes(keyword) ||
        row.employeeId.includes(keyword) ||
        row.accountNumber.includes(keyword) ||
        row.bank.toLowerCase().includes(keyword)
      );
    });
  }, [rows, search]);

  // การ์ดสรุปเหลือแค่จำนวนรายการทั้งหมด
  const summaryCards = useMemo(() => {
    return [
      { 
        title: 'รายการปรับเงินเดือนทั้งหมด', 
        value: rows.length, 
        color: 'bg-slate-100', 
        textColor: 'text-slate-900' 
      },
    ];
  }, [rows]);

  if (isLoading) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <PayrollHeader />
      
      <PayrollSummaryCards cards={summaryCards} />

      <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm">
        <PayrollToolbar
          search={search}
          onSearchChange={setSearch}
          // ตัดส่วน status ออกไปเลย
        />

        <div className="mt-6 text-sm text-gray-500">
          แสดง {filteredRows.length} รายการ
        </div>

        <div className="mt-6 overflow-x-auto">
          <PayrollTable rows={filteredRows} />
        </div>
      </div>
    </div>
  );
}