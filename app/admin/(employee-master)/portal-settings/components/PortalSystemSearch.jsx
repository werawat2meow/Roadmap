"use client";

import {
  Button,
  Input,
  Select,
  Space,
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const statusOptions = [
  {
    label: "ทุกสถานะ",
    value: "",
  },
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

export default function PortalSystemSearch({
  search = "",

  status = "",

  loading = false,

  onSearchChange,

  onStatusChange,

  onRefresh,

  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <Space
        wrap
        className="!w-full md:!w-auto"
      >
        <Input
          allowClear
          value={search}
          prefix={
            <SearchOutlined />
          }
          placeholder="ค้นหารหัส หรือชื่อระบบ"
          className="!w-full md:!w-[320px]"
          onChange={(event) =>
            onSearchChange?.(
              event.target.value
            )
          }
        />

        <Select
          value={status}
          options={
            statusOptions
          }
          className="!w-[150px]"
          onChange={
            onStatusChange
          }
        />
      </Space>

      <Space>
        <Button
          icon={
            <ReloadOutlined />
          }
          loading={loading}
          onClick={onRefresh}
        >
          รีเฟรช
        </Button>

        <Button
          type="primary"
          icon={
            <PlusOutlined />
          }
          onClick={onCreate}
        >
          เพิ่มระบบ
        </Button>
      </Space>
    </div>
  );
}