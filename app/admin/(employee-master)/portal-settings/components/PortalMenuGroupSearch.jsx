"use client";

import {
  Button,
  Select,
  Space,
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const STATUS_OPTIONS = [
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

export default function PortalMenuGroupSearch({
  systemId = "",
  status = "",
  systems = [],
  loading = false,
  onSystemChange,
  onStatusChange,
  onRefresh,
  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <Space wrap>
        <Select
          allowClear
          showSearch
          value={
            systemId ||
            undefined
          }
          placeholder="ทุกระบบ"
          options={systems}
          optionFilterProp="label"
          className="!w-[260px]"
          onChange={(value) =>
            onSystemChange?.(
              value || ""
            )
          }
        />

        <Select
          value={status}
          options={
            STATUS_OPTIONS
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
          เพิ่ม Group
        </Button>
      </Space>
    </div>
  );
}