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

/* =========================================================
   Component
========================================================= */

export default function UserAccessAssignmentSearch({
  search = "",

  roleId = undefined,

  status = undefined,

  roles = [],

  loading = false,

  masterLoading = false,

  onSearchChange,

  onRoleChange,

  onStatusChange,

  onRefresh,
}) {
  const roleOptions = roles.map(
    (role) => ({
      value: role.id,

      label: role.role_code
        ? `${role.role_code} - ${role.role_name}`
        : role.role_name || "-",

      disabled:
        role.is_active === false,
    })
  );

  return (
    <MasterSearchBar
      value={search}
      loading={loading}
      onRefresh={onRefresh}
      onChange={onSearchChange}
      placeholder="ค้นหา Username, รหัสพนักงาน, ชื่อพนักงาน หรือบทบาท..."
      rightContent={
        <Space wrap>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="บทบาทผู้ใช้งาน"
            className="min-w-56"
            loading={masterLoading}
            value={roleId || undefined}
            options={roleOptions}
            onChange={(value) =>
              onRoleChange?.(
                value || ""
              )
            }
          />

          <Select
            allowClear
            placeholder="สถานะ"
            className="min-w-40"
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