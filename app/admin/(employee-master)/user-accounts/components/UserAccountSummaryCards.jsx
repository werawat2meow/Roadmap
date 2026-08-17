"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function UserAccountSummaryCards({
  summary = {},
}) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={6}>
        <Card size="small">
          <Statistic
            title="ผู้ใช้งานทั้งหมด"
            value={summary.total || 0}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card size="small">
          <Statistic
            title="ใช้งาน"
            value={summary.active || 0}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card size="small">
          <Statistic
            title="ไม่ใช้งาน"
            value={summary.inactive || 0}
            prefix={<StopOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card size="small">
          <Statistic
            title="ยังไม่เคย Login"
            value={summary.never_login || 0}
            prefix={<ClockCircleOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
}
