"use client";

import BaseSelect from "../BaseSelect";

export default function UserSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/users"
      valueField="id"
      labelField={(item) =>
        `${item.username} - ${item.full_name || ""}`
      }
      placeholder="เลือกผู้ใช้งาน"
      {...props}
    />
  );
}