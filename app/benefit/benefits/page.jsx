"use client";

import { useEffect, useState } from "react";
import { Button, Card, Table } from "antd";

export default function BenefitsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const loadBenefits = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/master");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดข้อมูลไม่สำเร็จ");
      }

      setData(json.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBenefits();
  }, []);

  return (
    <div className="space-y-6">
      <Card
        title="จัดการสวัสดิการ"
        extra={
          <Button type="primary">
            เพิ่มสวัสดิการ
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={[
            {
              title: "Benefit Code",
              dataIndex: "benefit_code",
            },
            {
              title: "Benefit Name",
              dataIndex: "benefit_name",
            },
            {
              title: "Actions",
              render: (_, record) => (
                <div className="flex gap-2">
                  <Button>แก้ไข</Button>
                  <Button danger>ลบ</Button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}