'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ReportCard from './ReportCard';
import ReportTable from './ReportTable';

const summary = [
  { title: 'ทั้งหมด', value: '6 คน', label: 'พนักงานทั้งหมด', colorClass: 'bg-slate-50 text-slate-800' },
  { title: 'อนุมัติ', value: '2 คน', label: 'ผ่าน', colorClass: 'bg-emerald-50 text-emerald-700' },
  { title: 'รอดูผล', value: '2 คน', label: 'รอยืนยัน', colorClass: 'bg-amber-50 text-amber-700' },
  { title: 'ไม่ผ่าน', value: '2 คน', label: 'ไม่ผ่าน', colorClass: 'bg-rose-50 text-rose-700' },
];

const readinessData = [
  { name: 'P2→P3', value: 79 },
  { name: 'P3→P4', value: 78 },
  { name: 'P4→P5', value: 81 },
];

const pieData = [
  { name: 'อนุมัติ', value: 33 },
  { name: 'รอดการอนุมัติ', value: 33 },
  { name: 'ไม่ผ่าน', value: 34 },
];

const colors = ['#10B981', '#F59E0B', '#EF4444'];

const rows = [
  { employee: 'Krisxandra Capitle', team: 'Restaurant Op.', next: 'Sr. Hostess', level: 'P3→P4', readiness: '82%', status: 'รอดอนุมัติ' },
  { employee: 'Marcus Chen', team: 'Marketing', next: 'Sr. Designer', level: 'P4→P5', readiness: '91%', status: 'อนุมัติ' },
  { employee: 'Sarah Williams', team: 'Engineering', next: 'Tech Lead', level: 'P4→P5', readiness: '88%', status: 'อนุมัติ' },
  { employee: 'David Park', team: 'Finance', next: 'Sr. Analyst', level: 'P3→P4', readiness: '74%', status: 'ไม่ผ่าน' },
];

export default function PromotionReportPanel({ quarter }: { quarter: string; scope: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.map((item) => (
          <ReportCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">สัดส่วนการอนุมัติ</h2>
            <p className="text-sm text-slate-500">{quarter}</p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                    {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={colors[index]} />
                    ))}
                    </Pie>

                    <Tooltip
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{ borderRadius: 16, borderColor: '#e2e8f0' }}
                    />

                    <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    formatter={(value) => <span className="text-sm text-slate-700">{value}</span>}
                    />
                </PieChart>
                </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Readiness ตามระดับ</h2>
          <div className="space-y-4">
            {readinessData.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{item.name}</span>
                  <span className="font-semibold text-slate-900">{item.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
            <span>อัตราการอนุมัติ</span>
            <span className="font-semibold text-slate-900">33%</span>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm text-black">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">รายชื่อการเลื่อนตำแหน่ง</h2>
        <ReportTable
          columns={[
            { header: 'พนักงาน', key: 'employee' },
            { header: 'แผนก', key: 'team' },
            { header: 'ตำแหน่งใหม่', key: 'next' },
            { header: 'LEVEL', key: 'level' },
            { header: 'Readiness', key: 'readiness', align: 'center' },
            { header: 'สถานะ', key: 'status', align: 'center' },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}