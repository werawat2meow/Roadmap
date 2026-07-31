"use client";

import {
  Row,
  Col,
  Card,
  Statistic,
} from "antd";

import {
  DollarOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";

export default function SalaryComponentSummaryCards({
  summary = {},
}) {
  return (
    <Row gutter={16}>
      <Col xs={24} md={8}>
        <Card>
          <Statistic
            title="รายการทั้งหมด"
            value={summary.total || 0}
            prefix={<DollarOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card>
          <Statistic
            title="ใช้งาน"
            value={summary.active || 0}
              styles={{
                content: { color: '#3f8600' }, 
              }}
            prefix={
              <CheckCircleOutlined />
            }
          />
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card>
          <Statistic
            title="ยกเลิก"
            value={
              summary.inactive || 0
            }
            styles={{
              content: { color: '#cf1322' }, 
            }}
            prefix={<StopOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
}