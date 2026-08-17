"use client";

import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

export default function PositionLevelSearch({
  value,
  onChange,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Input
        allowClear
        size="large"
        prefix={<SearchOutlined />}
        placeholder="ค้นหา Code หรือ Position Level..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}