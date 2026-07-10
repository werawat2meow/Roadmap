"use client";

import { Select } from "antd";

const countries = [
  {
    value: "TH",
    label: "ประเทศไทย",
  },
];

export default function CountrySelect({
  value,
  onChange,
  disabled = false,
}) {
  return (
    <Select
      size="large"
      value={value || "TH"}
      disabled={disabled}
      style={{ width: "100%" }}
      options={countries}
      onChange={onChange}
    />
  );
}