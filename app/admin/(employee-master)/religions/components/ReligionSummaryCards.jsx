"use client";

import {
  SafetyOutlined,
  CheckCircleOutlined,
  StopOutlined,
  StarOutlined,
} from "@ant-design/icons";

import MasterSummaryCards from "@/app/admin/(employee-master)/components/master/MasterSummaryCards";

export default function ReligionSummaryCards({
  summary = {},
}) {
  return (
    <MasterSummaryCards
      items={[
        {
          title: "ศาสนาทั้งหมด",
          value: summary.total ?? 0,
          icon: <SafetyOutlined />,
          iconClassName: "text-blue-500",
        },

        {
          title: "ใช้งาน",
          value: summary.active ?? 0,
          icon: <CheckCircleOutlined />,
          iconClassName: "text-green-500",
        },

        {
          title: "ไม่ใช้งาน",
          value: summary.inactive ?? 0,
          icon: <StopOutlined />,
          iconClassName: "text-red-500",
        },

        {
          title: "Default",
          value:
            summary.defaultReligion ??
            0,
          icon: <StarOutlined />,
          iconClassName: "text-amber-500",
        },
      ]}
    />
  );
}