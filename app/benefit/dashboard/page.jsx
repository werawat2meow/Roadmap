"use client";

import { useEffect, useState } from "react";
import {Card,Col,Row,Statistic,Table,Tag,message,Button,Space,} from "antd";
import {CheckCircleOutlined,ClockCircleOutlined,CloseCircleOutlined,DollarOutlined,FileTextOutlined,ReloadOutlined,} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

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

  /*
    ดูภาพรวมคำขอ การใช้สิทธิ์ และสถานะระบบ Benefit
    benefit.dashboard.view - สิทธิ์ดู Dashboard
    benefit.dashboard.manage - สิทธิ์จัดการ Dashboard (ดูได้ + ตั้งค่าได้ในอนาคต)
  */
  const canView = hasPermission(user, "benefit.dashboard.view") || hasPermission(user, "benefit.dashboard.manage");

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/benefits/dashboard", {
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
    } catch (error) {
      console.error("LOAD_DASHBOARD_ERROR:", error);
      message.error(error.message || "โหลด Dashboard ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      loadDashboard();
    }
  }, [canView]);

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
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => router.push("/benefit/reports")}
            >
              View Reports
            </Button>
          </Space>
        </div>

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