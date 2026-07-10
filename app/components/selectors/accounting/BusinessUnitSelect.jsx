"use client";

import BaseSelect from "../BaseSelect";

export default function BusinessUnitSelect(props) {
  return (
    <BaseSelect
      api="/api/admin/business-units"
      valueField="id"
      labelField={(item) =>
        `${item.business_unit_code} - ${item.business_unit_name}`
      }
      placeholder="เลือก Business Unit"
      {...props}
    />
  );
}