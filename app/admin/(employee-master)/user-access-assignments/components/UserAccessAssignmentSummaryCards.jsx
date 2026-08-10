"use client";

import {
  ApartmentOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

export default function UserAccessAssignmentSummaryCards({
  total = 0,
  active = 0,
  primary = 0,
  scopes = 0,
}) {
  const items = [
    {
      title: "Assignment ทั้งหมด",
      value: total,
      subtitle: "รายการกำหนดบทบาททั้งหมด",
      icon: <SafetyCertificateOutlined />,
      iconClassName: "text-blue-400",
    },
    {
      title: "กำลังใช้งาน",
      value: active,
      subtitle: "Assignment สถานะ Active",
      icon: <LockOutlined />,
      iconClassName: "text-green-400",
    },
    {
      title: "บทบาทหลัก",
      value: primary,
      subtitle: "Assignment ที่เป็น Primary",
      icon: <UserOutlined />,
      iconClassName: "text-violet-400",
    },
    {
      title: "ขอบเขตสังกัด",
      value: scopes,
      subtitle: "Scope จากรายการในหน้านี้",
      icon: <ApartmentOutlined />,
      iconClassName: "text-orange-400",
    },
  ];

  return (
    <MasterSummaryCards
      items={items}
    />
  );
}