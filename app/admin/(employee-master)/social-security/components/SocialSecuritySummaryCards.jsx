"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  SafetyOutlined,
  StarOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function SocialSecuritySummaryCards({
  summary = {},
}) {
  const cards = [
    {
      title:
        "ชุดตั้งค่า",
      value:
        summary.total ||
        0,
      icon:
        <SafetyOutlined />,
    },
    {
      title:
        "Active",
      value:
        summary.active ||
        0,
      icon:
        <CheckCircleOutlined />,
    },
    {
      title:
        "Default",
      value:
        summary.default ||
        0,
      icon:
        <StarOutlined />,
    },
    {
      title:
        "มาตรา 33",
      value:
        summary.section_33 ||
        0,
      icon:
        <TeamOutlined />,
    },
  ];

  return (
    <Flex
      wrap="wrap"
      gap={12}
      style={{
        width: "100%",
        minWidth: 0,
      }}
    >
      {cards.map(
        (item) => (
          <Card
            key={
              item.title
            }
            size="small"
            style={{
              flex:
                "1 1 190px",
              minWidth: 170,
            }}
          >
            <Statistic
              title={
                item.title
              }
              value={
                item.value
              }
              prefix={
                item.icon
              }
            />
          </Card>
        )
      )}
    </Flex>
  );
}
