"use client";

import BaseSelect from "../BaseSelect";

export default function EmploymentTypeSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/employment-types"
      valueField="id"
      labelField={(item) =>
        `${item.type_code} - ${item.type_name}`
      }
      placeholder="เลือกประเภทการจ้าง"
      {...props}
    />
  );
}