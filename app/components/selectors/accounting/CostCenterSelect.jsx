"use client";

import BaseSelect from "../BaseSelect";

export default function CostCenterSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/cost-centers"
      valueField="id"
      labelField={(item) =>
        `${item.cost_center_code} - ${item.cost_center_name}`
      }
      placeholder="เลือก Cost Center"
      {...props}
    />
  );
}