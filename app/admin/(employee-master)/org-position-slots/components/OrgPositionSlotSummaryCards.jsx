"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  ApartmentOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  TeamOutlined,
} from "@ant-design/icons";

/* =========================================================
   Component
========================================================= */

export default function OrgPositionSlotSummaryCards({
  summary = {},
}) {
  return (
    <Row>
      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card className="shadow-sm">
          <Statistic
            title="Position Slot"
            value={
              summary.total ||
              0
            }
            prefix={
              <ApartmentOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card className="shadow-sm">
          <Statistic
            title="Planned Headcount"
            value={
              summary.capacity ||
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
        <Card className="shadow-sm">
          <Statistic
            title="Filled"
            value={
              summary.filled ||
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
        <Card className="shadow-sm">
          <Statistic
            title="Vacant"
            value={
              summary.vacant ||
              0
            }
            prefix={
              <HomeOutlined />
            }
          />
        </Card>
      </Col>
    </Row>
  );
}