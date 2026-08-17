"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  DollarOutlined,
  IdcardOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

import EnterpriseDistributionList from "./components/EnterpriseDistributionList";
import EnterpriseKpiCard from "./components/EnterpriseKpiCard";
import EnterpriseMetricGrid from "./components/EnterpriseMetricGrid";
import EnterpriseQualityRow from "./components/EnterpriseQualityRow";

const { Title, Text } = Typography;

const EMPTY_DASHBOARD = {
  generated_at: null,
  scope_mode: "permission",
  scope_assignments: {
    assignment_count: 0,
    company: 0,
    branch_group: 0,
    branch: 0,
    department: 0,
    division: 0,
    unit: 0,
  },
  kpi: {
    employees_total: 0,
    working: 0,
    headcount: 0,
    probation: 0,
    new_this_month: 0,
    new_this_year: 0,
    resigned_this_month: 0,
    resigned_this_year: 0,
    user_account_coverage: 0,
  },
  organization: {
    companies: 0,
    branch_groups: 0,
    branches: 0,
    departments: 0,
    divisions: 0,
    units: 0,
  },
  distributions: {
    companies: [],
    branches: [],
    departments: [],
    employment_types: [],
    position_levels: [],
    statuses: [],
  },
  readiness: {
    organization: { value: 0, total: 0, percent: 0 },
    job_architecture: { value: 0, total: 0, percent: 0 },
    cost_structure: { value: 0, total: 0, percent: 0 },
    payroll: { value: 0, total: 0, percent: 0 },
    contact: { value: 0, total: 0, percent: 0 },
    user_account: { value: 0, total: 0, percent: 0 },
  },
  attention: {
    missing_organization: 0,
    missing_job_architecture: 0,
    missing_cost_structure: 0,
    missing_payroll: 0,
    missing_contact: 0,
    missing_user_account: 0,
  },
  recent_starters: [],
};

function formatThaiDateTime(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function formatThaiDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("th-TH", {
      dateStyle: "medium",
    });
  } catch {
    return value;
  }
}

function getScopeMessage(scopeMode) {
  if (scopeMode === "all") {
    return {
      type: "success",
      title: "All Scope",
      description: "แสดงข้อมูลทั้งหมดที่ Permission ของผู้ใช้งานอนุญาต",
    };
  }

  if (scopeMode === "scoped") {
    return {
      type: "info",
      title: "Scoped Dashboard",
      description:
        "ตัวเลขทั้งหมดคำนวณจากพนักงานของตนเอง + พนักงานใน Scope งานของรหัสที่ Login อยู่",
    };
  }

  return {
    type: "warning",
    title: "Permission Mode",
    description:
      "ไม่ได้กำหนด Organization Scope สำหรับสิทธิ์นี้ ระบบจึงใช้ Permission ตามนโยบายเดิมของ Employee Master",
  };
}

export default function EmployeeMasterDashboardPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canViewDashboard = hasPermission(user, "ems.dashboard.view");
  const canViewEmployees = hasPermission(user, "ems.employees.view");
  const canExportDashboard = hasPermission(user, "ems.dashboard.export");

  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canViewDashboard || !canViewEmployees) {
      router.replace("/admin/employees");
    }
  }, [
    user,
    loadingUser,
    canViewDashboard,
    canViewEmployees,
    router,
  ]);

  const loadDashboard = useCallback(async () => {
    if (!user || !canViewDashboard || !canViewEmployees) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "ไม่สามารถโหลด Employee Master Dashboard ได้"
        );
      }

      setDashboard({
        ...EMPTY_DASHBOARD,
        ...(result?.data || {}),
      });
    } catch (loadError) {
      console.error("LOAD_EMPLOYEE_MASTER_DASHBOARD_ERROR:", loadError);
      setError(loadError?.message || "ไม่สามารถโหลด Dashboard ได้");
    } finally {
      setLoading(false);
    }
  }, [user, canViewDashboard, canViewEmployees]);

  useEffect(() => {
    if (loadingUser) return;
    loadDashboard();
  }, [loadingUser, loadDashboard]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError("");

      const response = await fetch("/api/admin/dashboard/export", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        let result = null;

        try {
          result = await response.json();
        } catch {
          result = null;
        }

        throw new Error(
          result?.error || "ไม่สามารถ Export Dashboard ได้"
        );
      }

      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="?([^";]+)"?/i);
      const fileName = match?.[1] || "employee-master-dashboard.xlsx";

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error("EXPORT_EMPLOYEE_MASTER_DASHBOARD_ERROR:", exportError);
      setError(exportError?.message || "ไม่สามารถ Export Dashboard ได้");
    } finally {
      setExporting(false);
    }
  };

  const scopeInfo = getScopeMessage(dashboard.scope_mode);
  const total = Number(dashboard?.kpi?.employees_total || 0);

  const kpiCards = useMemo(
    () => [
      {
        title: "พนักงานในขอบเขต",
        value: dashboard.kpi.employees_total,
        note: "Self + Scope ตามรหัสที่ Login",
        icon: <TeamOutlined />,
        tag: "WORKFORCE",
      },
      {
        title: "กำลังทำงาน",
        value: dashboard.kpi.working,
        note: "อ้างอิง employee_statuses.is_working",
        icon: <CheckCircleOutlined />,
        tag: "LIVE",
      },
      {
        title: "ทดลองงาน",
        value: dashboard.kpi.probation,
        note: "พนักงานที่อยู่ในช่วงทดลองงาน",
        icon: <ClockCircleOutlined />,
        tag: "PROBATION",
      },
      {
        title: "เข้าใหม่เดือนนี้",
        value: dashboard.kpi.new_this_month,
        note: `ปีนี้ ${Number(dashboard.kpi.new_this_year || 0).toLocaleString("th-TH")} คน`,
        icon: <UserAddOutlined />,
        tag: "JOINER",
      },
      {
        title: "ลาออกเดือนนี้",
        value: dashboard.kpi.resigned_this_month,
        note: `ปีนี้ ${Number(dashboard.kpi.resigned_this_year || 0).toLocaleString("th-TH")} คน`,
        icon: <WarningOutlined />,
        tag: "LEAVER",
      },
      {
        title: "มีบัญชีผู้ใช้งาน",
        value: dashboard.kpi.user_account_coverage,
        note: "Active User Account Coverage",
        icon: <SafetyCertificateOutlined />,
        tag: "ACCESS",
      },
    ],
    [dashboard]
  );

  const organizationMetrics = [
    { label: "บริษัท", value: dashboard.organization.companies, icon: <BankOutlined /> },
    { label: "กรุ๊ปสังกัด", value: dashboard.organization.branch_groups, icon: <ApartmentOutlined /> },
    { label: "สังกัด", value: dashboard.organization.branches, icon: <ApartmentOutlined /> },
    { label: "แผนก", value: dashboard.organization.departments, icon: <ApartmentOutlined /> },
    { label: "ฝ่าย", value: dashboard.organization.divisions, icon: <ApartmentOutlined /> },
    { label: "หน่วยงาน", value: dashboard.organization.units, icon: <TeamOutlined /> },
  ];

  const recentColumns = [
    {
      title: "พนักงาน",
      key: "employee",
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">{row.full_name}</div>
          <div className="text-xs text-slate-400">{row.employee_code || "-"}</div>
        </div>
      ),
    },
    {
      title: "บริษัท / สังกัด",
      key: "org",
      render: (_, row) => (
        <div>
          <div>{row.company}</div>
          <div className="text-xs text-slate-400">{row.branch}</div>
        </div>
      ),
    },
    {
      title: "แผนก",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "ตำแหน่ง",
      dataIndex: "position",
      key: "position",
    },
    {
      title: "เริ่มงาน",
      dataIndex: "start_work_date",
      key: "start_work_date",
      width: 150,
      render: formatThaiDate,
    },
  ];

  if (loadingUser) {
    return <div className="p-6"><Skeleton active /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Employee Master / Enterprise Overview
              </div>
              <Title level={2} className="!mb-1 !text-slate-900">
                Workforce Command Center
              </Title>
              <Text className="text-slate-500">
                ภาพรวมกำลังคน โครงสร้างองค์กร Job Architecture, Cost Structure, Payroll Readiness และ Data Quality
              </Text>
            </div>

            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadDashboard}
                loading={loading}
              >
                Refresh
              </Button>

              {canExportDashboard ? (
                <Button
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={handleExport}
                  loading={exporting}
                >
                  Export Excel
                </Button>
              ) : null}
            </Space>
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Last refresh: {formatThaiDateTime(dashboard.generated_at)}
          </div>
        </Card>

        {error ? (
          <Alert
            type="error"
            showIcon
            closable
            title="Dashboard Error"
            description={error}
            onClose={() => setError("")}
          />
        ) : null}

        <Alert
          type={scopeInfo.type}
          showIcon
          title={scopeInfo.title}
          description={scopeInfo.description}
        />

        {loading ? (
          <Card className="rounded-2xl border-slate-200">
            <Skeleton active paragraph={{ rows: 10 }} />
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {kpiCards.map((item) => (
                <Col xs={24} sm={12} xl={8} xxl={4} key={item.title}>
                  <EnterpriseKpiCard {...item} />
                </Col>
              ))}
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} xl={10}>
                <Card
                  title="Organization Footprint"
                  extra={<Tag>{dashboard.scope_mode.toUpperCase()}</Tag>}
                  className="h-full rounded-2xl border-slate-200 shadow-sm"
                >
                  <EnterpriseMetricGrid items={organizationMetrics} />

                  <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-4">
                    <div className="mb-3 font-medium text-slate-700">Scope Assignment ที่ Login นี้ได้รับ</div>
                    <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div><span className="text-slate-400">Assignments:</span> {dashboard.scope_assignments.assignment_count}</div>
                      <div><span className="text-slate-400">บริษัท:</span> {dashboard.scope_assignments.company}</div>
                      <div><span className="text-slate-400">สังกัด:</span> {dashboard.scope_assignments.branch}</div>
                      <div><span className="text-slate-400">แผนก:</span> {dashboard.scope_assignments.department}</div>
                    </div>
                  </div>
                </Card>
              </Col>

              <Col xs={24} xl={14}>
                <Card
                  title="Enterprise Data Readiness"
                  className="h-full rounded-2xl border-slate-200 shadow-sm"
                >
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <EnterpriseQualityRow
                      label="Organization Mapping"
                      {...dashboard.readiness.organization}
                      note="Company + Branch + Department"
                    />
                    <EnterpriseQualityRow
                      label="Job Architecture"
                      {...dashboard.readiness.job_architecture}
                      note="Position Family + Position Level + Position"
                    />
                    <EnterpriseQualityRow
                      label="Cost Structure"
                      {...dashboard.readiness.cost_structure}
                      note="Business Unit + Cost Center + Profit Center"
                    />
                    <EnterpriseQualityRow
                      label="Payroll Readiness"
                      {...dashboard.readiness.payroll}
                      note="Payroll Company + Type + Group"
                    />
                    <EnterpriseQualityRow
                      label="Contact / Email"
                      {...dashboard.readiness.contact}
                      note="Work Email หรือ Email"
                    />
                    <EnterpriseQualityRow
                      label="User Account Coverage"
                      {...dashboard.readiness.user_account}
                      note="Active account ที่ผูกกับ employee_id"
                    />
                  </div>
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} xl={8}>
                <Card title="กำลังคนตามสังกัด" className="h-full rounded-2xl border-slate-200 shadow-sm">
                  <EnterpriseDistributionList
                    rows={dashboard.distributions.branches}
                    total={total}
                  />
                </Card>
              </Col>

              <Col xs={24} xl={8}>
                <Card title="กำลังคนตามแผนก" className="h-full rounded-2xl border-slate-200 shadow-sm">
                  <EnterpriseDistributionList
                    rows={dashboard.distributions.departments}
                    total={total}
                  />
                </Card>
              </Col>

              <Col xs={24} xl={8}>
                <Card title="ระดับตำแหน่ง" className="h-full rounded-2xl border-slate-200 shadow-sm">
                  <EnterpriseDistributionList
                    rows={dashboard.distributions.position_levels}
                    total={total}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <Card title="สถานะพนักงาน" className="h-full rounded-2xl border-slate-200 shadow-sm">
                  {dashboard.distributions.statuses.length ? (
                    <div className="flex flex-wrap gap-3">
                      {dashboard.distributions.statuses.map((item) => (
                        <div
                          key={item.id}
                          className="min-w-[170px] flex-1 rounded-xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-slate-700">{item.label}</div>
                              <div className="mt-1 text-2xl font-bold text-slate-900">
                                {Number(item.count || 0).toLocaleString("th-TH")}
                              </div>
                            </div>
                            <Tag>{item.status_code || "STATUS"}</Tag>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              </Col>

              <Col xs={24} xl={12}>
                <Card title="รายการที่ต้องติดตาม" className="h-full rounded-2xl border-slate-200 shadow-sm">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {[
                      ["Organization ไม่ครบ", dashboard.attention.missing_organization, <ApartmentOutlined />],
                      ["Job Architecture ไม่ครบ", dashboard.attention.missing_job_architecture, <SolutionOutlined />],
                      ["Cost Structure ไม่ครบ", dashboard.attention.missing_cost_structure, <DollarOutlined />],
                      ["Payroll ไม่ครบ", dashboard.attention.missing_payroll, <BankOutlined />],
                      ["Email ไม่ครบ", dashboard.attention.missing_contact, <IdcardOutlined />],
                      ["ยังไม่มี User Account", dashboard.attention.missing_user_account, <UserOutlined />],
                    ].map(([label, value, icon]) => (
                      <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-2 text-lg text-slate-500">{icon}</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {Number(value || 0).toLocaleString("th-TH")}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>

            <Card
              title="พนักงานที่เริ่มงานล่าสุด"
              extra={
                canViewEmployees ? (
                  <Button type="link" onClick={() => router.push("/admin/employees")}>ดู Employee List</Button>
                ) : null
              }
              className="rounded-2xl border-slate-200 shadow-sm"
            >
              <Table
                rowKey="id"
                columns={recentColumns}
                dataSource={dashboard.recent_starters}
                pagination={false}
                scroll={{ x: 900 }}
                locale={{ emptyText: "ยังไม่มีข้อมูลพนักงาน" }}
              />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
