"use client";

import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, message } from "antd";
import {HistoryOutlined,EyeOutlined,} from "@ant-design/icons";
import { useRouter } from "next/navigation";


export default function BenefitRequestHistoryPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const router = useRouter();

  const loadHistory = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/benefits/requests/history",
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error || "โหลดประวัติคำขอไม่สำเร็จ"
        );
      }

      setRows(json.data || []);
    } catch (error) {
      console.error(
        "LOAD_BENEFIT_REQUEST_HISTORY_ERROR:",
        error
      );

      message.error(
        error?.message || "โหลดประวัติคำขอไม่สำเร็จ"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "green";

      case "rejected":
        return "red";

      case "pending":
        return "gold";

      case "cancelled":
        return "default";

      default:
        return "blue";
    }
  };

  return (
    <div className="space-y-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined className="text-emerald-600" />

            <span className="text-lg font-bold">
              ประวัติคำขอสวัสดิการ
            </span>
          </div>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1400 }}
          columns={[
            {
              title: "เลขที่คำขอ",
              dataIndex: "request_no",
              width: 180,
              render: (value) => value || "-",
            },

            {
              title: "พนักงาน",
              width: 250,
              render: (_, record) => {
                const emp = record?.employees;

                return (
                  <div>
                    <div className="font-medium">
                      {emp
                        ? `${emp.first_name_th || ""} ${
                            emp.last_name_th || ""
                          }`
                        : "-"}
                    </div>

                    <div className="text-xs text-slate-400">
                      {emp?.employee_code || "-"}
                    </div>
                  </div>
                );
              },
            },

            {
              title: "สวัสดิการ",
              width: 250,
              render: (_, record) =>
                record?.benefits?.benefit_name || "-",
            },

            {
              title: "จำนวนเงินที่ขอ",
              dataIndex: "requested_amount",
              width: 150,
              align: "right",
              render: (value) =>
                value
                  ? Number(value).toLocaleString()
                  : "-",
            },

            {
              title: "จำนวนเงินอนุมัติ",
              dataIndex: "approved_amount",
              width: 150,
              align: "right",
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
              dataIndex: "request_date",
              width: 140,
              render: (value) =>
                value
                  ? new Date(value).toLocaleDateString(
                      "th-TH"
                    )
                  : "-",
            },

            {
              title: "หมายเหตุ",
              dataIndex: "remark",
              width: 250,
              render: (value) => value || "-",
            },

            {
              title: "เหตุผลปฏิเสธ",
              dataIndex: "reject_reason",
              width: 250,
              render: (value) => value || "-",
            },

            {
              title: "Actions",
              fixed: "right",
              width: 120,
              render: (_, record) => (
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => router.push(`/benefit/requests/${record.id}`)}
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