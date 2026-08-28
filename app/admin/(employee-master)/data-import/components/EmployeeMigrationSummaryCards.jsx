"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  TeamOutlined,
} from "@ant-design/icons";

function SummaryCard({
  title,
  value,
  prefix,
}) {
  return (
    <Card
      style={{
        flex:
          "1 1 180px",
        minWidth:
          170,
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

export default function EmployeeMigrationSummaryCards({
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
        title="ทั้งหมด"
        value={summary.total}
        prefix={
          <TeamOutlined />
        }
      />

      <SummaryCard
        title="ผ่าน Validation"
        value={summary.valid}
        prefix={
          <CheckCircleOutlined />
        }
      />

      <SummaryCard
        title="ต้องแก้ไข"
        value={summary.invalid}
        prefix={
          <CloseCircleOutlined />
        }
      />

      <SummaryCard
        title="เพิ่มใหม่"
        value={summary.insert}
        prefix={
          <PlusCircleOutlined />
        }
      />

      <SummaryCard
        title="อัปเดตเดิม"
        value={summary.update}
        prefix={
          <SyncOutlined />
        }
      />
    </Flex>
  );
}
