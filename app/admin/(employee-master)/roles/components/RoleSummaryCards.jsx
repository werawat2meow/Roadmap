"use client";

import {
  CheckCircleOutlined,
  KeyOutlined,
  SafetyOutlined,
  ToolOutlined,
} from "@ant-design/icons";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

/* =========================================================
   Component
========================================================= */

export default function RoleSummaryCards({
  total = 0,
  active = 0,
  system = 0,
  permissions = 0,
}) {
  const items = [
    {
      title: "Role ทั้งหมด",
      value: total,
      subtitle:
        "บทบาทผู้ใช้งานทั้งหมดในระบบ",
      icon: <SafetyOutlined />,
      iconClassName:
        "text-blue-400",
    },

    {
      title: "กำลังใช้งาน",
      value: active,
      subtitle:
        "Role ที่เปิดใช้งาน",
      icon: (
        <CheckCircleOutlined />
      ),
      iconClassName:
        "text-green-400",
    },

    {
      title: "System Role",
      value: system,
      subtitle:
        "Role หลักของระบบ",
      icon: <ToolOutlined />,
      iconClassName:
        "text-violet-400",
    },

    {
      title: "Permissions",
      value: permissions,
      subtitle:
        "สิทธิ์รวมจาก Role ในหน้านี้",
      icon: <KeyOutlined />,
      iconClassName:
        "text-orange-400",
    },
  ];

  return (
    <MasterSummaryCards
      items={items}
    />
  );
}