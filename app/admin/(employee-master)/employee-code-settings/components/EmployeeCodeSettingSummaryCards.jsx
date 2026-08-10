"use client";

import {
  ApartmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
} from "@ant-design/icons";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

export default function EmployeeCodeSettingSummaryCards({
  summary = {},
  loading = false,
}) {
  const items = [
    {
      title: "รูปแบบทั้งหมด",

      value: loading
        ? "-"
        : summary.total || 0,

      subtitle:
        "จำนวนรูปแบบรหัสพนักงานทั้งหมด",

      icon: <ApartmentOutlined />,

      className: "text-blue-600",

      iconClassName: "text-blue-200",
    },

    {
      title: "กำลังใช้งาน",

      value: loading
        ? "-"
        : summary.active || 0,

      subtitle:
        "เฉพาะข้อมูลในหน้าปัจจุบัน",

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
        "เฉพาะข้อมูลในหน้าปัจจุบัน",

      icon: <CloseCircleOutlined />,

      className: "text-red-600",

      iconClassName: "text-red-200",
    },

    {
      title: "รูปแบบหลัก",

      value: loading
        ? "-"
        : summary.defaultCount || 0,

      subtitle:
        "รูปแบบ Default ของแต่ละบริษัท",

      icon: <CrownOutlined />,

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