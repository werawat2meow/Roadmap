"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const cards = [
  { key: "total", title: "โครงสร้างบริหารทั้งหมด", icon: <TeamOutlined /> },
  { key: "active", title: "ใช้งาน", icon: <CheckCircleOutlined /> },
  { key: "P12", title: "P12", icon: <ApartmentOutlined /> },
  { key: "P11", title: "P11", icon: <ApartmentOutlined /> },
  { key: "P10", title: "P10", icon: <ApartmentOutlined /> },
  { key: "P9", title: "P9", icon: <ApartmentOutlined /> },
];

export default function EmployeeBusinessStructureSummaryCards({ summary = {} }) {
  return (
    <Row >
      {cards.map((item) => (
        <Col key={item.key} xs={12} md={8} xl={4}>
          <Card size="small">
            <Statistic
              title={item.title}
              value={Number(summary?.[item.key] || 0)}
              prefix={item.icon}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
