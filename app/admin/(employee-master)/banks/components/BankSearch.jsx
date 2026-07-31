"use client";

import { Select } from "antd";
import MasterSearchBar from "@/app/admin/(employee-master)/components/master/MasterSearchBar";

export default function BankSearch({
  search,
  onSearch,

  status,
  onStatusChange,

  supportsPayroll,
  onSupportsPayrollChange,

  promptpaySupported,
  onPromptpaySupportedChange,
}) {
  return (
    <MasterSearchBar
      placeholder="ค้นหารหัสธนาคาร, ชื่อธนาคาร, SWIFT Code..."
      value={search}
      onChange={onSearch}
      extra={
        <>
          <Select
            style={{ width: 170 }}
            allowClear
            placeholder="สถานะ"
            value={status || undefined}
            onChange={onStatusChange}
            options={[
              {
                label: "ใช้งาน",
                value: "active",
              },
              {
                label: "ไม่ใช้งาน",
                value: "inactive",
              },
            ]}
          />

          <Select
            style={{ width: 180 }}
            allowClear
            placeholder="Payroll"
            value={supportsPayroll}
            onChange={onSupportsPayrollChange}
            options={[
              {
                label: "รองรับ Payroll",
                value: "true",
              },
              {
                label: "ไม่รองรับ Payroll",
                value: "false",
              },
            ]}
          />

          <Select
            style={{ width: 190 }}
            allowClear
            placeholder="PromptPay"
            value={promptpaySupported}
            onChange={onPromptpaySupportedChange}
            options={[
              {
                label: "รองรับ PromptPay",
                value: "true",
              },
              {
                label: "ไม่รองรับ PromptPay",
                value: "false",
              },
            ]}
          />
        </>
      }
    />
  );
}