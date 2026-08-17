"use client";

import { Col, Row, Card } from "antd";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";

export default function PayrollGroupSummaryCards({
  summary,
}) {
  return (
    <Row >
      <Col xs={24} md={8}>
        <Card>
          <Card.Meta
            avatar={<AppstoreOutlined />}
            title="ทั้งหมด"
            description={
              summary?.total ?? 0
            }
          />
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card>
          <Card.Meta
            avatar={
              <CheckCircleOutlined />
            }
            title="ใช้งาน"
            description={
              summary?.active ?? 0
            }
          />
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card>
          <Card.Meta
            avatar={<StopOutlined />}
            title="ยกเลิก"
            description={
              summary?.inactive ?? 0
            }
          />
        </Card>
      </Col>
    </Row>
  );
}