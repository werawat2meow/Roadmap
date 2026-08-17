"use client";

import { Select } from "antd";
import {
  SCOPE_LABELS,
  SCOPE_TYPES,
} from "../utils/scopeUtils";

export default function ScopeTypeSelect({
  value,
  disabled = false,
  onChange,
}) {
  const options = SCOPE_TYPES.map((scopeType) => ({
    value: scopeType,
    label: SCOPE_LABELS[scopeType] || scopeType,
  }));

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        ประเภทขอบเขต

        <span className="ml-1 text-red-500">
          *
        </span>
      </label>

      <Select
        value={value || undefined}
        disabled={disabled}
        size="large"
        className="w-full"
        placeholder="เลือกประเภทขอบเขต"
        options={options}
        onChange={(nextValue) => {
          onChange(nextValue || "");
        }}
      />
    </div>
  );
}