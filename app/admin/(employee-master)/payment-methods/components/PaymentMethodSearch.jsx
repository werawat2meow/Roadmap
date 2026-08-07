"use client";

import { Select } from "antd";

import MasterSearchBar from "@/app/admin/(employee-master)/components/master/MasterSearchBar";

export default function PaymentMethodSearch({
  loading = false,

  search,
  onSearch,

  status,
  onStatusChange,

  paymentType,
  onPaymentTypeChange,

  supportsPayroll,
  onSupportsPayrollChange,

  supportsBenefit,
  onSupportsBenefitChange,

  supportsExpense,
  onSupportsExpenseChange,

  onRefresh,
}) {
  return (
    <MasterSearchBar
      value={search}
      onChange={onSearch}
      loading={loading}
      onRefresh={onRefresh}
      placeholder="ค้นหารหัส / ชื่อวิธีการจ่ายเงิน"
      rightContent={
        <>
          <Select
            allowClear
            placeholder="สถานะ"
            value={status}
            onChange={onStatusChange}
            style={{ width: 140 }}
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
            allowClear
            placeholder="ประเภท"
            value={paymentType}
            onChange={
              onPaymentTypeChange
            }
            style={{ width: 180 }}
            options={[
              {
                label: "Cash",
                value: "cash",
              },
              {
                label: "Bank Transfer",
                value: "bank_transfer",
              },
              {
                label: "PromptPay",
                value: "promptpay",
              },
              {
                label: "Cheque",
                value: "cheque",
              },
              {
                label: "Wallet",
                value: "wallet",
              },
              {
                label: "Crypto",
                value: "crypto",
              },
              {
                label: "Other",
                value: "other",
              },
            ]}
          />

          <Select
            allowClear
            placeholder="Payroll"
            value={supportsPayroll}
            onChange={
              onSupportsPayrollChange
            }
            style={{ width: 130 }}
            options={[
              {
                label: "รองรับ",
                value: true,
              },
              {
                label: "ไม่รองรับ",
                value: false,
              },
            ]}
          />

          <Select
            allowClear
            placeholder="Benefit"
            value={supportsBenefit}
            onChange={
              onSupportsBenefitChange
            }
            style={{ width: 130 }}
            options={[
              {
                label: "รองรับ",
                value: true,
              },
              {
                label: "ไม่รองรับ",
                value: false,
              },
            ]}
          />

          <Select
            allowClear
            placeholder="Expense"
            value={supportsExpense}
            onChange={
              onSupportsExpenseChange
            }
            style={{ width: 130 }}
            options={[
              {
                label: "รองรับ",
                value: true,
              },
              {
                label: "ไม่รองรับ",
                value: false,
              },
            ]}
          />
        </>
      }
    />
  );
}