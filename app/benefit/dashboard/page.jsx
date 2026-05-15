"use client";

import { Card, Row, Col } from "antd";

export default function BenefitDashboardPage() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12} xl={6}>
        <Card>Total Requests</Card>
      </Col>

      <Col xs={24} md={12} xl={6}>
        <Card>Pending Approval</Card>
      </Col>

      <Col xs={24} md={12} xl={6}>
        <Card>Total Benefits</Card>
      </Col>

      <Col xs={24} md={12} xl={6}>
        <Card>Total Employees</Card>
      </Col>
    </Row>
  );
}