"use client";

import BaseSelect from "../BaseSelect";

export default function ProfitCenterSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/profit-centers"
      valueField="id"
      labelField={(item) =>
        `${item.profit_center_code} - ${item.profit_center_name}`
      }
      placeholder="เลือก Profit Center"
      {...props}
    />
  );
}