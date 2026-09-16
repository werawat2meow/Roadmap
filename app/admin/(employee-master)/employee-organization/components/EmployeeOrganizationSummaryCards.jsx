"use client";

import { Card, Col, Row, Statistic } from "antd";

import {
  ApartmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  StopOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function EmployeeOrganizationSummaryCards({
  summary = {},
  loading = false,
}) {
  const items = [
    {
      title: "พนักงานทั้งหมด",
      value: summary.total || 0,
      icon: <TeamOutlined />,
    },
    {
      title: "กำลังทำงาน",
      value: summary.working || 0,
      icon: <CheckCircleOutlined />,
    },
    {
      title: "ทดลองงาน",
      value: summary.probation || 0,
      icon: <ClockCircleOutlined />,
    },
    {
      title: "ลาออก",
      value: summary.resigned || 0,
      icon: <StopOutlined />,
    },
    {
      title: "บริษัทที่มีพนักงาน",
      value: summary.company_count || 0,
      icon: <ShopOutlined />,
    },
    {
      title: "หน่วยงานที่มีพนักงาน",
      value: summary.unit_count || 0,
      icon: <ApartmentOutlined />,
    },
  ];

  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col key={item.title} xs={12} md={8} xl={4}>
          <Card loading={loading} className="h-full">
            <div className="flex items-center justify-between gap-3">
              <Statistic title={item.title} value={item.value} />
              <div className="text-2xl text-blue-500">{item.icon}</div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
