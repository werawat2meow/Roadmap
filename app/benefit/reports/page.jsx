"use client";

import { useEffect, useState } from "react";
import {Button,Card,DatePicker,Select,Space,Table,Tag,message,} from "antd";
import {DownloadOutlined,ReloadOutlined,} from "@ant-design/icons";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

const { RangePicker } = DatePicker;

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "In Review", value: "in_review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Paid", value: "paid" },
];

export default function BenefitReportsPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [rows, setRows] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [summary, setSummary] = useState(null);

  const [dateRange, setDateRange] = useState(null);
  const [benefitFilter, setBenefitFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const canView =
    hasPermission(user, "benefit.report.view") ||
    hasPermission(user, "benefit.report.manage");

  const canExport =
    hasPermission(user, "benefit.report.export") ||
    hasPermission(user, "benefit.report.manage");

  const loadBenefits = async () => {
    try {
      const res = await fetch("/api/benefits/master?page=1&pageSize=100", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดสวัสดิการไม่สำเร็จ");
      }

      setBenefits(json.data || []);
    } catch (error) {
      message.error(error.message || "โหลดสวัสดิการไม่สำเร็จ");
    }
  };

  const buildParams = ({
    nextPage = page,
    nextPageSize = pageSize,
    nextDateRange = dateRange,
    nextBenefit = benefitFilter,
    nextStatus = statusFilter,
  } = {}) => {
    const params = new URLSearchParams();

    params.set("page", String(nextPage));
    params.set("pageSize", String(nextPageSize));

    if (nextDateRange?.[0]) {
      params.set("dateFrom", nextDateRange[0].format("YYYY-MM-DD"));
    }

    if (nextDateRange?.[1]) {
      params.set("dateTo", nextDateRange[1].format("YYYY-MM-DD"));
    }

    if (nextBenefit) {
      params.set("benefitId", nextBenefit);
    }

    if (nextStatus) {
      params.set("status", nextStatus);
    }

    return params;
  };

  const loadData = async (options = {}) => {
    try {
      setLoading(true);

      const params = buildParams(options);

      const res = await fetch(`/api/benefits/reports?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลดรายงานไม่สำเร็จ");
      }

      setRows(json.data || []);
      setTotal(json.total || 0);
      setPage(json.page || 1);
      setPageSize(json.pageSize || 20);
      setSummary(json.summary || null);
    } catch (error) {
      console.error("LOAD_REPORT_ERROR:", error);
      message.error(error.message || "โหลดรายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const params = buildParams({
        nextPage: 1,
        nextPageSize: 10000,
      });

      const res = await fetch(
        `/api/benefits/reports/export?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error || "Export ไม่สำเร็จ");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `benefit-report-${dayjs().format("YYYYMMDD-HHmmss")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("EXPORT_REPORT_ERROR:", error);
      message.error(error.message || "Export ไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadBenefits();
      loadData({
        nextPage: 1,
        nextPageSize: 20,
      });
    }
  }, [canView]);

  const getStatusColor = (status) => {
    switch (status) {
      case "draft":
        return "default";
      case "pending":
        return "gold";
      case "in_review":
        return "blue";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      case "cancelled":
        return "default";
      case "paid":
        return "purple";
      default:
        return "blue";
    }
  };

  const columns = [
    {
      title: "Request No",
      dataIndex: "request_no",
      width: 180,
      fixed: "left",
      render: (value) => value || "-",
    },
    {
      title: "Request Date",
      dataIndex: "request_date",
      width: 140,
      render: (value) => value || "-",
    },
    {
      title: "Employee",
      width: 240,
      render: (_, record) => {
        const emp = record?.employees;
        const fullName = `${emp?.first_name_th || ""} ${
          emp?.last_name_th || ""
        }`.trim();

        return (
          <div>
            <div className="font-semibold">{fullName || "-"}</div>
            <div className="text-xs text-slate-400">
              {emp?.employee_code || "-"}
            </div>
          </div>
        );
      },
    },
    {
      title: "Benefit",
      width: 260,
      render: (_, record) => (
        <div>
          <div className="font-semibold">
            {record?.benefits?.benefit_name || "-"}
          </div>
          <div className="text-xs text-slate-400">
            {record?.benefits?.benefit_code || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Requested Amount",
      dataIndex: "requested_amount",
      width: 170,
      align: "right",
      render: (value) =>
        value ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-",
    },
    {
      title: "Approved Amount",
      dataIndex: "approved_amount",
      width: 170,
      align: "right",
      render: (value) =>
        value ? Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      render: (value) => <Tag color={getStatusColor(value)}>{value || "-"}</Tag>,
    },
    {
      title: "Approved At",
      dataIndex: "approved_at",
      width: 180,
      render: (value) =>
        value ? new Date(value).toLocaleString("th-TH") : "-",
    },
    {
      title: "Remark",
      dataIndex: "remark",
      width: 260,
      render: (value) => value || "-",
    },
  ];

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">ไม่มีสิทธิ์เข้าถึง</div>
          <p className="mt-2 text-slate-500">คุณไม่มีสิทธิ์ดูรายงานสวัสดิการ</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-5">
        <Card className="rounded-[24px] shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">จำนวนรายการหน้านี้</div>
              <div className="mt-1 text-2xl font-bold">
                {summary?.row_count?.toLocaleString() || 0}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">ยอดขอรวมหน้านี้</div>
              <div className="mt-1 text-2xl font-bold">
                {Number(summary?.total_requested_amount || 0).toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">ยอดอนุมัติรวมหน้านี้</div>
              <div className="mt-1 text-2xl font-bold">
                {Number(summary?.total_approved_amount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="rounded-[24px] shadow-sm"
          title={<div className="text-lg font-bold">Benefit Reports</div>}
          extra={
            <Space wrap>
              <RangePicker
                value={dateRange}
                onChange={(value) => {
                  setDateRange(value);
                  setPage(1);
                  loadData({
                    nextPage: 1,
                    nextDateRange: value,
                  });
                }}
              />

              <Select
                allowClear
                showSearch
                placeholder="Benefit"
                style={{ width: 260 }}
                value={benefitFilter || undefined}
                optionFilterProp="label"
                onChange={(value) => {
                  const nextValue = value || "";
                  setBenefitFilter(nextValue);
                  setPage(1);
                  loadData({
                    nextPage: 1,
                    nextBenefit: nextValue,
                  });
                }}
                options={benefits.map((item) => ({
                  label: `${item.benefit_code} - ${item.benefit_name}`,
                  value: item.id,
                }))}
              />

              <Select
                allowClear
                placeholder="Status"
                style={{ width: 160 }}
                value={statusFilter || undefined}
                onChange={(value) => {
                  const nextValue = value || "";
                  setStatusFilter(nextValue);
                  setPage(1);
                  loadData({
                    nextPage: 1,
                    nextStatus: nextValue,
                  });
                }}
                options={STATUS_OPTIONS}
              />

              <Button
                icon={<ReloadOutlined />}
                onClick={() =>
                  loadData({
                    nextPage: page,
                    nextPageSize: pageSize,
                  })
                }
              >
                Refresh
              </Button>

              {canExport && (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={exporting}
                  onClick={handleExport}
                >
                  Export Excel
                </Button>
              )}
            </Space>
          }
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={rows}
            columns={columns}
            scroll={{ x: 1800 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100"],
              showTotal: (value) => `ทั้งหมด ${value.toLocaleString()} รายการ`,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);

                loadData({
                  nextPage,
                  nextPageSize,
                });
              },
            }}
          />
        </Card>
      </div>
    </div>
  );
}