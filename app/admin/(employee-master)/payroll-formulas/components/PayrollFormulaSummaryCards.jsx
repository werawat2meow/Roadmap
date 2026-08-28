"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  FunctionOutlined,
} from "@ant-design/icons";

function SummaryCard({
  title,
  value,
  prefix,
}) {
  return (
    <Card
      style={{
        flex: "1 1 220px",
        minWidth: 200,
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

export default function PayrollFormulaSummaryCards({
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
        title="สูตรทั้งหมด"
        value={summary.total}
        prefix={
          <FunctionOutlined />
        }
      />

      <SummaryCard
        title="ใช้งาน"
        value={summary.active}
        prefix={
          <CheckCircleOutlined />
        }
      />

      <SummaryCard
        title="สูตรรายได้"
        value={summary.earning}
        prefix={
          <DollarOutlined />
        }
      />

      <SummaryCard
        title="สูตรรายการหัก"
        value={summary.deduction}
        prefix={
          <FileTextOutlined />
        }
      />
    </Flex>
  );
}
