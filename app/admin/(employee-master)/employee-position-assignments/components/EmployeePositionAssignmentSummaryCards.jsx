"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  CrownOutlined,
  SwapOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export default function EmployeePositionAssignmentSummaryCards({
  summary = {},
  loading = false,
}) {
  return (
    <Row
      gutter={[
        12,
        12,
      ]}
    >

      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card
          loading={
            loading
          }
          className="shadow-sm"
        >
          <Statistic
            title="Assignment ทั้งหมด"
            value={
              summary.total ||
              0
            }
            prefix={
              <TeamOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card
          loading={
            loading
          }
          className="shadow-sm"
        >
          <Statistic
            title="Primary Assignment"
            value={
              summary.primary ||
              0
            }
            prefix={
              <CrownOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card
          loading={
            loading
          }
          className="shadow-sm"
        >
          <Statistic
            title="Acting / รักษาการ"
            value={
              summary.acting ||
              0
            }
            prefix={
              <SwapOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card
          loading={
            loading
          }
          className="shadow-sm"
        >
          <Statistic
            title="สถานะใช้งาน"
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

    </Row>
  );
}