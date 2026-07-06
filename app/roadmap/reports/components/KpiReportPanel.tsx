'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import ReportCard from './ReportCard';
import ReportTable from './ReportTable';

const summary = [
  { title: 'KPI ทั้งหมด', value: '9 ข้อ', label: 'จำนวน KPI', colorClass: 'bg-sky-50 text-sky-700' },
  { title: 'ACTIVE', value: '8 ข้อ', label: 'KPI ที่ใช้งาน', colorClass: 'bg-emerald-50 text-emerald-700' },
  { title: 'คะแนนต่ำสุด', value: '55%', label: 'KPI ต่ำสุด', colorClass: 'bg-rose-50 text-rose-700' },
  { title: 'คะแนนสูงสุด', value: '90%', label: 'KPI สูงสุด', colorClass: 'bg-teal-50 text-teal-700' },
];

const radarData = [
  { subject: 'Company', A: 83 },
  { subject: 'Department', A: 73 },
  { subject: 'Expectations', A: 73 },
  { subject: 'KPI', A: 88 },
  { subject: 'Behavior', A: 78 },
];

const groups = [
  { title: 'Company', items: ['Company Policy', 'Department Policy', 'Primary-Secondary Product'], rate: '83%' },
  { title: 'Department', items: ['Answer Walk-in correctly', 'Use walkie-talkie properly', 'Manage walk-in queues'], rate: '73%' },
  { title: 'Expectations', items: ['Problem Solving', 'Multi-task / Replace Staff', 'Responsibility & Decision'], rate: '73%' },
];

export default function KpiReportPanel({ quarter }: { quarter: string; scope: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.map((item) => (
          <ReportCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          {groups.map((group) => (
            <div key={group.title} className="mb-6 rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.title}</p>
                  <p className="text-xs text-slate-500">คะแนนเฉลี่ย {quarter}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  {group.rate}
                </span>
              </div>
              <div className="space-y-3">
                {group.items.map((item) => (
                  <div key={item} className="flex items-center justify-between text-sm text-slate-600">
                    <span>{item}</span>
                    <span className="text-slate-900">22/25</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">ภาพรวมสมรรถนะ</h2>
            <p className="text-sm text-slate-500">{quarter}</p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Score" dataKey="A" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
              ต่ำสุด : Multi-task / Replace Staff
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
              สูงสุด : Use walkie-talkie properly
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}