"use client";

import BaseSelect from "../BaseSelect";

export default function PayrollTypeSelect({
  value,
  onChange,
  placeholder = "เลือกประเภท Payroll",
  allowClear = true,
  disabled = false,
  reloadKey = "",
  activeOnly = true,
  ...props
}) {
  return (
    <BaseSelect
      {...props}
      api="/api/admin/payroll-types"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      reloadKey={reloadKey}
      valueField="id"
      params={{
        status: activeOnly ? "active" : "",
      }}
      labelField={(item) => {
        const code =
          item.payroll_type_code || "";

        const name =
          item.payroll_type_name || "";

        const frequency =
          item.payment_frequency || "";

        const paymentDay =
          item.default_payment_day;

        const details = [];

        if (frequency) {
          details.push(
            getFrequencyLabel(frequency)
          );
        }

        if (paymentDay) {
          details.push(`จ่ายวันที่ ${paymentDay}`);
        }

        return `${code} - ${name}${
          details.length > 0
            ? ` (${details.join(" / ")})`
            : ""
        }`;
      }}
    />
  );
}

function getFrequencyLabel(value) {
  const labels = {
    monthly: "รายเดือน",
    daily: "รายวัน",
    weekly: "รายสัปดาห์",
    biweekly: "ทุก 2 สัปดาห์",
  };

  return labels[value] || value || "";
}