"use client";

import { useEffect, useState } from "react";
import { Card, Table, Tag, Spin, Empty } from "antd";
import {
  SafetyCertificateOutlined,
  GiftOutlined,
} from "@ant-design/icons";

export default function BenefitRulesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const loadRules = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/rules", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "โหลดกติกาสวัสดิการไม่สำเร็จ"
        );
      }

      setRows(data.data || []);
    } catch (error) {
      console.error(
        "LOAD_BENEFIT_RULES_ERROR:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const columns = [
    {
      title: "Benefit",
      key: "benefit",
      render: (_, item) => (
        <div>
          <div className="font-semibold text-slate-800">
            {item.benefits?.benefit_name || "-"}
          </div>

          <div className="text-xs text-slate-400">
            {item.benefits?.benefit_code || "-"}
          </div>
        </div>
      ),
    },

    {
      title: "Category",
      key: "category",
      render: (_, item) => (
        <Tag className="rounded-full border-0 bg-emerald-100 text-emerald-700">
          {item.benefits?.benefit_categories
            ?.category_name || "-"}
        </Tag>
      ),
    },

    {
      title: "Position Level",
      dataIndex: "position_level",
      key: "position_level",
      render: (value) => value || "ALL",
    },

    {
      title: "Quota",
      key: "quota",
      render: (_, item) => {
        if (item.is_unlimited) {
          return "ไม่จำกัด";
        }

        if (item.discount_percent) {
          return `${item.discount_percent}%`;
        }

        if (item.quota_amount) {
          return `${Number(
            item.quota_amount
          ).toLocaleString()} ${
            item.quota_unit || ""
          }`;
        }

        return "-";
      },
    },

    {
      title: "Frequency",
      dataIndex: "quota_frequency",
      key: "quota_frequency",
      render: (value) => value || "-",
    },

    {
      title: "Min Service",
      dataIndex: "min_service_months",
      key: "min_service_months",
      render: (value) =>
        `${value || 0} เดือน`,
    },

    {
      title: "Status",
      key: "status",
      render: (_, item) => (
        <Tag
          className={`rounded-full border-0 ${
            item.is_active
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          {item.is_active
            ? "Active"
            : "Inactive"}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-6">
        <Card
          variant="borderless"
          className="rounded-[28px] shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Tag className="m-0 rounded-full border-0 bg-sky-100 text-sky-700">
                  Rules
                </Tag>

                <Tag className="m-0 rounded-full border-0 bg-slate-100 text-slate-600">
                  Benefit System
                </Tag>
              </div>

              <h1 className="text-2xl font-bold text-slate-800">
                กติกาสวัสดิการ
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                จัดการเงื่อนไขสิทธิ์
                ตามระดับพนักงาน อายุงาน
                และสถานะพนักงาน
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-2xl text-sky-700">
              <SafetyCertificateOutlined />
            </div>
          </div>
        </Card>

        <Card
          variant="borderless"
          className="rounded-[28px] shadow-sm"
        >
          {rows.length > 0 ? (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={rows}
              pagination={{
                pageSize: 10,
              }}
              scroll={{ x: 1200 }}
            />
          ) : (
            <Empty description="ยังไม่พบข้อมูล Benefit Rules" />
          )}
        </Card>

        <Card
          variant="borderless"
          className="rounded-[28px] shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl text-emerald-700">
              <GiftOutlined />
            </div>

            <div>
              <div className="text-lg font-bold text-slate-800">
                Enterprise Benefit Engine
              </div>

              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                ระบบจะอ้างอิงข้อมูลจาก
                Employee Master เช่น Position
                Level, Employee Status,
                Employment Type และอายุงาน
                เพื่อคำนวณสิทธิ์สวัสดิการอัตโนมัติ
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}