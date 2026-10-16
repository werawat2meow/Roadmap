"use client";

import { Empty, Progress, Typography } from "antd";

const { Text } = Typography;
const fmt = (v) => Number(v || 0).toLocaleString("th-TH");

const STATUS = {
  active: { name: "กำลังทำงาน", color: "#10b981" },
  probation: { name: "ทดลองงาน", color: "#3b82f6" },
  suspended: { name: "พักงาน", color: "#f59e0b" },
  resigned: { name: "ลาออก", color: "#f43f5e" },
  retired: { name: "เกษียณ", color: "#8b5cf6" },
  inactive: { name: "ไม่ใช้งาน", color: "#94a3b8" },
};
const ORDER = ["active", "probation", "suspended", "resigned", "retired", "inactive"];

function statusKey(label) {
  const raw = String(label ?? "").trim();
  const k = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (k === "active" || /ปฏิบัติงาน|กำลังทำงาน|พนักงานประจำ/.test(raw)) return "active";
  if (k === "probation" || /ทดลองงาน/.test(raw)) return "probation";
  if (k === "resigned" || /ลาออก/.test(raw)) return "resigned";
  if (k === "retired" || /เกษียณ/.test(raw)) return "retired";
  if (k === "suspended" || /พักงาน|ระงับ/.test(raw)) return "suspended";
  if (k === "inactive" || /ไม่ใช้งาน/.test(raw)) return "inactive";
  return "inactive";
}

/** Compact donut + simple legend (ไม่แสดงตารางรายละเอียด) */
export function StatusDonut({ rows = [] }) {
  const merged = {};
  (Array.isArray(rows) ? rows : []).forEach((r) => {
    const count = Math.max(0, Number(r?.count) || 0);
    if (!count) return;
    const key = statusKey(r?.label);
    merged[key] = (merged[key] || 0) + count;
  });
  const data = ORDER.filter((k) => merged[k]).map((k) => ({ key: k, count: merged[k], ...STATUS[k] }));
  const total = data.reduce((s, d) => s + d.count, 0);

  if (!total) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีข้อมูลสถานะพนักงาน" />;

  const r = 78, stroke = 18, c = 110;
  const circ = 2 * Math.PI * r;
  const gap = data.length > 1 ? 5 : 0;
  let used = 0;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
      <div className="relative w-[210px] max-w-full shrink-0">
        <svg viewBox="0 0 220 220" role="img" aria-label={`พนักงานทั้งหมด ${fmt(total)} คน`} className="block w-full">
          <circle cx={c} cy={c} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {data.map((d) => {
            const len = (d.count / total) * circ;
            const seg = (
              <circle
                key={d.key}
                cx={c}
                cy={c}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0.1, len - gap)} ${circ}`}
                strokeDashoffset={-used}
                transform={`rotate(-90 ${c} ${c})`}
              >
                <title>{`${d.name}: ${fmt(d.count)} คน`}</title>
              </circle>
            );
            used += len;
            return seg;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400">ทั้งหมด</span>
          <span className="text-[32px] font-extrabold leading-tight tracking-tight text-slate-900">{fmt(total)}</span>
          <span className="text-xs text-slate-400">คน</span>
        </div>
      </div>

      <div className="grid w-full max-w-[260px] gap-3">
        {data.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              <Text className="text-[13px] text-slate-600">{d.name}</Text>
            </span>
            <span className="flex items-baseline gap-2">
              <Text strong className="tabular-nums">{fmt(d.count)}</Text>
              <Text type="secondary" className="w-12 text-right text-xs tabular-nums">
                {((d.count / total) * 100).toFixed(0)}%
              </Text>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Top-N horizontal bars ด้วย antd Progress */
export function TopBars({ rows = [], limit = 5, emptyText = "ยังไม่มีข้อมูล" }) {
  const data = (Array.isArray(rows) ? rows : [])
    .map((r) => ({ label: String(r?.label || "ไม่ระบุ"), count: Math.max(0, Number(r?.count) || 0) }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  const max = data[0].count;

  return (
    <div className="grid gap-5">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <Text ellipsis={{ tooltip: d.label }} className="min-w-0 text-[13px] font-medium text-slate-700">
              {d.label}
            </Text>
            <Text strong className="shrink-0 text-[13px] tabular-nums">{fmt(d.count)}</Text>
          </div>
          <Progress
            percent={(d.count / max) * 100}
            showInfo={false}
            size={["100%", 8]}
            strokeColor={{ from: "#60a5fa", to: "#6366f1" }}
            railColor="#f1f5f9"
          />
        </div>
      ))}
    </div>
  );
}
