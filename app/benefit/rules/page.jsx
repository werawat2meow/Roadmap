"use client";

import { Card, Button } from "antd";

export default function BenefitRulesPage() {
  return (
    <Card
      title="Benefit Rules"
      extra={<Button type="primary">เพิ่ม Rule</Button>}
    >
      Rules CRUD
    </Card>
  );
}