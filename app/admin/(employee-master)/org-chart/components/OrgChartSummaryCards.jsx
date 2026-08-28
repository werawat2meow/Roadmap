"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  ApartmentOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  UserDeleteOutlined,
} from "@ant-design/icons";

function SummaryCard({
  title,
  value,
  prefix,
}) {
  return (
    <Card
      style={{
        flex: "1 1 200px",
        minWidth: 180,
      }}
    >
      <Statistic
        title={title}
        value={value || 0}
        prefix={prefix}
      />
    </Card>
  );
}

export default function OrgChartSummaryCards({
  summary = {},
}) {
  return (
    <Flex
      wrap="wrap"
      gap={16}
      style={{
        width: "100%",
        minWidth: 0,
      }}
    >
      <SummaryCard
        title="Position Slot"
        value={
          summary.total_slots
        }
        prefix={
          <ApartmentOutlined />
        }
      />

      <SummaryCard
        title="อัตรากำลังรวม"
        value={
          summary.total_capacity
        }
        prefix={
          <TeamOutlined />
        }
      />

      <SummaryCard
        title="ครองแล้ว"
        value={summary.filled}
        prefix={
          <CheckCircleOutlined />
        }
      />

      <SummaryCard
        title="ว่าง"
        value={summary.vacant}
        prefix={
          <UserDeleteOutlined />
        }
      />
    </Flex>
  );
}
