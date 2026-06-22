"use client";

import { useEffect, useState } from "react";
import {Card,Col,Row,Statistic,Table,Tag,message,Button,Space,Input,Select,Form,} from "antd";
import {CheckCircleOutlined,ClockCircleOutlined,CloseCircleOutlined,DollarOutlined,FileTextOutlined,ReloadOutlined,} from "@ant-design/icons";
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,LineChart,Line,} from "recharts";
import {PieChart,Pie,} from "recharts";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import dayjs from "dayjs";

export default function BenefitDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState({
    total_requests: 0,
    pending_requests: 0,
    approved_requests: 0,
    rejected_requests: 0,
    total_usage_amount: 0,
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [summaryByBenefit, setSummaryByBenefit] = useState([]);
  const [usageByMonth, setUsageByMonth] = useState([]);
  const [summaryByStatus, setSummaryByStatus] = useState([]);
  const [topEmployeesUsage, setTopEmployeesUsage] = useState([]);
  const [usageByDepartment, setUsageByDepartment] = useState([]);
  const [usageByBranch, setUsageByBranch] = useState([]);

  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState("");
  const [benefitId, setBenefitId] = useState("");
  const [status, setStatus] = useState("");
  const [benefits, setBenefits] = useState([]);

  /*
    ดูภาพรวมคำขอ การใช้สิทธิ์ และสถานะระบบ Benefit
    benefit.dashboard.view - สิทธิ์ดู Dashboard
    benefit.dashboard.manage - สิทธิ์จัดการ Dashboard (ดูได้ + ตั้งค่าได้ในอนาคต)
  */
  const canView = hasPermission(user, "benefit.dashboard.view") || hasPermission(user, "benefit.dashboard.manage");

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (year) params.append("year", year);
      if (month) params.append("month", month);
      if (benefitId) params.append("benefitId", benefitId);
      if (status) params.append("status", status);

      const res = await fetch(`/api/benefits/dashboard?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "โหลด Dashboard ไม่สำเร็จ");
      }

      setSummary(
        json.summary || {
          total_requests: 0,
          pending_requests: 0,
          approved_requests: 0,
          rejected_requests: 0,
          total_usage_amount: 0,
        }
      );

      setRecentRequests(json.recent_requests || []);
      setSummaryByBenefit(json.summary_by_benefit || []);
      setUsageByMonth(json.usage_by_month || []);
      setSummaryByStatus(json.summary_by_status || []);
      setTopEmployeesUsage(json.top_employees_usage || []);
      setUsageByDepartment(json.usage_by_department || []);
      setUsageByBranch(json.usage_by_branch || []);
    } catch (error) {
      console.error("LOAD_DASHBOARD_ERROR:", error);
      message.error(error.message || "โหลด Dashboard ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const loadBenefits = async () => {
    try {
      const res = await fetch("/api/benefits/master");

      const json = await res.json();

      if (res.ok) {
        setBenefits(json.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportDashboard = () => {
    const params = new URLSearchParams();

    if (year) params.append("dateFrom", `${year}-01-01`);
    if (year) params.append("dateTo", `${year}-12-31`);
    if (benefitId) params.append("benefitId", benefitId);
    if (status) params.append("status", status);

    window.open(
      `/api/benefits/reports/export?${params.toString()}`,
      "_blank"
    );
  };

  useEffect(() => {
    if (canView) {
      loadBenefits();
    }
  }, [canView]);

  useEffect(() => {
    if (canView) {
      loadDashboard();
    }
  }, [canView, year, month, benefitId, status]);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "green";

      case "pending":
        return "gold";

      case "rejected":
        return "red";

      case "in_review":
        return "blue";

      case "paid":
        return "purple";

      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Request No",
      dataIndex: "request_no",
      width: 180,
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
            <div className="font-semibold">
              {fullName || "-"}
            </div>

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
      title: "Request Date",
      dataIndex: "request_date",
      width: 140,
      render: (value) => value || "-",
    },
    {
      title: "Requested Amount",
      dataIndex: "requested_amount",
      width: 180,
      align: "right",
      render: (value) =>
        Number(value || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        }),
    },
    {
      title: "Approved Amount",
      dataIndex: "approved_amount",
      width: 180,
      align: "right",
      render: (value) =>
        Number(value || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        }),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 140,
      render: (value) => (
        <Tag color={getStatusColor(value)}>
          {value || "-"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      width: 180,
      render: (value) =>
        value
          ? new Date(value).toLocaleString("th-TH")
          : "-",
    },
  ];

  if (!canView) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="rounded-[24px] text-center shadow-sm">
          <div className="text-xl font-bold text-red-500">
            ไม่มีสิทธิ์เข้าถึง
          </div>

          <p className="mt-2 text-slate-500">
            คุณไม่มีสิทธิ์ดู Dashboard
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6">
      <div className="space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Benefit Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              ภาพรวมคำขอสวัสดิการ และการใช้สิทธิ์
            </p>
          </div>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadDashboard}
              loading={loading}
            >
              Refresh
            </Button>

            <Button
              icon={<FileTextOutlined />}
              onClick={handleExportDashboard}
            >
              Export Dashboard
            </Button>

            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => router.push("/benefit/reports")}
            >
              View Reports
            </Button>
          </Space>
        </div>

        <Card className="mb-6">
          <Form layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Form.Item
                  label="ปี"
                  className="mb-0"
                >
                  <Input
                    value={year}
                    onChange={(e) =>
                      setYear(e.target.value)
                    }
                    placeholder="ระบุปี"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item
                  label="เดือน"
                  className="mb-0"
                >
                  <Select
                    value={month || undefined}
                    onChange={(value) => setMonth(value || "")}
                    allowClear
                    placeholder="ทุกเดือน"
                    options={[
                      {
                        value: "01",
                        label: "มกราคม",
                      },
                      {
                        value: "02",
                        label: "กุมภาพันธ์",
                      },
                      {
                        value: "03",
                        label: "มีนาคม",
                      },
                      {
                        value: "04",
                        label: "เมษายน",
                      },
                      {
                        value: "05",
                        label: "พฤษภาคม",
                      },
                      {
                        value: "06",
                        label: "มิถุนายน",
                      },
                      {
                        value: "07",
                        label: "กรกฎาคม",
                      },
                      {
                        value: "08",
                        label: "สิงหาคม",
                      },
                      {
                        value: "09",
                        label: "กันยายน",
                      },
                      {
                        value: "10",
                        label: "ตุลาคม",
                      },
                      {
                        value: "11",
                        label: "พฤศจิกายน",
                      },
                      {
                        value: "12",
                        label: "ธันวาคม",
                      },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item
                  label="สวัสดิการ"
                  className="mb-0"
                >
                  <Select
                    value={benefitId || undefined}
                    onChange={(value) => setBenefitId(value || "")}
                    allowClear
                    placeholder="ทุกสวัสดิการ"
                    options={benefits.map(
                      (item) => ({
                        value: item.id,
                        label: `${item.benefit_code} - ${item.benefit_name}`,
                      })
                    )}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={6}>
                <Form.Item
                  label="สถานะ"
                  className="mb-0"
                >
                  <Select
                    value={status || undefined}
                    onChange={(value) => setStatus(value || "")}
                    allowClear
                    placeholder="ทุกสถานะ"
                    options={[
                      {
                        value: "pending",
                        label: "Pending",
                      },
                      {
                        value: "in_review",
                        label: "In Review",
                      },
                      {
                        value: "approved",
                        label: "Approved",
                      },
                      {
                        value: "rejected",
                        label: "Rejected",
                      },
                      {
                        value: "cancelled",
                        label: "Cancelled",
                      },
                      {
                        value: "paid",
                        label: "Paid",
                      },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="Total Requests"
                value={summary.total_requests}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="Pending Requests"
                value={summary.pending_requests}
                prefix={<ClockCircleOutlined />}
                styles={{
                  color: "#d97706",
                }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="Approved Requests"
                value={summary.approved_requests}
                prefix={<CheckCircleOutlined />}
                styles={{
                  color: "#16a34a",
                }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="Rejected Requests"
                value={summary.rejected_requests}
                prefix={<CloseCircleOutlined />}
                styles={{
                  color: "#dc2626",
                }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card className="rounded-[24px] shadow-sm">
              <Statistic
                title="Total Benefit Usage Amount"
                value={summary.total_usage_amount}
                precision={2}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              className="rounded-[24px] shadow-sm"
              title={
                <div className="text-lg font-bold">
                  Top Benefit Usage
                </div>
              }
            >
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryByBenefit}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="benefit_name"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) =>
                        Number(value).toLocaleString()
                      }
                    />

                    <Bar
                      dataKey="total_amount"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              className="rounded-[24px] shadow-sm"
              title={
                <div className="text-lg font-bold">
                  Monthly Usage Trend
                </div>
              }
            >
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usageByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                    />

                    <YAxis />

                    <Tooltip
                      formatter={(value) =>
                        Number(value).toLocaleString()
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="total_amount"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              className="rounded-[24px] shadow-sm"
              title={
                <div className="text-lg font-bold">
                  Status Summary
                </div>
              }
            >
              <div style={{ width: "100%", height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summaryByStatus}
                      dataKey="total"
                      nameKey="status"
                      outerRadius={120}
                      label
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              className="rounded-[24px] shadow-sm"
              title={<div className="text-lg font-bold">Top Employees Usage</div>}
            >
              <Table
                rowKey="employee_name"
                loading={loading}
                dataSource={topEmployeesUsage}
                pagination={false}
                columns={[
                  {
                    title: "Employee",
                    dataIndex: "employee_name",
                    render: (value) => value || "-",
                  },
                  {
                    title: "Total Amount",
                    dataIndex: "total_amount",
                    align: "right",
                    render: (value) =>
                      Number(value || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      }),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              className="rounded-[24px] shadow-sm"
              title={<div className="text-lg font-bold">Usage By Department</div>}
            >
              <Table
                rowKey="name"
                loading={loading}
                dataSource={usageByDepartment}
                pagination={false}
                columns={[
                  {
                    title: "Department",
                    dataIndex: "name",
                    render: (value) => value || "-",
                  },
                  {
                    title: "Total Amount",
                    dataIndex: "total_amount",
                    align: "right",
                    render: (value) =>
                      Number(value || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      }),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              className="rounded-[24px] shadow-sm"
              title={<div className="text-lg font-bold">Usage By Branch</div>}
            >
              <Table
                rowKey="name"
                loading={loading}
                dataSource={usageByBranch}
                pagination={false}
                columns={[
                  {
                    title: "Branch",
                    dataIndex: "name",
                    render: (value) => value || "-",
                  },
                  {
                    title: "Total Amount",
                    dataIndex: "total_amount",
                    align: "right",
                    render: (value) =>
                      Number(value || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      }),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Card
          className="rounded-[24px] shadow-sm"
          title={
            <div className="text-lg font-bold">
              Recent Benefit Requests
            </div>
          }
        >
          <Table
            rowKey="id"
            loading={loading}
            dataSource={recentRequests}
            columns={columns}
            scroll={{ x: 1600 }}
            pagination={false}
          />
        </Card>
      </div>
    </div>
  );
}