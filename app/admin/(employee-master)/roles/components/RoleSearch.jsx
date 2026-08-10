"use client";

import {
  Select,
  Space,
} from "antd";

import MasterSearchBar from "@/app/admin/(employee-master)/components/master/MasterSearchBar";

/* =========================================================
   Constants
========================================================= */

const STATUS_OPTIONS = [
  {
    label: "ใช้งาน",
    value: "active",
  },
  {
    label: "ไม่ใช้งาน",
    value: "inactive",
  },
];

const ROLE_TYPE_OPTIONS = [
  {
    label: "Role ทั้งหมด",
    value: "all",
  },
  {
    label: "System Role",
    value: "system",
  },
  {
    label: "Role ทั่วไป",
    value: "custom",
  },
];

/* =========================================================
   Component
========================================================= */

export default function RoleSearch({
  search = "",

  status = "",

  roleType = "all",

  loading = false,

  onSearchChange,

  onStatusChange,

  onRoleTypeChange,

  onRefresh,
}) {
  return (
    <MasterSearchBar
      value={search}
      loading={loading}
      onRefresh={onRefresh}
      onChange={onSearchChange}
      placeholder="ค้นหารหัส Role, ชื่อ Role หรือรายละเอียด..."
      rightContent={
        <Space wrap>
          <Select
            className="min-w-40"
            value={roleType}
            options={ROLE_TYPE_OPTIONS}
            onChange={(value) =>
              onRoleTypeChange?.(
                value || "all"
              )
            }
          />

          <Select
            allowClear
            className="min-w-40"
            placeholder="กรองสถานะ"
            value={status || undefined}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              onStatusChange?.(
                value || ""
              )
            }
          />
        </Space>
      }
    />
  );
}