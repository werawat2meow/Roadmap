"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  BarChartOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  StarOutlined,
} from "@ant-design/icons";

export default function TaxRateSummaryCards({
  summary = {},
}) {
  const cards = [
    {
      title:
        "ชุดอัตราภาษี",
      value:
        summary.total ||
        0,
      icon:
        <BarChartOutlined />,
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
        "Progressive",
      value:
        summary.progressive ||
        0,
      icon:
        <FileTextOutlined />,
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
