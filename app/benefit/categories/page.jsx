"use client";

import { Card, Button } from "antd";

export default function BenefitCategoriesPage() {
  return (
    <Card
      title="จัดการหมวดหมู่สวัสดิการ"
      extra={<Button type="primary">เพิ่มหมวดหมู่</Button>}
    >
      Categories CRUD
    </Card>
  );
}