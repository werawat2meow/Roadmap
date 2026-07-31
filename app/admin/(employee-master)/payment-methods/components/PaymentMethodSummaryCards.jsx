"use client";

import {
  BankOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DollarOutlined,
} from "@ant-design/icons";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

export default function PaymentMethodSummaryCards({
  summary = {},
}) {
  return (
    <MasterSummaryCards
      items={[
        {
          title: "วิธีการจ่ายทั้งหมด",
          value: summary.total ?? 0,
          icon: <CreditCardOutlined />,
          iconClassName: "text-blue-500",
        },

        {
          title: "กำลังใช้งาน",
          value: summary.active ?? 0,
          icon: <CheckCircleOutlined />,
          iconClassName: "text-green-500",
        },

        {
          title: "รองรับ Payroll",
          value: summary.payroll ?? 0,
          icon: <DollarOutlined />,
          iconClassName: "text-violet-500",
        },

        {
          title: "Bank Transfer",
          value: summary.bankTransfer ?? 0,
          icon: <BankOutlined />,
          iconClassName: "text-orange-500",
        },
      ]}
    />
  );
}