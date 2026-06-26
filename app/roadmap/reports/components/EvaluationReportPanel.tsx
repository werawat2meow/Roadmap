'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ReportCard from './ReportCard';
import ReportTable from './ReportTable';

const summary = [
  { title: 'การประเมินทั้งหมด', value: '55 ครั้ง', label: 'รวมการประเมิน', colorClass: 'bg-slate-50 text-slate-800' },
  { title: 'เสร็จแล้ว', value: '38 ครั้ง', label: 'ผ่านการประเมิน', colorClass: 'bg-emerald-50 text-emerald-700' },
  { title: 'คะแนนเฉลี่ยรวม', value: '84.2%', label: 'คะแนนภาพรวม', colorClass: 'bg-rose-50 text-rose-700' },
  { title: 'อยู่ระหว่างดำเนินการ', value: '12 ครั้ง', label: 'ยังดำเนินการ', colorClass: 'bg-amber-50 text-amber-700' },
];

const chartData = [
  { name: 'Restaurant Op.', value: 80 },
  { name: 'Marketing', value: 90 },
  { name: 'Engineering', value: 92 },
  { name: 'Finance', value: 75 },
  { name: 'HR', value: 70 },
  { name: 'Operations', value: 82 },
];

const rows = [
  { department: 'Restaurant Op.', people: '12 คน', score: '80%', grade: 'B' },
  { department: 'Marketing', people: '8 คน', score: '88%', grade: 'B' },
  { department: 'Engineering', people: '15 คน', score: '91%', grade: 'A' },
  { department: 'Finance', people: '6 คน', score: '85%', grade: 'B' },
  { department: 'HR', people: '5 คน', score: '76%', grade: 'C' },
  { department: 'Operations', people: '9 คน', score: '83%', grade: 'B' },
];

export default function EvaluationReportPanel({ quarter }: { quarter: string; scope: string }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {summary.map((item) => (
          <ReportCard key={item.title} {...item} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">คะแนนเฉลี่ยตามแผนก</h2>
              <p className="text-sm text-slate-500">{quarter}</p>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip wrapperClassName="rounded-2xl shadow-lg" cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">คะแนนเฉลี่ยตามระดับ</h2>
          <div className="space-y-4">
            {[
              { label: 'P1', value: 72 },
              { label: 'P2', value: 78 },
              { label: 'P3', value: 83 },
              { label: 'P4', value: 88 },
              { label: 'P5', value: 92 },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-sm text-slate-500">
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm text-black">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">รายละเอียดคะแนนเฉลี่ยตามสังกัด</h2>
            <p className="text-sm text-slate-500">{quarter}</p>
          </div>
        </div>

        <ReportTable
          columns={[
            { header: 'แผนก', key: 'department' },
            { header: 'จำนวนพนักงาน', key: 'people' },
            { header: 'คะแนนเฉลี่ย', key: 'score', align: 'center' },
            { header: 'เกรด', key: 'grade', align: 'center' },
          ]}
          rows={rows}
        />
      </div>
    </div>
  );
}