"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

export default function ForeignEmploymentSchemeSummaryCards({
  summary = {},
  loading = false,
}) {
  return (
    <Row>
      <Col xs={24} md={8}>
        <Card size="small" loading={loading}>
          <Statistic
            title="ทั้งหมด"
            value={summary.total || 0}
            prefix={
              <SafetyCertificateOutlined />
            }
          />
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card size="small" loading={loading}>
          <Statistic
            title="ใช้งาน"
            value={summary.active || 0}
            prefix={
              <CheckCircleOutlined />
            }
          />
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card size="small" loading={loading}>
          <Statistic
            title="ไม่ใช้งาน"
            value={summary.inactive || 0}
            prefix={<StopOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
}
