"use client";

import BaseSelect from "../BaseSelect";

export default function DivisionSelect({
  departmentId = "",
  ...props
}) {
  return (
    <BaseSelect
      api="/api/admin/divisions"
      valueField="id"
      labelField={(item) =>
        `${item.division_code} - ${item.division_name}`
      }
      params={{
        department_id: departmentId,
      }}
      placeholder="เลือกฝ่าย"
      {...props}
    />
  );
}