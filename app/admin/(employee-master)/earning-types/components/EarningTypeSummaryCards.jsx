"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  DollarOutlined,
  StopOutlined,
  TagsOutlined,
} from "@ant-design/icons";

export default function EarningTypeSummaryCards({
  summary = {},
}) {
  return (
    <Row>
      <Col xs={12} lg={6}>
        <Card>
          <Statistic
            title="ทั้งหมด"
            value={summary.total || 0}
            prefix={<TagsOutlined />}
          />
        </Card>
      </Col>

      <Col xs={12} lg={6}>
        <Card>
          <Statistic
            title="ใช้งาน"
            value={summary.active || 0}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>

      <Col xs={12} lg={6}>
        <Card>
          <Statistic
            title="ไม่ใช้งาน"
            value={summary.inactive || 0}
            prefix={<StopOutlined />}
          />
        </Card>
      </Col>

      <Col xs={12} lg={6}>
        <Card>
          <Statistic
            title="คิดภาษี"
            value={summary.taxable || 0}
            prefix={<DollarOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
}
