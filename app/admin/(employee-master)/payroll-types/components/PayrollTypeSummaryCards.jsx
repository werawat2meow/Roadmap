"use client";

import { Card, Col, Row } from "antd";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WalletOutlined,
} from "@ant-design/icons";

export default function PayrollTypeSummaryCards({
  summary,
}) {
  return (
    <Row gutter={[16, 16]}>

      <Col xs={24} md={8}>
        <Card>
          <div className="flex items-center justify-between">

            <div>
              <div className="text-sm text-slate-500">
                Payroll Cycles ทั้งหมด
              </div>

              <div className="mt-2 text-3xl font-bold text-slate-800">
                {summary.total}
              </div>
            </div>

            <WalletOutlined
              className="text-4xl text-blue-500"
            />

          </div>
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card>
          <div className="flex items-center justify-between">

            <div>
              <div className="text-sm text-slate-500">
                ใช้งาน
              </div>

              <div className="mt-2 text-3xl font-bold text-green-600">
                {summary.active}
              </div>
            </div>

            <CheckCircleOutlined
              className="text-4xl text-green-500"
            />

          </div>
        </Card>
      </Col>

      <Col xs={24} md={8}>
        <Card>
          <div className="flex items-center justify-between">

            <div>
              <div className="text-sm text-slate-500">
                ไม่ใช้งาน
              </div>

              <div className="mt-2 text-3xl font-bold text-red-500">
                {summary.inactive}
              </div>
            </div>

            <CloseCircleOutlined
              className="text-4xl text-red-500"
            />

          </div>
        </Card>
      </Col>

    </Row>
  );
}