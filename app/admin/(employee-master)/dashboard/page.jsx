"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  CompassOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserAddOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";

import EnterpriseKpiCard from "./components/EnterpriseKpiCard";
import EnterpriseOverview from "./components/EnterpriseOverview";
import DashboardGuidedTour from "./components/DashboardGuidedTour";
import DashboardNotificationBell from "./components/DashboardNotificationBell";
import DashboardProbationAlert from "./components/DashboardProbationAlert";

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

function getScopeMessage(scopeMode) {
  if (scopeMode === "all") {
    return {
      color: "success",
      title: "ข้อมูลทั้งหมดตามสิทธิ์",
      description: "แสดงข้อมูลทั้งหมดที่บัญชีนี้มีสิทธิ์เข้าถึง",
    };
  }

  if (scopeMode === "scoped") {
    return {
      color: "blue",
      title: "ข้อมูลตามขอบเขตงาน",
      description: "แสดงเฉพาะข้อมูลของคุณและข้อมูลที่อยู่ใน Scope งานที่ได้รับ",
    };
  }

  return {
    color: "gold",
    title: "ข้อมูลตาม Permission",
    description: "ระบบแสดงข้อมูลตามสิทธิ์ที่บัญชีนี้ได้รับ",
  };
}

function getRoleDisplayName(user) {
  return (
    user?.role_name ||
    user?.role?.role_name ||
    user?.role_code ||
    user?.role?.role_code ||
    "User"
  );
}

function getUserDisplayName(user) {
  return (
    user?.full_name ||
    user?.full_name_th ||
    user?.username ||
    "ผู้ใช้งาน"
  );
}

export default function EmployeeMasterDashboardPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canViewDashboard = hasPermission(user, "ems.dashboard.view");
  const canViewEmployees = hasPermission(user, "ems.employees.view");
  const canExportDashboard = hasPermission(user, "ems.dashboard.export");

  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [tourOpenSignal, setTourOpenSignal] = useState(0);

  // Hide only the visual scrollbar while this Dashboard page is mounted.
  // Do not set overflow: hidden; wheel, touchpad and touch scrolling still work.
  useEffect(() => {
    const marker = "hrms-dashboard-hide-scrollbar";
    const style = document.createElement("style");
    style.setAttribute("data-hrms-dashboard-scrollbar", "true");
    style.textContent = `
      html.${marker},
      html.${marker} body,
      html.${marker} body * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      html.${marker}::-webkit-scrollbar,
      html.${marker} body::-webkit-scrollbar,
      html.${marker} body *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;
    document.documentElement.classList.add(marker);
    document.head.appendChild(style);

    return () => {
      document.documentElement.classList.remove(marker);
      style.remove();
    };
  }, []);


  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canViewDashboard) {
      router.replace("/admin");
    }
  }, [
    user,
    loadingUser,
    canViewDashboard,
    router,
  ]);

  const loadDashboard = useCallback(async () => {
    if (!user || !canViewDashboard) return;

    if (!canViewEmployees) {
      setLoading(false);
      setError("");
      return;
    }

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
      setHasLoaded(true);
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
  const roleName = getRoleDisplayName(user);
  const userName = getUserDisplayName(user);

  const kpiCards = useMemo(
    () => [
      {
        title: "พนักงานในขอบเขต",
        value: dashboard.kpi.employees_total,
        note: "จำนวนพนักงานที่คุณมีสิทธิ์ดู",
        icon: <TeamOutlined />,
        tag: "WORKFORCE",
      },
      {
        title: "กำลังทำงาน",
        value: dashboard.kpi.working,
        note: "พนักงานที่มีสถานะกำลังทำงาน",
        icon: <CheckCircleOutlined />,
        tag: "ACTIVE",
      },
      {
        title: "ทดลองงาน",
        value: dashboard.kpi.probation,
        note: "รายการที่ควรติดตามช่วงทดลองงาน",
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
        note: "บัญชี Active ที่ผูกกับพนักงาน",
        icon: <SafetyCertificateOutlined />,
        tag: "ACCESS",
      },
    ],
    [dashboard]
  );

  if (loadingUser) {
    return (
      <div className="p-6">
        <Skeleton active />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <DashboardGuidedTour
          user={user}
          canViewEmployees={canViewEmployees}
          openSignal={tourOpenSignal}
        />

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
        

        {canViewEmployees ? (
          <EnterpriseOverview 
            dashboard={dashboard}
            loading={loading}
            initialLoading={loading && !hasLoaded}
            onRefresh={loadDashboard}
            canViewEmployees={canViewEmployees}
          />
        ) : (
          <Alert type="info" showIcon message="ไม่มีสิทธิ์ดูข้อมูลพนักงาน" description="กรุณาติดต่อผู้ดูแลระบบหากต้องการเข้าถึงข้อมูลภาพรวมบุคลากร" />
        )}
      </div>
    </div>
  );
}
