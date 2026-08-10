"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

export default function EmployeeSummaryCards({
  summary = {},
  loading = false,
}) {
  const items = [
    {
      title: "พนักงานทั้งหมด",

      value: loading
        ? "-"
        : summary.total || 0,

      subtitle:
        "จำนวนพนักงานทั้งหมดในระบบ",

      icon: <TeamOutlined />,

      className: "text-blue-600",

      iconClassName:
        "text-blue-200",
    },

    {
      title: "กำลังทำงาน",

      value: loading
        ? "-"
        : summary.active || 0,

      subtitle:
        "พนักงานสถานะ Active",

      icon:
        <CheckCircleOutlined />,

      className:
        "text-emerald-600",

      iconClassName:
        "text-emerald-200",
    },

    {
      title: "ทดลองงาน",

      value: loading
        ? "-"
        : summary.probation || 0,

      subtitle:
        "พนักงานอยู่ระหว่างทดลองงาน",

      icon:
        <ClockCircleOutlined />,

      className:
        "text-amber-600",

      iconClassName:
        "text-amber-200",
    },

    {
      title: "ลาออก",

      value: loading
        ? "-"
        : summary.resigned || 0,

      subtitle:
        "พนักงานสถานะ Resigned",

      icon: <StopOutlined />,

      className: "text-red-600",

      iconClassName:
        "text-red-200",
    },
  ];

  return (
    <MasterSummaryCards
      items={items}
    />
  );
}