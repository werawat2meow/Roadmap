"use client";

import BaseSelect from "../BaseSelect";

export default function UnitSelect({
  divisionId = "",
  ...props
}) {
  return (
    <BaseSelect
      api="/api/admin/units"
      valueField="id"
      labelField={(item) =>
        `${item.unit_code} - ${item.unit_name}`
      }
      params={{
        division_id: divisionId,
      }}
      placeholder="เลือกหน่วยงาน"
      {...props}
    />
  );
}