"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

export default function EmployeeCompensationSummaryCards({ stats = {} }) {
  const cards = [
    {
      title: "พนักงานที่มีเงินเดือนปัจจุบัน",
      value: stats.current || 0,
      icon: <DollarOutlined />,
    },
    {
      title: "รออนุมัติการปรับเงินเดือน",
      value: stats.pending || 0,
      icon: <ClockCircleOutlined />,
    },
    {
      title: "Adjustment ฉบับร่าง",
      value: stats.draft || 0,
      icon: <FileTextOutlined />,
    },
    {
      title: "อนุมัติแล้ว",
      value: stats.approved || 0,
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {cards.map((item) => (
        <Col xs={24} sm={12} xl={6} key={item.title}>
          <Card className="h-full rounded-2xl border-slate-200 shadow-sm">
            <Statistic
              title={item.title}
              value={item.value}
              prefix={item.icon}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
