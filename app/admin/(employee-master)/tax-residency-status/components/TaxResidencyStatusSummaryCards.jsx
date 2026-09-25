"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  GlobalOutlined,
  StopOutlined,
} from "@ant-design/icons";

export default function TaxResidencyStatusSummaryCards({
  summary = {},
}) {
  return (
    <Row
     
    >
      <Col
        xs={24}
        sm={8}
      >
        <Card>
          <Statistic
            title="สถานะทั้งหมด"
            value={
              Number(
                summary.total ||
                  0
              )
            }
            prefix={
              <GlobalOutlined />
            }
          />
        </Card>
      </Col>

      <Col
        xs={24}
        sm={8}
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
        sm={8}
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
    </Row>
  );
}
