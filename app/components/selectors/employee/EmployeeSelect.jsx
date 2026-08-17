"use client";

import BaseSelect from "../BaseSelect";

export default function EmployeeSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/employees"
      valueField="id"
      labelField={(item) =>
        `${item.employee_code} - ${item.full_name_th}`
      }
      placeholder="เลือกพนักงาน"
      {...props}
    />
  );
}