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

/* =========================================================
   Options
========================================================= */

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

/* =========================================================
   Component
========================================================= */

export default function PortalMenuItemSearch({
  search = "",

  systemId = "",

  groupId = "",

  status = "",

  systems = [],

  groups = [],

  loading = false,

  onSearchChange,

  onSystemChange,

  onGroupChange,

  onStatusChange,

  onRefresh,

  onCreate,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <Space
        wrap
        className="!w-full"
      >
        {/* ===============================================
            Search
        =============================================== */}

        <Input
          allowClear
          value={search}
          prefix={
            <SearchOutlined />
          }
          placeholder="ค้นหาเมนู / Route / Permission"
          className="!w-full md:!w-[280px]"
          onChange={(event) =>
            onSearchChange?.(
              event.target.value
            )
          }
        />

        {/* ===============================================
            System
        =============================================== */}

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
          className="!w-[240px]"
          onChange={(value) =>
            onSystemChange?.(
              value || ""
            )
          }
        />

        {/* ===============================================
            Group
        =============================================== */}

        <Select
          allowClear
          showSearch
          value={
            groupId ||
            undefined
          }
          placeholder="ทุก Group"
          options={groups}
          optionFilterProp="label"
          className="!w-[220px]"
          onChange={(value) =>
            onGroupChange?.(
              value || ""
            )
          }
        />

        {/* ===============================================
            Status
        =============================================== */}

        <Select
          value={status}
          options={
            STATUS_OPTIONS
          }
          className="!w-[140px]"
          onChange={
            onStatusChange
          }
        />
      </Space>

      <Space className="shrink-0">
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
          เพิ่ม Menu
        </Button>
      </Space>
    </div>
  );
}