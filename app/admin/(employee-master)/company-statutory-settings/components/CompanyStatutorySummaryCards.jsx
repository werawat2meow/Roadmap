"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  BankOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

export default function CompanyStatutorySummaryCards({ summary = {} }) {
  return (
    <Row >
      <Col xs={24} sm={12} xl={6}>
        <Card>
          <Statistic
            title="ทะเบียนทั้งหมด"
            value={Number(summary.total || 0)}
            prefix={<BankOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card>
          <Statistic
            title="ใช้งาน"
            value={Number(summary.active || 0)}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card>
          <Statistic
            title="มีเลขบัญชีนายจ้าง SSO"
            value={Number(summary.with_sso || 0)}
            prefix={<SafetyCertificateOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card>
          <Statistic
            title="มีเลขทะเบียน WCF"
            value={Number(summary.with_wcf || 0)}
            prefix={<SafetyOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
}
