"use client";

import {
  Card,
  Flex,
  Statistic,
} from "antd";

import {
  CalculatorOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";

function money(
  value
) {
  return new Intl.NumberFormat(
    "th-TH",
    {
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  ).format(
    Number(value || 0)
  );
}

export default function PayrollRunSummaryCards({
  summary = {},
}) {
  const cards = [
    {
      title: "Payroll Run",
      value:
        summary.total ||
        0,
      icon:
        <CalculatorOutlined />,
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
      title: "Prepared",
      value:
        summary.prepared ||
        0,
      icon:
        <FileDoneOutlined />,
    },
    {
      title: "Completed",
      value:
        summary.completed ||
        0,
      icon:
        <CheckCircleOutlined />,
    },
    {
      title: "Net รวม",
      value:
        money(
          summary.net_total
        ),
      suffix: "บาท",
      icon:
        <DollarOutlined />,
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
              suffix={
                item.suffix
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
