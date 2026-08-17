"use client";

import BaseSelect from "../BaseSelect";

export default function CompanySelect({
  value,
  onChange,
  placeholder = "เลือกบริษัท",
  allowClear = true,
  disabled = false,
  reloadKey = "",
}) {
  return (
    <BaseSelect
      api="/api/admin/companies"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      reloadKey={reloadKey}
      valueField="id"
      labelField={(item) =>
        `${item.company_code} - ${item.company_name_th}`
      }
    />
  );
}