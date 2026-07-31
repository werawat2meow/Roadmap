"use client";

import { Input, Button, Space } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

export default function PayrollGroupSearch({
  value,
  onChange,
  onRefresh,
  loading = false,
}) {
  return (
    <Space
      style={{
        width: "100%",
        justifyContent: "space-between",
      }}
      wrap
    >
      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="ค้นหารหัส หรือ ชื่อกลุ่มเงินเดือน"
        value={value}
        onChange={(e) =>
          onChange?.(e.target.value)
        }
        style={{
          width: 350,
        }}
      />

      <Button
        icon={<ReloadOutlined />}
        loading={loading}
        onClick={onRefresh}
      >
        รีเฟรช
      </Button>
    </Space>
  );
}