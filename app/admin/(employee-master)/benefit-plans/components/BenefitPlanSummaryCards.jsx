"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  AppstoreOutlined,
  CheckCircleOutlined,
  FileProtectOutlined,
  StopOutlined,
} from "@ant-design/icons";

export default function BenefitPlanSummaryCards({
  summary = {},
}) {
  return (
    <Row
      
    >
      <Col
        xs={24}
        sm={12}
        xl={6}
      >
        <Card>
          <Statistic
            title="แผนทั้งหมด"
            value={
              Number(
                summary.total ||
                  0
              )
            }
            prefix={
              <AppstoreOutlined />
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
            title="มี Policy Rule"
            value={
              Number(
                summary.with_rules ||
                  0
              )
            }
            prefix={
              <FileProtectOutlined />
            }
          />
        </Card>
      </Col>
    </Row>
  );
}
