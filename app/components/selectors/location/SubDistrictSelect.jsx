"use client";

import BaseSelect from "../BaseSelect";

export default function SubDistrictSelect({districtCode = "",disabled = false,...props}) {
  const enabled = Boolean(districtCode);

  return (
    <BaseSelect
      {...props}
      api="/api/admin/thai-address"
      enabled={enabled}
      disabled={disabled || !enabled}
      params={{
        type: "subdistricts",
        district_code: districtCode,
      }}
      valueField="code"
      labelField={(item) =>
        `${item.name_th}`
      }
      placeholder="เลือกตำบล / แขวง"
    />
  );
}