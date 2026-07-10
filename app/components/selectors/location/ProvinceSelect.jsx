"use client";

import BaseSelect from "../BaseSelect";

export default function ProvinceSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/thai-address"
      params={{
        type: "provinces",
      }}
      valueField="code"
      labelField={(item) => item.name_th}
      placeholder="เลือกจังหวัด"
      {...props}
    />
  );
}