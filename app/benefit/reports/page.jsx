"use client";

import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Statistic, Row, Col, DatePicker, Select } from "antd";
import {
  FileExcelOutlined,
  BarChartOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { RangePicker } = DatePicker;

export default function BenefitReportsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_requests: 0,
    approved_requests: 0,
    pending_requests: 0,
    total_amount: 0,
  });
  const [rows, setRows] = useState([]);

  const loadReport = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/reports", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "โหลดรายงานไม่สำเร็จ");

      setSummary(data.summary || {});
      setRows(data.data || []);
    } catch (error) {
      console.error("LOAD_BENEFIT_REPORT_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const columns = [
    {
      title: "Request No",
      dataIndex: "request_no",
      key: "request_no",
    },
    {
      title: "พนักงาน",
      key: "employee",
      render: (_, item) => {
        const name = item.employees
          ? `${item.employees.first_name_th || ""} ${item.employees.last_name_th || ""}`.trim()
          : "-";

        return (
          <div>
            <div className="font-semibold text-slate-800">{name}</div>
            <div className="text-xs text-slate-400">
              {item.employees?.employee_code || "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "สวัสดิการ",
      key: "benefit",
      render: (_, item) => item.benefits?.benefit_name || "-",
    },
    {
      title: "จำนวนเงิน",
      dataIndex: "requested_amount",
      key: "requested_amount",
      render: (value) =>
        value ? `${Number(value).toLocaleString()} บาท` : "-",
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          className={`m-0 rounded-full border-0 ${
            status === "approved"
              ? "bg-emerald-100 text-emerald-700"
              : status === "pending"
                ? "bg-amber-100 text-amber-700"
                : status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-slate-100 text-slate-600"
          }`}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "วันที่ขอ",
      dataIndex: "request_date",
      key: "request_date",
      render: (value) =>
        value ? new Date(value).toLocaleDateString("th-TH") : "-",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-6">
        <Card variant="borderless" className="rounded-[28px] shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <Tag className="m-0 rounded-full border-0 bg-violet-100 text-violet-700">
                  Reports
                </Tag>
                <Tag className="m-0 rounded-full border-0 bg-slate-100 text-slate-600">
                  Benefit System
                </Tag>
              </div>

              <h1 className="text-2xl font-bold text-slate-800">
                รายงานสวัสดิการ
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                สรุปคำขอใช้สิทธิ์ การอนุมัติ และยอดเงินสวัสดิการ
              </p>
            </div>

            <Button icon={<FileExcelOutlined />} size="large">
              Export Excel
            </Button>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="คำขอทั้งหมด"
                value={summary.total_requests || 0}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="อนุมัติแล้ว"
                value={summary.approved_requests || 0}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="รออนุมัติ"
                value={summary.pending_requests || 0}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} xl={6}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="ยอดรวม"
                value={summary.total_amount || 0}
                suffix="บาท"
                prefix={<WalletOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card variant="borderless" className="rounded-[28px] shadow-sm">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 md:flex-row">
              <RangePicker className="rounded-xl" />
              <Select
                allowClear
                placeholder="สถานะ"
                className="min-w-[180px]"
                options={[
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                  { value: "paid", label: "Paid" },
                ]}
              />
            </div>
          </div>

          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </div>
  );
}