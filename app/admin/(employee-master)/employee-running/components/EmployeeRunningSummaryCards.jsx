"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FieldNumberOutlined,
  StopOutlined,
} from "@ant-design/icons";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

export default function EmployeeRunningSummaryCards({
  summary = {},
  loading = false,
}) {
  const items = [
    {
      title: "รายการ Running ทั้งหมด",

      value: loading
        ? "-"
        : summary.total || 0,

      subtitle:
        "จำนวน Running Number ทั้งหมด",

      icon: <FieldNumberOutlined />,

      className: "text-blue-600",

      iconClassName: "text-blue-200",
    },

    {
      title: "กำลังใช้งาน",

      value: loading
        ? "-"
        : summary.active || 0,

      subtitle:
        "รายการสถานะ Active",

      icon: <CheckCircleOutlined />,

      className: "text-emerald-600",

      iconClassName:
        "text-emerald-200",
    },

    {
      title: "ไม่ใช้งาน",

      value: loading
        ? "-"
        : summary.inactive || 0,

      subtitle:
        "รายการสถานะ Inactive",

      icon: <StopOutlined />,

      className: "text-red-600",

      iconClassName: "text-red-200",
    },

    {
      title: "เลขล่าสุดสูงสุด",

      value: loading
        ? "-"
        : summary.maxRunning || 0,

      subtitle:
        "เลข Current Running สูงสุด",

      icon: <ClockCircleOutlined />,

      className: "text-amber-600",

      iconClassName: "text-amber-200",
    },
  ];

  return (
    <MasterSummaryCards
      items={items}
    />
  );
}