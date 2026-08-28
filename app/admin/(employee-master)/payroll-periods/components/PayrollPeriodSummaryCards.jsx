"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  LockOutlined,
} from "@ant-design/icons";

export default function PayrollPeriodSummaryCards({
  summary = {},
}) {
  const cards = [
    {
      title: "ทั้งหมด",
      value:
        summary.total ||
        0,
      icon:
        <CalendarOutlined />,
    },
    {
      title: "Draft",
      value:
        summary.draft ||
        0,
      icon:
        <ClockCircleOutlined />,
    },
    {
      title: "เปิดงวด",
      value:
        summary.open ||
        0,
      icon:
        <CheckCircleOutlined />,
    },
    {
      title: "ปิดงวด",
      value:
        summary.closed ||
        0,
      icon:
        <LockOutlined />,
    },
    {
      title:
        "ประมวลผลแล้ว",
      value:
        summary.processed ||
        0,
      icon:
        <FileDoneOutlined />,
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
                "1 1 180px",
              minWidth: 160,
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
