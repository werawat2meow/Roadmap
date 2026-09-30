"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  FileProtectOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

export default function BenefitPolicyRuleSummaryCards({
  summary = {},
}) {
  return (
    <Row
      className="mb-4"
    >
      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card>
          <Statistic
            title="Policy ทั้งหมด"
            value={
              summary.total ||
              0
            }
            prefix={
              <FileProtectOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card>
          <Statistic
            title="Active"
            value={
              summary.active ||
              0
            }
            prefix={
              <CheckCircleOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card>
          <Statistic
            title="Inactive"
            value={
              summary.inactive ||
              0
            }
            prefix={
              <StopOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card>
          <Statistic
            title="Unlimited"
            value={
              summary.unlimited ||
              0
            }
            prefix={
              <ThunderboltOutlined />
            }
          />
        </Card>
      </Col>
    </Row>
  );
}
