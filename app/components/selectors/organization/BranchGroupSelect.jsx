"use client";

import BaseSelect from "../BaseSelect";

export default function BranchGroupSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/branch-groups"
      valueField="id"
      labelField={(item) =>
        `${item.group_code} - ${item.group_name}`
      }
      placeholder="เลือกกลุ่มสาขา"
      {...props}
    />
  );
}