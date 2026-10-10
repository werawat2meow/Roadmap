"use client";

import { Empty, Space, Tag, Tooltip, Typography } from "antd";

const { Text } = Typography;
const COLORS = ["#2563eb", "#06b6d4", "#f59e0b", "#8b5cf6", "#10b981", "#f43f5e", "#64748b"];
const fmt = (value) => Number(value || 0).toLocaleString("th-TH");
const clean = (items = []) => (Array.isArray(items) ? items : [])
  .map((item) => ({ label: String(item.label || "ไม่ระบุ"), count: Math.max(0, Number(item.count) || 0) }))
  .filter((item) => item.count > 0);

// SVG charts: no additional NPM dependency; data is always sourced from the existing dashboard API.
const STATUS_PALETTE = {
  active: "#10b981", probation: "#3b82f6", resigned: "#ef4444",
  retired: "#8b5cf6", suspended: "#f59e0b", inactive: "#94a3b8",
};
const STATUS_TRANSLATIONS = {
  active: "กำลังทำงาน", probation: "ทดลองงาน", resigned: "ลาออก",
  retired: "เกษียณอายุ", suspended: "พักงาน", inactive: "ไม่ใช้งาน",
};
const EMPLOYMENT_PALETTE = ["#2563eb", "#0ea5e9", "#14b8a6", "#8b5cf6", "#f59e0b", "#64748b"];

function statusInfo(label) {
  const raw = String(label ?? "").trim();
  const upper = raw.toLowerCase().replace(/[\s_-]+/g, "");
  if (upper === "active" || /ปฏิบัติงาน|กำลังทำงาน|พนักงานประจำ/.test(raw)) return { key: "active", name: STATUS_TRANSLATIONS.active };
  if (upper === "probation" || /ทดลองงาน/.test(raw)) return { key: "probation", name: STATUS_TRANSLATIONS.probation };
  if (upper === "resigned" || /ลาออก/.test(raw)) return { key: "resigned", name: STATUS_TRANSLATIONS.resigned };
  if (upper === "retired" || /เกษียณ/.test(raw)) return { key: "retired", name: STATUS_TRANSLATIONS.retired };
  if (upper === "suspended" || /พักงาน|ระงับ/.test(raw)) return { key: "suspended", name: STATUS_TRANSLATIONS.suspended };
  if (upper === "inactive" || /ไม่ใช้งาน/.test(raw)) return { key: "inactive", name: STATUS_TRANSLATIONS.inactive };
  return { key: upper || "unknown", name: raw || "ไม่ระบุ" };
}

