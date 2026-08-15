"use client";

import { Card, Statistic, Tag, Typography } from "antd";

const { Text } = Typography;

export default function EnterpriseKpiCard({
  title,
  value = 0,
  suffix = "คน",
  note,
  icon,
  tag,
}) {
  return (
    <Card className="h-full rounded-2xl border-slate-200 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Text className="text-sm text-slate-500">{title}</Text>
            {tag ? <Tag>{tag}</Tag> : null}
          </div>

          <div className="mt-2">
            <Statistic
              value={Number(value || 0)}
              suffix={suffix}
              styles={{
                fontSize: 30,
                fontWeight: 800,
                color: "#0f172a",
              }}
            />
          </div>

          <Text className="text-xs text-slate-400">{note}</Text>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-700">
          {icon}
        </div>
      </div>
    </Card>
  );
}
