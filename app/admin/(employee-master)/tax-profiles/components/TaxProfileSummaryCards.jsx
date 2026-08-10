"use client";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

export default function TaxProfileSummaryCards({
  summary = {},
}) {
  const cards = [
    {
      key: "total",
      title: "โปรไฟล์ภาษีทั้งหมด",
      value: summary.total || 0,
      icon: <SafetyCertificateOutlined />,
      color: "#1677ff",
    },

    {
      key: "active",
      title: "ใช้งาน",
      value: summary.active || 0,
      icon: <CheckCircleOutlined />,
      color: "#52c41a",
    },

    {
      key: "inactive",
      title: "ไม่ใช้งาน",
      value: summary.inactive || 0,
      icon: <CloseCircleOutlined />,
      color: "#ff4d4f",
    },
  ];

  return (
    <MasterSummaryCards
      cards={cards}
    />
  );
}