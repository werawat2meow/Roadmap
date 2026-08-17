"use client";

import { Card, Col, Row, Statistic } from "antd";
import {
  ApartmentOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";

export default function SalaryStructureSummaryCards({
  total = 0,
  currentPageCount = 0,
  loading = false,
}) {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12} xl={6}>
        <Card className="h-full rounded-2xl border-slate-200 shadow-sm">
          <Statistic
            title="โครงสร้างเงินเดือนทั้งหมด"
            value={total}
            loading={loading}
            prefix={<ApartmentOutlined />}
          />
        </Card>
      </Col>

      <Col xs={24} md={12} xl={6}>
        <Card className="h-full rounded-2xl border-slate-200 shadow-sm">
          <Statistic
            title="รายการในหน้าปัจจุบัน"
            value={currentPageCount}
            loading={loading}
            prefix={<DatabaseOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );
}
