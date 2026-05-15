"use client";

import { Card, Button } from "antd";

export default function BenefitReportsPage() {
  return (
    <Card
      title="Benefit Reports"
      extra={<Button>Export Excel</Button>}
    >
      Reports & Analytics
    </Card>
  );
}