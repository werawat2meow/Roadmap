"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  EditOutlined,
  FileProtectOutlined,
  LockOutlined,
} from "@ant-design/icons";

export default function HrPolicySummaryCards({
  summary = {},
}) {
  const cards = [
    {
      title: "นโยบายทั้งหมด",
      value: summary.total || 0,
      icon: <FileProtectOutlined />,
    },
    {
      title: "Draft",
      value: summary.draft || 0,
      icon: <EditOutlined />,
    },
    {
      title: "Published",
      value: summary.published || 0,
      icon: <CheckCircleOutlined />,
    },
    {
      title: "บังคับใช้",
      value: summary.mandatory || 0,
      icon: <LockOutlined />,
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
      {cards.map((item) => (
        <Card
          key={item.title}
          size="small"
          style={{
            flex: "1 1 190px",
            minWidth: 170,
          }}
        >
          <Statistic
            title={item.title}
            value={item.value}
            prefix={item.icon}
          />
        </Card>
      ))}
    </Flex>
  );
}
