"use client";

import { Input, Button, Space } from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

export default function SalaryComponentSearch({
  value = "",
  loading = false,
  onChange,
  onRefresh,
}) {
  return (
    <Space wrap>
      <Input.Search
        allowClear
        value={value}
        placeholder="ค้นหารหัส / ชื่อรายการเงินเดือน..."
        enterButton={<SearchOutlined />}
        style={{ width: 340 }}
        onChange={(e) =>
          onChange?.(e.target.value)
        }
        onSearch={(value) =>
          onChange?.(value)
        }
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