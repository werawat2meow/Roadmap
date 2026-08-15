"use client";

import { Col, Row, Typography } from "antd";

const { Text } = Typography;

export default function EnterpriseMetricGrid({ items = [] }) {
  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col xs={12} md={8} key={item.label}>
          <div className="h-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
            <div className="mb-2 text-lg text-slate-500">{item.icon}</div>
            <div className="text-2xl font-bold text-slate-800">
              {Number(item.value || 0).toLocaleString("th-TH")}
            </div>
            <Text className="mt-1 block text-xs text-slate-500">
              {item.label}
            </Text>
          </div>
        </Col>
      ))}
    </Row>
  );
}
