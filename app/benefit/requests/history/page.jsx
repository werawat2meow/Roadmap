"use client";

import { useEffect, useState } from "react";
import { Card, Table, Tag, Button } from "antd";
import {
  HistoryOutlined,
  EyeOutlined,
} from "@ant-design/icons";

export default function BenefitRequestHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const loadHistory = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/requests/history", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดประวัติคำขอไม่สำเร็จ");
      }

      setRows(json.data || []);
    } catch (error) {
      console.error("LOAD_BENEFIT_REQUEST_HISTORY_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const getStatusColor = (status) => {
    if (status === "approved") return "green";
    if (status === "rejected") return "red";
    if (status === "pending") return "gold";
    if (status === "cancelled") return "default";
    return "blue";
  };

  return (
    <div className="space-y-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined className="text-emerald-600" />
            <span className="text-lg font-bold">
              ประวัติคำขอสวัสดิการของฉัน
            </span>
          </div>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1000 }}
          columns={[
            {
              title: "เลขที่คำขอ",
              dataIndex: "request_no",
              width: 180,
              render: (value) => value || "-",
            },
            {
              title: "สวัสดิการ",
              width: 240,
              render: (_, record) =>
                record?.benefits?.benefit_name || "-",
            },
            {
              title: "จำนวนเงิน",
              dataIndex: "requested_amount",
              width: 140,
              render: (value) =>
                value
                  ? Number(value).toLocaleString()
                  : "-",
            },
            {
              title: "สถานะ",
              dataIndex: "status",
              width: 140,
              render: (value) => (
                <Tag color={getStatusColor(value)}>
                  {value || "-"}
                </Tag>
              ),
            },
            {
              title: "วันที่ขอ",
              dataIndex: "created_at",
              width: 180,
              render: (value) =>
                value
                  ? new Date(value).toLocaleDateString("th-TH")
                  : "-",
            },
            {
              title: "หมายเหตุ",
              dataIndex: "remark",
              width: 260,
              render: (value) => value || "-",
            },
            {
              title: "Actions",
              width: 140,
              render: (_, record) => (
                <Button
                  icon={<EyeOutlined />}
                  onClick={() =>
                    console.log("VIEW_REQUEST:", record.id)
                  }
                >
                  ดู
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}