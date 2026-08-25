"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";

export default function UnitPositionSummaryCards({ summary = {} }) {
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12} xl={6}>
        <Card className="shadow-sm">
          <Statistic
            title="Target Headcount"
            value={summary.target_total || 0}
            prefix={<TeamOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card className="shadow-sm">
          <Statistic
            title="Slot Capacity"
            value={summary.slot_capacity_total || 0}
            prefix={<ApartmentOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card className="shadow-sm">
          <Statistic
            title="Filled"
            value={summary.filled_total || 0}
            prefix={<CheckCircleOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} xl={6}>
        <Card className="shadow-sm">
          <Statistic
            title="Slot Gap"
            value={summary.gap_total || 0}
            prefix={<WarningOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
}
