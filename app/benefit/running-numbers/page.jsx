"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Switch,
} from "antd";

import {
  NumberOutlined,
  PlusOutlined,
} from "@ant-design/icons";

export default function BenefitRunningNumbersPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const loadRunningNumbers = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/benefits/running-numbers",
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json?.error || "โหลดข้อมูลไม่สำเร็จ"
        );
      }

      setRows(json.data || []);
    } catch (error) {
      console.error(
        "LOAD_RUNNING_NUMBERS_ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRunningNumbers();
  }, []);

  return (
    <div className="space-y-6">
      <Card
        className="rounded-[24px] shadow-sm"
        title={
          <div className="flex items-center gap-2">
            <NumberOutlined className="text-emerald-600" />
            <span className="text-lg font-bold">
              Running Numbers
            </span>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className="!rounded-xl"
          >
            เพิ่ม Running Number
          </Button>
        }
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={rows}
          scroll={{ x: 1000 }}
          columns={[
            {
              title: "Module",
              dataIndex: "module_code",
              width: 120,
            },
            {
              title: "Document Type",
              dataIndex: "document_type",
              width: 180,
            },
            {
              title: "Prefix",
              dataIndex: "prefix",
              width: 180,
            },
            {
              title: "Current Number",
              dataIndex: "current_number",
              width: 160,
            },
            {
              title: "Padding",
              dataIndex: "padding_length",
              width: 120,
            },
            {
              title: "Reset Yearly",
              dataIndex: "reset_every_year",
              width: 150,
              render: (value) => (
                <Switch checked={value} />
              ),
            },
            {
              title: "Year",
              dataIndex: "running_year",
              width: 120,
            },
            {
              title: "Status",
              dataIndex: "is_active",
              width: 120,
              render: (value) =>
                value ? (
                  <Tag color="green">
                    Active
                  </Tag>
                ) : (
                  <Tag color="red">
                    Inactive
                  </Tag>
                ),
            },
            {
              title: "Preview",
              width: 240,
              render: (_, record) => {
                const current =
                  Number(record.current_number || 0) + 1;

                const padded = String(current).padStart(
                  Number(record.padding_length || 6),
                  "0"
                );

                return (
                  <span className="font-semibold text-emerald-700">
                    {record.prefix || ""}
                    {padded}
                    {record.suffix || ""}
                  </span>
                );
              },
            },
            {
              title: "Actions",
              width: 180,
              render: () => (
                <Space>
                  <Button>
                    Edit
                  </Button>

                  <Button danger>
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}