"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  GiftOutlined,
  LinkOutlined,
  StopOutlined,
} from "@ant-design/icons";

export default function BenefitTypeSummaryCards({
  summary = {},
}) {
  return (
    <Row>
      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card>
          <Statistic
            title="ประเภททั้งหมด"
            value={
              Number(
                summary.total ||
                  0
              )
            }
            prefix={
              <GiftOutlined />
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
            title="ใช้งาน"
            value={
              Number(
                summary.active ||
                  0
              )
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
            title="ไม่ใช้งาน"
            value={
              Number(
                summary.inactive ||
                  0
              )
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
            title="ถูกใช้งานแล้ว"
            value={
              Number(
                summary.in_use ||
                  0
              )
            }
            prefix={
              <LinkOutlined />
            }
          />
        </Card>
      </Col>
    </Row>
  );
}
