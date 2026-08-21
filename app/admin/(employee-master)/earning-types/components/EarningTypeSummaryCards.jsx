"use client";

import { Card, Col, Row, Statistic } from "antd";
import { CheckCircleOutlined, DollarOutlined, FundProjectionScreenOutlined, RetweetOutlined } from "@ant-design/icons";

export default function EarningTypeSummaryCards({ summary = {} }) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="ประเภทเงินได้ทั้งหมด" value={Number(summary.total || 0)} prefix={<FundProjectionScreenOutlined />} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="ใช้งาน" value={Number(summary.active || 0)} prefix={<CheckCircleOutlined />} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="รายการประจำ" value={Number(summary.recurring || 0)} prefix={<RetweetOutlined />} /></Card></Col>
      <Col xs={24} sm={12} xl={6}><Card><Statistic title="อยู่ในฐานภาษี" value={Number(summary.taxable || 0)} prefix={<DollarOutlined />} /></Card></Col>
    </Row>
  );
}
