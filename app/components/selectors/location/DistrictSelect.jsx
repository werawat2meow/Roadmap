"use client";

import BaseSelect from "../BaseSelect";

export default function DistrictSelect({
  provinceCode = "",
  disabled = false,
  ...props
}) {
  const enabled = Boolean(provinceCode);

  return (
    <BaseSelect
      {...props}
      api="/api/admin/thai-address"
      enabled={enabled}
      disabled={disabled || !enabled}
      params={{
        type: "districts",
        province_code: provinceCode,
      }}
      valueField="code"
      labelField={(item) =>
        `${item.name_th}${item.name_en ? ` (${item.name_en})` : ""}`
      }
      placeholder="เลือกอำเภอ / เขต"
    />
  );
}