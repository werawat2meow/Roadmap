"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  CodeOutlined,
  SettingOutlined,
  TagsOutlined,
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
          "1 1 220px",
        minWidth:
          200,
      }}
    >
      <Statistic
        title={
          title
        }
        value={
          value ||
          0
        }
        prefix={
          prefix
        }
      />
    </Card>
  );
}

export default function FormulaVariableSummaryCards({
  summary = {},
}) {
  return (
    <Flex
      wrap="wrap"
      gap={16}
      style={{
        width:
          "100%",
        minWidth:
          0,
      }}
    >
      <SummaryCard
        title="ทั้งหมด"
        value={
          summary.total
        }
        prefix={
          <TagsOutlined />
        }
      />

      <SummaryCard
        title="ใช้งาน"
        value={
          summary.active
        }
        prefix={
          <CheckCircleOutlined />
        }
      />

      <SummaryCard
        title="ตัวแปรระบบ"
        value={
          summary.system
        }
        prefix={
          <SettingOutlined />
        }
      />

      <SummaryCard
        title="ตัวแปรกำหนดเอง"
        value={
          summary.custom
        }
        prefix={
          <CodeOutlined />
        }
      />
    </Flex>
  );
}
