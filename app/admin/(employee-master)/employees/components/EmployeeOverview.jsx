"use client";

import { Users, UserRoundCheck, Clock3, UserRoundX } from "lucide-react";

const groups = [
  { key: "regular", label: "พนักงานประจำ", color: "#10b981", icon: UserRoundCheck },
  { key: "probation", label: "พนักงานทดลองงาน", color: "#f59e0b", icon: Clock3 },
  { key: "resigned", label: "ลาออกแล้ว", color: "#f87171", icon: UserRoundX },
];

export default function EmployeeOverview({ summary, loading }) {
  const total = Math.max(0, Number(summary.total) || 0);
  const segments = groups.map((group) => ({ ...group, value: Math.max(0, Number(summary[group.key]) || 0) }));
  const accounted = segments.reduce((sum, segment) => sum + segment.value, 0);
  const other = Math.max(0, total - accounted);
  if (other > 0) segments.push({ key: "other", label: "สถานะอื่น", color: "#cbd5e1", value: other });

  let cursor = 0;
  const gradient = segments.map(({ color, value }) => {
    const start = cursor;
    cursor += total ? (value / total) * 100 : 0;
    return `${color} ${start}% ${cursor}%`;
  }).join(", ");

  const cards = [
    { key: "total", label: "พนักงานทั้งหมด", value: total, color: "#2563eb", icon: Users },
    ...groups.map(({ key, label, color, icon }) => ({ key, label, color, icon, value: Math.max(0, Number(summary[key]) || 0) })),
  ];

  return (
    <section className="space-y-6" aria-label="ภาพรวมพนักงาน">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, label, value, color, icon: Icon }) => (
          <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-600">{label}</span>
              <span className="rounded-xl p-2" style={{ color, backgroundColor: `${color}18` }}><Icon size={20} /></span>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{loading ? "—" : value.toLocaleString("th-TH")} <span className="text-sm font-normal text-slate-500">คน</span></p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">สัดส่วนสถานะพนักงาน</h2>
        <div className="mt-6 flex flex-col items-center gap-8 md:flex-row md:justify-center md:gap-16">
          <div className="grid aspect-square w-56 shrink-0 place-items-center rounded-full" role="img" aria-label={`พนักงานทั้งหมด ${total} คน`} style={{ background: total > 0 ? `conic-gradient(${gradient})` : "#e2e8f0" }}>
            <div className="grid h-36 w-36 place-content-center rounded-full bg-white text-center">
              <span className="text-sm text-slate-500">ทั้งหมด</span>
              <strong className="text-3xl text-slate-900">{loading ? "—" : total.toLocaleString("th-TH")}</strong>
              <span className="text-xs text-slate-500">คน</span>
            </div>
          </div>
          <ul className="w-full max-w-xs space-y-3">
            {segments.map(({ key, label, color, value }) => (
              <li key={key} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2 text-slate-600"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />{label}</span>
                <strong className="text-slate-900">{loading ? "—" : value.toLocaleString("th-TH")} คน</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
