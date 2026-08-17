"use client";

import BaseSelect from "../BaseSelect";

export default function EmployeeStatusSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/employee-statuses"
      valueField="id"
      labelField={(item) =>
        `${item.status_code} - ${item.status_name}`
      }
      placeholder="เลือกสถานะพนักงาน"
      {...props}
    />
  );
}