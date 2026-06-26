'use client';

import ReportCard from './ReportCard';
import ReportTable from './ReportTable';

const summary = [
  { title: 'หมวดหมู่ทั้งหมด', value: '1 หมวด', label: 'รวมหมวดหมู่', colorClass: 'bg-slate-50 text-slate-800' },
  { title: 'ตัวชี้วัดทั้งหมด', value: '1 ข้อ', label: 'รวมตัวชี้วัด', colorClass: 'bg-sky-50 text-sky-700' },
  { title: 'คะแนนเฉลี่ยรวม', value: '25 คะแนน', label: 'คะแนนรวม', colorClass: 'bg-amber-50 text-amber-700' },
  { title: 'LEVEL ที่ใช้', value: '1 levels', label: 'ระดับ', colorClass: 'bg-violet-50 text-violet-700' },
];

const rows = [
  { group: 'Department', level: 'P4', indicators: '1 ข้อ', score: '25', progress: '100%' },
];

export default function SettingsReportPanel({ quarter }: { quarter: string; scope: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.map((item) => (
          <ReportCard key={item.title} {...item} />
        ))}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm text-black">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">รายงานการตั้งค่า</h2>
        <ReportTable
          columns={[
            { header: 'กลุ่มหมวด', key: 'group' },
            { header: 'LEVEL', key: 'level', align: 'center' },
            { header: 'จำนวนตัวชี้วัด', key: 'indicators', align: 'center' },
            { header: 'คะแนนเฉลี่ยรวม', key: 'score', align: 'center' },
            { header: 'ความคืบหน้า', key: 'progress', align: 'right' },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}