"use client";

import { Select } from "antd";

import MasterSearchBar from "@/app/admin/(employee-master)/components/master/MasterSearchBar";

export default function GenderSearch({
  loading = false,

  search,
  onSearch,

  status,
  onStatusChange,

  onRefresh,
}) {
  return (
    <MasterSearchBar
      value={search}
      onChange={onSearch}
      loading={loading}
      onRefresh={onRefresh}
      placeholder="ค้นหารหัสเพศ / ชื่อเพศ"
      rightContent={
        <Select
          allowClear
          placeholder="สถานะ"
          value={status}
          onChange={onStatusChange}
          style={{
            width: 160,
          }}
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
        />
      }
    />
  );
}