// Enterprise Donut: segmented concentric ring, accessible legend, totals and consistent status semantics.
// Numbers are always sourced from rows supplied by the scoped dashboard API.
export function WorkforceDonutChart({ rows = [], title = "สถานะพนักงาน" }) {
  const isStatus = title.includes("สถานะ");
  const records = clean(rows);
  const normalized = records.reduce((all, item) => {
    const info = isStatus ? statusInfo(item.label) : { key: item.label, name: item.label };
    const existing = all.find((r) => r.key === info.key);
    if (existing) existing.count += item.count;
    else all.push({ ...info, count: item.count });
    return all;
  }, []);
  const order = ["active", "probation", "suspended", "resigned", "retired", "inactive"];
  const data = isStatus ? normalized.sort((a,b) => {
    const ia=order.indexOf(a.key), ib=order.indexOf(b.key);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  }) : normalized.sort((a,b) => b.count - a.count);
  const total = data.reduce((sum,d) => sum + d.count, 0);
  if (!total) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`ยังไม่มีข้อมูล${title}`} />;

  const r = 89, track = 27, center = 125;
  const circumference = 2 * Math.PI * r;
  const gap = data.length > 1 ? Math.min(4, circumference / (data.length * 5)) : 0;
  let traveled = 0;
  const segments = data.map((row,i) => {
    const fraction = row.count / total;
    const portion = fraction * circumference;
    const item = {
      ...row,
      percent: fraction * 100,
      color: (isStatus ? STATUS_PALETTE[row.key] : null) || EMPLOYMENT_PALETTE[i % EMPLOYMENT_PALETTE.length],
      dash: Math.max(0, portion - gap),
      offset: -traveled,
      index: i,
    };
    traveled += portion;
    return item;
  });

  return <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: "clamp(16px, 3vw, 36px)", padding: "12px 0 2px" }}>
    <div style={{ position: "relative", width: "min(100%, 280px)", flex: "0 0 250px", maxWidth: "100%" }}>
      <svg viewBox="0 0 250 250" role="img" aria-label={`${title} รวม ${fmt(total)} คน`} style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 7px 12px rgba(15,23,42,.06))" }}>
        <circle cx={center} cy={center} r="110" fill="#f8fafc" />
        <circle cx={center} cy={center} r="72" fill="#fff" />
        <circle cx={center} cy={center} r={r} stroke="#e8edf5" strokeWidth={track} fill="none" />
        {segments.map((d) => <Tooltip key={`${d.key}-${d.index}`} title={`${d.name}: ${fmt(d.count)} คน (${d.percent.toFixed(1)}%)`}><circle cx={center} cy={center} r={r}
          stroke={d.color} strokeWidth={track} fill="none" strokeLinecap="butt"
          strokeDasharray={`${d.dash} ${circumference - d.dash}`}
          strokeDashoffset={d.offset} transform={`rotate(-90 ${center} ${center})`}>
          </circle></Tooltip>)}
        <circle cx={center} cy={center} r="67" fill="#fff" />
        <text x={center} y="103" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="500">พนักงานทั้งหมด</text>
        <text x={center} y="138" textAnchor="middle" fill="#0f172a" fontSize="32" fontWeight="750">{fmt(total)}</text>
        <text x={center} y="160" textAnchor="middle" fill="#64748b" fontSize="12">คน</text>
      </svg>
    </div>
    <div style={{ flex: "1 1 220px", width: "100%", minWidth: 0, display: "grid", gap: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, paddingBottom: 10, marginBottom: 2, borderBottom: "1px solid #e2e8f0" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>รายละเอียดสถานะ</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>จำนวน / สัดส่วน</Text>
      </div>
      {segments.map((d) => <Tooltip key={`${d.key}-${d.index}`} title={`${d.name}: ${fmt(d.count)} คน (${d.percent.toFixed(1)}%)`}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 0", borderBottom: "1px solid #f1f5f9" }}>
        <Space size={9} style={{ minWidth: 0 }}>
          <span aria-hidden="true" style={{ flexShrink: 0, display: "inline-block", width: 11, height: 11, borderRadius: 4, background: d.color }} />
          <Text style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</Text>
        </Space>
        <span style={{ whiteSpace: "nowrap", display: "inline-flex", alignItems: "baseline", gap: 7 }}>
          <Text strong style={{ fontSize: 14, fontVariantNumeric: "tabular-nums" }}>{fmt(d.count)}</Text>
          <Text type="secondary" style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{d.percent.toFixed(1)}%</Text>
        </span>
      </div></Tooltip>)}
      <div style={{ marginTop: 10 }}><Text type="secondary" style={{ fontSize: 11 }}>ข้อมูลตามสิทธิ์และขอบเขตการเข้าถึงของผู้ใช้งาน</Text></div>
    </div>
  </div>;
}

export function WorkforceBarChart({ rows = [], title = "พนักงานตามบริษัท", limit = 8 }) {
  const data = clean(rows).sort((a, b) => b.count - a.count).slice(0, limit);
  const max = Math.max(...data.map((d) => d.count), 1);
  if (!data.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`ยังไม่มีข้อมูล${title}`} />;
  return <div style={{ display: "grid", gap: 14 }} role="img" aria-label={title}>
    {data.map((d, i) => <Tooltip key={`${d.label}-${i}`} title={`${d.label}: ${fmt(d.count)} คน`}><div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5 }}><Text ellipsis={{ tooltip: d.label }} style={{ maxWidth: "80%" }}>{d.label}</Text><Text strong>{fmt(d.count)} คน</Text></div>
      <div style={{ height: 15, borderRadius: 5, background: "#eff3f8", overflow: "hidden" }}><div style={{ width: `${d.count / max * 100}%`, height: "100%", background: COLORS[i % COLORS.length], borderRadius: 5, transition: "width .35s ease" }} /></div>
    </div></Tooltip>)}
    {clean(rows).length > limit && <Text type="secondary" style={{ fontSize: 12 }}>แสดง {limit} รายการที่มีพนักงานมากที่สุด</Text>}
  </div>;
}

