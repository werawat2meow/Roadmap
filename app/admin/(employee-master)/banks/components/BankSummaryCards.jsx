"use client";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

export default function BankSummaryCards({
  summary = {},
}) {
  const items = [
    {
      title: "ธนาคารทั้งหมด",
      value: summary.total || 0,
      color: "#1677ff",
    },
    {
      title: "เปิดใช้งาน",
      value: summary.active || 0,
      color: "#52c41a",
    },
    {
      title: "รองรับ Payroll",
      value: summary.payroll || 0,
      color: "#722ed1",
    },
    {
      title: "รองรับ PromptPay",
      value: summary.promptpay || 0,
      color: "#fa8c16",
    },
  ];

  return (
    <MasterSummaryCards
      items={items}
    />
  );
}