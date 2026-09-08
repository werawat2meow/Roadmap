"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  CheckCircleOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function EmployeeStatutoryProfileSummaryCards({
  summary = {},
  loading = false,
}) {
  const cards = [
    {
      title: "ทั้งหมด",
      value: Number(summary?.total || 0),
      icon: <TeamOutlined />,
    },
    {
      title: "กำลังใช้งาน",
      value: Number(summary?.active || 0),
      icon: <CheckCircleOutlined />,
    },
    {
      title: "ตั้งค่าภาษีแล้ว",
      value: Number(summary?.taxConfigured || 0),
      icon: <FileProtectOutlined />,
    },
    {
      title: "ตั้งค่าประกันสังคมแล้ว",
      value: Number(summary?.socialSecurityConfigured || 0),
      icon: <SafetyCertificateOutlined />,
    },
  ];

  return (
    <Row gutter={[12, 12]}>
      {cards.map((item) => (
        <Col key={item.title} xs={12} lg={6}>
          <Card size="small" loading={loading} className="h-full">
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
