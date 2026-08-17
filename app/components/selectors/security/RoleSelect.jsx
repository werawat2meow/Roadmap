"use client";

import BaseSelect from "../BaseSelect";

export default function RoleSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/roles"
      valueField="id"
      labelField={(item) =>
        `${item.role_code} - ${item.role_name}`
      }
      placeholder="เลือก Role"
      {...props}
    />
  );
}