"use client";

import BaseSelect from "../BaseSelect";

export default function PositionSelect({
  unitId = "",
  ...props
}) {
  return (
    <BaseSelect
      api="/api/admin/positions"
      valueField="id"
      labelField={(item) =>
        `${item.position_code} - ${item.position_name}`
      }
      params={{
        unit_id: unitId,
      }}
      placeholder="เลือกตำแหน่ง"
      {...props}
    />
  );
}