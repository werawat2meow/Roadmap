'use client';

import ReportCard from './ReportCard';
import ReportTable from './ReportTable';

const summary = [
  { title: 'ทั้งหมด', value: '8', label: 'งานทั้งหมด', colorClass: 'bg-slate-50 text-slate-800' },
  { title: 'COMPLETED', value: '2', label: 'เสร็จแล้ว', colorClass: 'bg-emerald-50 text-emerald-700' },
  { title: 'IN PROGRESS', value: '2', label: 'กำลังทำ', colorClass: 'bg-blue-50 text-blue-700' },
  { title: 'PLANNED', value: '4', label: 'วางแผน', colorClass: 'bg-violet-50 text-violet-700' },
];

const rows = [
  { quarter: 'Q1 2024', project: 'ระบบประเมินออนไลน์ Phase 1', owner: 'Sarah Williams', status: 'Completed', progress: '100%' },
  { quarter: 'Q1 2024', project: 'HR Dashboard Redesign', owner: 'Anna Rivera', status: 'Completed', progress: '100%' },
  { quarter: 'Q2 2024', project: 'KPI Framework Update', owner: 'Marcus Chen', status: 'In Progress', progress: '65%' },
  { quarter: 'Q2 2024', project: 'Promotion Workflow Automation', owner: 'James Lee', status: 'In Progress', progress: '40%' },
  { quarter: 'Q2 2024', project: 'Employee Self-Assessment', owner: 'David Park', status: 'Planned', progress: '0%' },
  { quarter: 'Q3 2024', project: 'Training Roadmap Integration', owner: 'Krisxandra C.', status: 'Planned', progress: '0%' },
  { quarter: 'Q3 2024', project: 'Mobile App for Evaluation', owner: 'Sarah Williams', status: 'Planned', progress: '0%' },
  { quarter: 'Q4 2024', project: 'Analytics & Reporting v2', owner: 'Marcus Chen', status: 'Planned', progress: '0%' },
];

export default function RoadmapReportPanel({ quarter }: { quarter: string; scope: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.map((item) => (
          <ReportCard key={item.title} {...item} />
        ))}
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm text-black">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Roadmap</h2>
        <ReportTable
          columns={[
            { header: 'ไตรมาส', key: 'quarter' },
            { header: 'โปรเจกต์', key: 'project' },
            { header: 'เจ้าของ', key: 'owner' },
            { header: 'สถานะ', key: 'status', align: 'center' },
            { header: 'Progress', key: 'progress', align: 'right' },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}