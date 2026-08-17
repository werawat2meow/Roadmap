"use client";

import { Select } from "antd";

import MasterSearchBar from "@/app/admin/(employee-master)/components/master/MasterSearchBar";

export default function TitleSearch({
  loading = false,

  search,
  onSearch,

  status,
  onStatusChange,

  gender,
  onGenderChange,

  onRefresh,
}) {
  return (
    <MasterSearchBar
      value={search}
      onChange={onSearch}
      loading={loading}
      onRefresh={onRefresh}
      placeholder="ค้นหารหัส / คำนำหน้า / ชื่อย่อ"
      rightContent={
        <>
          <Select
            allowClear
            placeholder="เพศ"
            value={gender}
            onChange={onGenderChange}
            style={{
              width: 140,
            }}
            options={[
              {
                label: "ชาย",
                value: "male",
              },
              {
                label: "หญิง",
                value: "female",
              },
              {
                label: "อื่นๆ",
                value: "other",
              },
            ]}
          />

          <Select
            allowClear
            placeholder="สถานะ"
            value={status}
            onChange={onStatusChange}
            style={{
              width: 140,
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
        </>
      }
    />
  );
}