export function LifecycleComparisonChart({ kpi = {} }) {
  const periods = [
    { label: "เดือนนี้", joined: Number(kpi.new_this_month), left: Number(kpi.resigned_this_month) },
    { label: "ปีนี้", joined: Number(kpi.new_this_year), left: Number(kpi.resigned_this_year) },
  ];
  const valid = periods.filter((p) => Number.isFinite(p.joined) && Number.isFinite(p.left) && p.joined >= 0 && p.left >= 0);
  if (!valid.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีข้อมูลการเข้า–ออก" />;
  const maximum = Math.max(1, ...valid.flatMap((p) => [p.joined, p.left]));
  return <div style={{ display: "grid", gap: 22 }}>
    <Space wrap size={14}><Tag color="blue">เข้าใหม่</Tag><Tag color="orange">ลาออก</Tag></Space>
    {valid.map((p) => <div key={p.label} style={{ display: "grid", gap: 8 }}>
      <Text strong>{p.label}</Text>
      {[{ key: "เข้าใหม่", value: p.joined, color: "#2563eb" }, { key: "ลาออก", value: p.left, color: "#f59e0b" }].map((r) => <Tooltip key={r.key} title={`${p.label} ${r.key}: ${fmt(r.value)} คน`}><div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Text type="secondary" style={{ width: 48, fontSize: 12 }}>{r.key}</Text>
        <div style={{ flex: 1, height: 22, borderRadius: 5, background: "#eff3f8", overflow: "hidden" }}><div style={{ background: r.color, width: `${r.value / maximum * 100}%`, height: "100%", minWidth: r.value > 0 ? 3 : 0, borderRadius: 5, transition: "width .35s ease" }} /></div>
        <Text strong style={{ width: 52, textAlign: "right" }}>{fmt(r.value)}</Text>
      </div></Tooltip>)}
    </div>)}
    <Text type="secondary" style={{ fontSize: 12 }}>แสดงยอดสะสมเดือนนี้และปีนี้จาก API ไม่ใช่กราฟแนวโน้มรายเดือนย้อนหลัง</Text>
  </div>;
}


// Optional historical series. Only render points actually provided by a scoped dashboard API.
// Accepted fields per row: {month: "2026-01", joined: 4, left: 2}.
export function WorkforceTrendChart({ rows = [] }) {
  const values = (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      month: String(row?.month ?? row?.period ?? ""),
      joined: Number(row?.joined ?? row?.new_employees ?? row?.new_count),
      left: Number(row?.left ?? row?.resigned ?? row?.resigned_count),
    }))
    .filter((p) => /^\d{4}-(0[1-9]|1[0-2])$/.test(p.month) &&
      Number.isFinite(p.joined) && Number.isFinite(p.left) &&
      p.joined >= 0 && p.left >= 0)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12);

  if (values.length < 2) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
    description="ยังไม่มีข้อมูลรายเดือนย้อนหลังสำหรับกราฟแนวโน้ม" />;

  const width = 760, height = 290, left = 48, right = 20, top = 24, bottom = 54;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const max = Math.max(1, ...values.flatMap((r) => [r.joined, r.left]));
  const x = (i) => left + (i / Math.max(1, values.length - 1)) * plotWidth;
  const y = (val) => top + plotHeight - (val / max) * plotHeight;
  const points = (key) => values.map((row, i) => `${x(i)},${y(row[key])}`).join(" ");
  const shortLabel = (value) => {
    const [year, month] = value.split("-");
    return `${month}/${year.slice(2)}`;
  };
  return <div style={{ width: "100%" }}>
    <Space wrap size={14} style={{ marginBottom: 8 }}>
      <Tag color="blue">เข้าใหม่</Tag><Tag color="orange">ลาออก</Tag>
      <Text type="secondary" style={{ fontSize: 12 }}>ข้อมูลรายเดือนจริง</Text>
    </Space>
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img"
      aria-label="กราฟแนวโน้มพนักงานเข้าใหม่เทียบกับลาออกรายเดือน">
      {[0,.25,.5,.75,1].map((fraction) => <g key={fraction}>
        <line x1={left} y1={y(max*fraction)} x2={width-right} y2={y(max*fraction)}
          stroke="#e2e8f0" strokeDasharray="4 5" />
        <text x={left-10} y={y(max*fraction)+4} textAnchor="end" fontSize="11" fill="#64748b">
          {Math.round(max*fraction)}
        </text>
      </g>)}
      {values.map((p,i) => <text key={p.month} x={x(i)} y={height-22}
        fontSize="11" textAnchor="middle" fill="#64748b">{shortLabel(p.month)}</text>)}
      <polyline points={points("joined")} stroke="#2563eb" strokeWidth="3.5"
        strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <polyline points={points("left")} stroke="#f59e0b" strokeWidth="3.5"
        strokeLinejoin="round" strokeLinecap="round" fill="none" />
      {values.map((p,i) => <g key={p.month}>
        <circle cx={x(i)} cy={y(p.joined)} r="4" fill="#2563eb">
          <title>{`${p.month} เข้าใหม่ ${fmt(p.joined)} คน`}</title>
        </circle>
        <circle cx={x(i)} cy={y(p.left)} r="4" fill="#f59e0b">
          <title>{`${p.month} ลาออก ${fmt(p.left)} คน`}</title>
        </circle>
      </g>)}
    </svg>
  </div>;
}
