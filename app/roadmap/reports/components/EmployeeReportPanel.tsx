'use client';

import ReportCard from './ReportCard';
import ReportTable from './ReportTable';

const summary = [
  { title: 'พนักงานทั้งหมด', value: '55 คน', label: 'รวมพนักงาน', colorClass: 'bg-slate-50 text-slate-800' },
  { title: 'ประเมินแล้ว (Q2)', value: '38 คน', label: 'ประเมินแล้ว', colorClass: 'bg-emerald-50 text-emerald-700' },
  { title: 'ยังไม่ถูกประเมิน', value: '17 คน', label: 'ยังไม่ประเมิน', colorClass: 'bg-amber-50 text-amber-700' },
  { title: 'แผนก', value: '6 แผนก', label: 'จำนวนแผนก', colorClass: 'bg-indigo-50 text-indigo-700' },
];

const rows = [
  { employee: 'Sarah Williams', role: 'Tech Lead - Engineering', status: 'ไม่เลย', quarter: 'Q1 2024' },
  { employee: 'James Lee', role: 'Manager - Operations', status: 'อนุมัติ', quarter: 'Q2 2024' },
  { employee: 'Tom Bradley', role: 'Designer - Marketing', status: 'ไม่เลย', quarter: 'Q2 2024' },
  { employee: 'Nina Park', role: 'Specialist - HR', status: 'Q4 2023', quarter: 'Q4 2023' },
];

export default function EmployeeReportPanel({ quarter }: { quarter: string; scope: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.map((item) => (
          <ReportCard key={item.title} {...item} />
        ))}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm text-black">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">จำนวนพนักงานตามตำแหน่ง</h2>
        <ReportTable
          columns={[
            { header: 'พนักงาน', key: 'employee' },
            { header: 'ตำแหน่ง', key: 'role' },
            { header: 'สถานะ', key: 'status', align: 'center' },
            { header: 'ไตรมาส', key: 'quarter', align: 'center' },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}