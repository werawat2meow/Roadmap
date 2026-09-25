"use client";

import {
  Card,
  Col,
  Row,
  Statistic,
} from "antd";

import {
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  StopOutlined,
  StarOutlined,
} from "@ant-design/icons";

export default function SsoCategorySummaryCards({
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
              <SafetyCertificateOutlined />
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
            title="ค่าเริ่มต้น"
            value={
              Number(
                summary.default ||
                  0
              )
            }
            prefix={
              <StarOutlined />
            }
          />
        </Card>
      </Col>
    </Row>
  );
}
