"use client";

import {
  Button,
  Card,
  Input,
  Select,
  Space,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";

export default function UserAccountSearch({
  loading = false,
  search = "",
  status,
  onSearch,
  onStatusChange,
  onRefresh,
}) {
  return (
    <Card size="small">
      <Space wrap size={12}>
        <Input.Search
          allowClear
          value={search}
          placeholder="ค้นหา Username / รหัสพนักงาน / ชื่อพนักงาน / Role"
          style={{ width: 380 }}
          onChange={(event) =>
            onSearch?.(event.target.value)
          }
          onSearch={(value) =>
            onSearch?.(value)
          }
        />

        <Select
          allowClear
          value={status}
          placeholder="สถานะทั้งหมด"
          style={{ width: 160 }}
          options={[
            {
              label: "ใช้งาน",
              value: "active",
            },
            {
              label: "ไม่ใช้งาน",
              value: "inactive",
            },
          ]}
          onChange={onStatusChange}
        />

        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={onRefresh}
        >
          รีเฟรช
        </Button>
      </Space>
    </Card>
  );
}
