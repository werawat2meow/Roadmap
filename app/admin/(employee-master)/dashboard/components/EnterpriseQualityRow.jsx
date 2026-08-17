"use client";

import { Progress, Typography } from "antd";

const { Text } = Typography;

export default function EnterpriseQualityRow({
  label,
  value = 0,
  total = 0,
  percent = 0,
  note,
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <Text className="font-medium text-slate-700">{label}</Text>
          <div className="mt-0.5 text-xs text-slate-400">
            {Number(value || 0).toLocaleString("th-TH")} /{" "}
            {Number(total || 0).toLocaleString("th-TH")} คน
          </div>
          {note ? (
            <div className="mt-1 text-[11px] text-slate-400">{note}</div>
          ) : null}
        </div>

        <Text strong>{Number(percent || 0).toFixed(1)}%</Text>
      </div>

      <Progress
        percent={Math.max(0, Math.min(Number(percent || 0), 100))}
        showInfo={false}
      />
    </div>
  );
}
