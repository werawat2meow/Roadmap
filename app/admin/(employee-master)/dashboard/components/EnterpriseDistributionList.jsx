"use client";

import { Empty, Progress, Typography } from "antd";

const { Text } = Typography;

export default function EnterpriseDistributionList({
  rows = [],
  total = 0,
  emptyText = "ไม่มีข้อมูล",
  suffix = "คน",
}) {
  if (!rows.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyText}
      />
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((item) => {
        const percent =
          Number(total || 0) > 0
            ? Math.round((Number(item.count || 0) / Number(total)) * 100)
            : 0;

        return (
          <div key={item.id || item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-4">
              <Text className="min-w-0 truncate font-medium text-slate-700">
                {item.label || "ไม่ระบุ"}
              </Text>
              <Text className="shrink-0 text-xs text-slate-500">
                {Number(item.count || 0).toLocaleString("th-TH")} {suffix}
              </Text>
            </div>

            <Progress
              percent={percent}
              showInfo={false}
              size="small"
            />
          </div>
        );
      })}
    </div>
  );
}
