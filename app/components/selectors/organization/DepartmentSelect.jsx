"use client";

import BaseSelect from "../BaseSelect";

export default function DepartmentSelect({
  branchId = "",
  ...props
}) {
  return (
    <BaseSelect
      api="/api/admin/departments"
      valueField="id"
      labelField={(item) =>
        `${item.department_code} - ${item.department_name}`
      }
      params={{
        branch_id: branchId,
      }}
      placeholder="เลือกแผนก"
      {...props}
    />
  );
}