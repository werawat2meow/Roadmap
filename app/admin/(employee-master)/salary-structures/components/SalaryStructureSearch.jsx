"use client";

import { Button, Card, Input, Space } from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

export default function SalaryStructureSearch({
  value,
  onChange,
  onSearch,
  onReset,
  loading = false,
}) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Input
          allowClear
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          onPressEnter={() => onSearch?.()}
          placeholder="ค้นหาชื่อโครงสร้างเงินเดือน"
          prefix={<SearchOutlined className="text-slate-400" />}
          className="w-full lg:max-w-xl"
          size="large"
        />

        <Space wrap>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={onSearch}
            loading={loading}
          >
            ค้นหา
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={onReset}
            disabled={loading}
          >
            ล้างตัวกรอง
          </Button>
        </Space>
      </div>
    </Card>
  );
}
