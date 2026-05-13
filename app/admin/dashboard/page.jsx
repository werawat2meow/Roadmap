"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Button,
  Avatar,
  Typography,
  Skeleton,
  Pagination,
} from "antd";
import {
  TeamOutlined,
  ApartmentOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UsergroupAddOutlined,
  DownloadOutlined,
  SolutionOutlined,
  WarningOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import { sidebarMenus } from "../components/sidebarMenus";
import LoadingOrb from "../../components/LoadingOrb";

const { Title, Text } = Typography;

function formatThaiDateTime(dateString) {
  if (!dateString) return "-";

  try {
    return new Date(dateString).toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return dateString;
  }
}

function getActivityColor(action) {
  if (action === "created") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (action === "updated") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getStatusTagClasses(color) {
  if (color === "green") {
    return "bg-green-100 text-green-700";
  }

  if (color === "yellow") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (color === "red") {
    return "bg-red-100 text-red-600";
  }

  if (color === "orange") {
    return "bg-orange-100 text-orange-700";
  }

  if (color === "blue") {
    return "bg-blue-100 text-blue-700";
  }

  if (color === "purple") {
    return "bg-purple-100 text-purple-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const canViewDashboard = hasPermission(user, "dashboard.view");

  const [dashboard, setDashboard] = useState({
    employees: 0,
    user_accounts: 0,
    roles: 0,
    permissions: 0,
    companies: 0,
    branches: 0,
    departments: 0,
    divisions: 0,
    units: 0,
    positions: 0,

    headcount_target_total: 0,
    headcount_actual_total: 0,
    headcount_vacant_total: 0,
    top_unit_position_shortages: [],
    shortage_unit_positions: [],
    shortage_unit_positions_total: 0,

    employee_status_summary: [],
    position_status_breakdowns: [],

    recent_activities: [],
    recent_activities_total: 0,
    recent_activities_page: 1,
    recent_activities_page_size: 10,
  });

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 10;

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!canViewDashboard) {
      router.replace("/admin/employees");
    }
  }, [user, loadingUser, canViewDashboard, router]);

  const loadDashboard = async (page = 1) => {
    try {
      setLoadingDashboard(true);

      const res = await fetch(
        `/api/admin/dashboard?page=${page}&pageSize=${activityPageSize}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Load dashboard failed");
      }

      setDashboard(
        data.data || {
          employees: 0,
          user_accounts: 0,
          roles: 0,
          permissions: 0,
          companies: 0,
          branches: 0,
          departments: 0,
          divisions: 0,
          units: 0,
          positions: 0,

          headcount_target_total: 0,
          headcount_actual_total: 0,
          headcount_vacant_total: 0,
          top_unit_position_shortages: [],
          shortage_unit_positions: [],
          shortage_unit_positions_total: 0,

          employee_status_summary: [],
          position_status_breakdowns: [],

          recent_activities: [],
          recent_activities_total: 0,
          recent_activities_page: 1,
          recent_activities_page_size: 10,
        }
      );
    } catch (error) {
      console.error("LOAD_DASHBOARD_ERROR:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    if (loadingUser) return;
    if (!user) return;
    if (!canViewDashboard) return;

    loadDashboard(activityPage);
  }, [loadingUser, user, canViewDashboard, activityPage]);

  const summaryCards = useMemo(
    () => [
      {
        title: "พนักงานทั้งหมด",
        value: dashboard.employees || 0,
        suffix: "คน",
        icon: <TeamOutlined />,
        growth: "LIVE",
        note: "จำนวนข้อมูลพนักงานในระบบ",
      },
      {
        title: "บัญชีผู้ใช้งาน",
        value: dashboard.user_accounts || 0,
        suffix: "บัญชี",
        icon: <UserOutlined />,
        growth: "LIVE",
        note: "บัญชีที่ใช้เข้าสู่ระบบ",
      },
      {
        title: "Roles & Permissions",
        value: (dashboard.roles || 0) + (dashboard.permissions || 0),
        suffix: "รายการ",
        icon: <SafetyCertificateOutlined />,
        growth: "LIVE",
        note: "รวม role และ permission",
      },
      {
        title: "หน่วยงาน / ฝ่าย",
        value:
          (dashboard.departments || 0) +
          (dashboard.divisions || 0) +
          (dashboard.units || 0),
        suffix: "หน่วย",
        icon: <ApartmentOutlined />,
        growth: "LIVE",
        note: "รวมแผนก ฝ่าย และหน่วย",
      },
    ],
    [dashboard]
  );

  const manpowerCards = useMemo(
    () => [
      {
        title: "เป้าหมายจำนวนบุคลากร",
        value: dashboard.headcount_target_total || 0,
        suffix: "อัตรา",
        icon: <UsergroupAddOutlined />,
        bg: "from-sky-500 to-blue-500",
        note: "จำนวนอัตราที่ควรมีทั้งหมด",
      },
      {
        title: "จำนวนบุคลากรปัจจุบัน",
        value: dashboard.headcount_actual_total || 0,
        suffix: "คน",
        icon: <SolutionOutlined />,
        bg: "from-emerald-500 to-green-500",
        note: "จำนวนพนักงานที่มีจริง",
      },
      {
        title: "อัตรากำลังที่ยังว่างอยู่",
        value: dashboard.headcount_vacant_total || 0,
        suffix: "อัตรา",
        icon: <WarningOutlined />,
        bg: "from-amber-500 to-orange-500",
        note: "จำนวนตำแหน่งที่ยังขาด",
      },
      {
        title: "Coverage Rate",
        value:
          dashboard.headcount_target_total > 0
            ? Math.round(
                (dashboard.headcount_actual_total /
                  dashboard.headcount_target_total) *
                  100
              )
            : 0,
        suffix: "%",
        icon: <RiseOutlined />,
        bg: "from-violet-500 to-fuchsia-500",
        note: "อัตราการเติมคนครบตามแผน",
      },
    ],
    [dashboard]
  );

  const quickMenus = useMemo(() => {
    return sidebarMenus
      .flatMap((group) => group.items || [])
      .filter((item) => item.href !== "/admin")
      .filter((item) => {
        if (!item.permission) return true;
        return hasPermission(user, item.permission);
      });
  }, [user]);

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canViewDashboard) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="space-y-6 p-4 lg:p-6">
        {/* HERO */}
        <Card
          variant="borderless"
          className="overflow-hidden rounded-[32px] border border-slate-200 shadow-sm"
          styles={{ body: { padding: 0 } }}
        >
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-6 py-8 lg:px-8 lg:py-10">
            <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Tag className="m-0 rounded-full border-0 bg-sky-100 px-4 py-1 text-sky-700">
                    Employee Master
                  </Tag>

                  <Tag className="m-0 rounded-full border-0 bg-emerald-100 px-4 py-1 text-emerald-700">
                    Dashboard
                  </Tag>
                </div>

                <Title level={2} className="!mb-2 !text-slate-800">
                  ยินดีต้อนรับ,{" "}
                  <span className="bg-gradient-to-r from-sky-600 to-emerald-500 bg-clip-text text-transparent">
                    {user?.full_name || user?.username || "ผู้ใช้งาน"}
                  </span>
                </Title>

                <Text className="block max-w-2xl text-base leading-relaxed !text-slate-500">
                  ภาพรวมการจัดการข้อมูลพนักงาน โครงสร้างองค์กร
                  และสิทธิ์ผู้ใช้งานในระบบ Employee Master
                  ให้ใช้งานง่าย ดูสบายตา และเข้าถึงข้อมูลสำคัญได้รวดเร็ว
                </Text>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    type="primary"
                    size="large"
                    className="!h-[50px] !rounded-2xl !border-0 !bg-sky-500 !px-6 !font-medium hover:!bg-sky-600"
                    onClick={() => router.push("/admin/employees")}
                  >
                    ไปหน้าพนักงาน
                  </Button>

                  <Button
                    size="large"
                    className="!h-[50px] !rounded-2xl !border-slate-200 !bg-white !px-6 !text-slate-700 shadow-sm hover:!border-sky-200 hover:!text-sky-600"
                    onClick={() => router.push("/admin/user-accounts")}
                  >
                    จัดการผู้ใช้งาน
                  </Button>

                  <Button
                    size="large"
                    className="!h-[50px] !rounded-2xl !border-slate-200 !bg-white !px-6 !text-slate-700 shadow-sm hover:!border-sky-200 hover:!text-sky-600"
                    onClick={() => router.push("/admin/manpower")}
                  >
                    ไปหน้ากำลังคน
                  </Button>

                  <a
                    href="/api/admin/dashboard/export"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    <DownloadOutlined />
                    Export Excel
                  </a>

                </div>
              </div>

              <div className="flex min-w-[300px] items-center gap-4 rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
                <Avatar
                  size={72}
                  icon={<UserOutlined />}
                  className="!bg-gradient-to-br !from-sky-400 !to-emerald-400"
                />

                <div className="flex-1">
                  <div className="text-xl font-bold text-slate-800">
                    {user?.username || "-"}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {user?.role_name || user?.role_code || "User"}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Tag className="m-0 rounded-full border-0 bg-emerald-100 px-3 py-1 text-emerald-700">
                      Active Session
                    </Tag>

                    <Tag className="m-0 rounded-full border-0 bg-slate-100 px-3 py-1 text-slate-500">
                      Online
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* SUMMARY */}
        <Row gutter={[16, 16]}>
          {summaryCards.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card
                variant="borderless"
                className="rounded-[24px] shadow-sm"
                styles={{ body: { padding: 20 } }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg text-slate-700">
                    {item.icon}
                  </div>

                  <Tag className="m-0 rounded-full border-0 bg-emerald-50 text-emerald-700">
                    <ArrowUpOutlined /> {item.growth}
                  </Tag>
                </div>

                <Statistic
                  title={<span className="text-slate-500">{item.title}</span>}
                  value={loadingDashboard ? "-" : item.value}
                  suffix={item.suffix}
                  styles={{
                    value: {
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#0f172a",
                    },
                  }}
                />

                <div className="mt-3 text-sm text-slate-400">{item.note}</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* MANPOWER SUMMARY */}
        <Row gutter={[16, 16]}>
          {manpowerCards.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card
                variant="borderless"
                className="overflow-hidden rounded-[24px] shadow-sm"
                styles={{ body: { padding: 0 } }}
              >
                <div className={`bg-gradient-to-br ${item.bg} p-5 text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-white/80">{item.title}</div>
                      <div className="mt-3 text-3xl font-bold">
                        {loadingDashboard ? "-" : item.value}
                        <span className="ml-2 text-base font-medium text-white/80">
                          {item.suffix}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">
                      {item.icon}
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-white/80">{item.note}</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* EMPLOYEE STATUS SUMMARY */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    สรุปสถานะพนักงาน
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    ภาพรวมสถานะพนักงานทั้งหมดในระบบ
                  </div>
                </div>
              }
            >
              {loadingDashboard ? (
                <div className="flex flex-wrap gap-3">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton.Button
                      key={index}
                      active
                      size="medium"
                      shape="round"
                    />
                  ))}
                </div>
              ) : dashboard.employee_status_summary?.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {dashboard.employee_status_summary.map((item, index) => (
                    <div
                      key={`${item.status_name}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusTagClasses(
                            item.color
                          )}`}
                        >
                          {item.status_name}
                        </span>
                        <span className="text-lg font-bold text-slate-800">
                          {item.total}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
                  ยังไม่มีข้อมูลสถานะพนักงาน
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* TOP SHORTAGE + MANPOWER OVERVIEW */}
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    ตำแหน่งที่ยังขาดมากที่สุด
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    Top 5 Unit / Position ที่ยังเปิดรับ
                  </div>
                </div>
              }
            >
              {loadingDashboard ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} active paragraph={{ rows: 1 }} />
                  ))}
                </div>
              ) : dashboard.top_unit_position_shortages?.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.top_unit_position_shortages.map((item, index) => (
                    <div
                      key={`${item.unit_id}-${item.position_id}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                              {index + 1}
                            </div>

                            <div>
                              <div className="font-semibold text-slate-800">
                                {item.position_name}
                              </div>
                              <div className="text-sm text-slate-500">
                                {item.unit_name}
                              </div>
                            </div>
                          </div>
                        </div>

                        <Tag className="m-0 rounded-full border-0 bg-red-100 px-3 py-1 text-red-600">
                          ขาด {item.headcount_vacant} คน
                        </Tag>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                          <span>
                            มีจริง {item.headcount_actual} / เป้าหมาย{" "}
                            {item.headcount_target}
                          </span>
                          <span>
                            {item.headcount_target > 0
                              ? Math.round(
                                  (item.headcount_actual /
                                    item.headcount_target) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>

                        <Progress
                          percent={
                            item.headcount_target > 0
                              ? Math.round(
                                  (item.headcount_actual /
                                    item.headcount_target) *
                                    100
                                )
                              : 0
                          }
                          showInfo={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
                  ยังไม่มีข้อมูลตำแหน่งที่ขาด
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} xl={12}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    ภาพรวมกำลังคน
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    เปรียบเทียบจำนวนเป้าหมายและจำนวนจริง
                  </div>
                </div>
              }
            >
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                    <span>Target vs Actual</span>
                    <span className="font-semibold text-slate-700">
                      {dashboard.headcount_actual_total || 0} /{" "}
                      {dashboard.headcount_target_total || 0}
                    </span>
                  </div>

                  <Progress
                    percent={
                      dashboard.headcount_target_total > 0
                        ? Math.round(
                            (dashboard.headcount_actual_total /
                              dashboard.headcount_target_total) *
                              100
                          )
                        : 0
                    }
                    status="active"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-sky-50 p-4">
                    <div className="text-sm text-slate-500">Target</div>
                    <div className="mt-1 text-2xl font-bold text-sky-700">
                      {dashboard.headcount_target_total || 0}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-emerald-50 p-4">
                    <div className="text-sm text-slate-500">Actual</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-700">
                      {dashboard.headcount_actual_total || 0}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-amber-50 p-4">
                    <div className="text-sm text-slate-500">Vacant</div>
                    <div className="mt-1 text-2xl font-bold text-amber-700">
                      {dashboard.headcount_vacant_total || 0}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-red-600 font-bold">
                  ตำแหน่งที่ขาดทั้งหมด {dashboard.shortage_unit_positions_total || 0}{" "}
                  รายการ
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ALL SHORTAGE POSITIONS */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    ทุกตำแหน่งที่ยังขาด
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    แสดงเฉพาะ Unit / Position ที่ยังมีจำนวนไม่ครบตามเป้าหมาย
                  </div>
                </div>
              }
            >
              {loadingDashboard ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <Skeleton active paragraph={{ rows: 2 }} title={false} />
                    </div>
                  ))}
                </div>
              ) : dashboard.shortage_unit_positions?.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {dashboard.shortage_unit_positions.map((item, index) => (
                    <div
                      key={`${item.unit_id}-${item.position_id}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Tag className="m-0 rounded-full border-0 bg-slate-100 px-3 py-1 text-slate-600">
                              #{index + 1}
                            </Tag>

                            <Tag className="m-0 rounded-full border-0 bg-red-100 px-3 py-1 text-red-600">
                              ขาด {item.headcount_vacant} คน
                            </Tag>
                          </div>

                          <div className="mt-3 text-lg font-bold text-slate-800">
                            {item.position_name}
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            Unit: {item.unit_name}
                          </div>
                        </div>

                        <div className="grid min-w-[220px] grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-sky-50 p-3 text-center">
                            <div className="text-xs text-slate-500">Target</div>
                            <div className="mt-1 text-lg font-bold text-sky-700">
                              {item.headcount_target}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                            <div className="text-xs text-slate-500">Actual</div>
                            <div className="mt-1 text-lg font-bold text-emerald-700">
                              {item.headcount_actual}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-amber-50 p-3 text-center">
                            <div className="text-xs text-slate-500">Vacant</div>
                            <div className="mt-1 text-lg font-bold text-amber-700">
                              {item.headcount_vacant}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                          <span>ความครอบคลุมอัตรากำลัง</span>
                          <span>
                            {item.headcount_target > 0
                              ? Math.round(
                                  (item.headcount_actual /
                                    item.headcount_target) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>

                        <Progress
                          percent={
                            item.headcount_target > 0
                              ? Math.round(
                                  (item.headcount_actual /
                                    item.headcount_target) *
                                    100
                                )
                              : 0
                          }
                          showInfo={false}
                          status={
                            item.headcount_actual >= item.headcount_target
                              ? "success"
                              : "active"
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
                  ตอนนี้ยังไม่มีตำแหน่งที่ขาด
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* POSITION STATUS BREAKDOWNS */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    สถานะพนักงานตามตำแหน่ง
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    ดูสถานะพนักงานของแต่ละ Unit / Position เทียบกับเป้าหมาย
                  </div>
                </div>
              }
            >
              {loadingDashboard ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <Skeleton active paragraph={{ rows: 2 }} title={false} />
                    </div>
                  ))}
                </div>
              ) : dashboard.position_status_breakdowns?.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {dashboard.position_status_breakdowns.map((item, index) => (
                    <div
                      key={`${item.unit_id}-${item.position_id}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="text-lg font-bold text-slate-800">
                            {item.position_name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            Unit: {item.unit_name}
                          </div>
                        </div>

                        <div className="grid min-w-[220px] grid-cols-3 gap-3">
                          <div className="rounded-2xl bg-sky-50 p-3 text-center">
                            <div className="text-xs text-slate-500">Target</div>
                            <div className="mt-1 text-lg font-bold text-sky-700">
                              {item.headcount_target}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
                            <div className="text-xs text-slate-500">Actual</div>
                            <div className="mt-1 text-lg font-bold text-emerald-700">
                              {item.headcount_actual}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-amber-50 p-3 text-center">
                            <div className="text-xs text-slate-500">Vacant</div>
                            <div className="mt-1 text-lg font-bold text-amber-700">
                              {item.headcount_vacant}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.statuses?.length > 0 ? (
                          item.statuses.map((status, statusIndex) => (
                            <span
                              key={`${status.status_name}-${statusIndex}`}
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusTagClasses(
                                status.color
                              )}`}
                            >
                              {status.status_name} {status.total} คน
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            ยังไม่มีพนักงานในตำแหน่งนี้
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                          <span>ความครอบคลุมอัตรากำลัง</span>
                          <span>
                            {item.headcount_target > 0
                              ? Math.round(
                                  (item.headcount_actual /
                                    item.headcount_target) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>

                        <Progress
                          percent={
                            item.headcount_target > 0
                              ? Math.round(
                                  (item.headcount_actual /
                                    item.headcount_target) *
                                    100
                                )
                              : 0
                          }
                          showInfo={false}
                          status={
                            item.headcount_actual >= item.headcount_target
                              ? "success"
                              : "active"
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
                  ยังไม่มีข้อมูลสถานะพนักงานตามตำแหน่ง
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* SYSTEM OVERVIEW */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    ภาพรวมระบบ
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    สถานะข้อมูลและความพร้อมใช้งาน
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        ความสมบูรณ์ของข้อมูลพนักงาน
                      </span>
                      <span className="font-semibold text-slate-700">84%</span>
                    </div>
                    <Progress percent={84} showInfo={false} />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        ความพร้อมของสิทธิ์ผู้ใช้งาน
                      </span>
                      <span className="font-semibold text-slate-700">91%</span>
                    </div>
                    <Progress percent={91} showInfo={false} status="active" />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-500">
                        โครงสร้างองค์กรที่ตั้งค่าครบ
                      </span>
                      <span className="font-semibold text-slate-700">76%</span>
                    </div>
                    <Progress percent={76} showInfo={false} />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-slate-700">
                    <CheckCircleOutlined className="text-emerald-600" />
                    <span className="font-semibold">System Status</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Tag className="m-0 rounded-full border-0 bg-emerald-100 text-emerald-700">
                      API Ready
                    </Tag>
                    <Tag className="m-0 rounded-full border-0 bg-blue-100 text-blue-700">
                      Auth Connected
                    </Tag>
                    <Tag className="m-0 rounded-full border-0 bg-amber-100 text-amber-700">
                      Permission Active
                    </Tag>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm text-slate-400">Companies</div>
                      <div className="mt-1 text-lg font-semibold text-slate-800">
                        {dashboard.companies || 0}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm text-slate-400">Branches</div>
                      <div className="mt-1 text-lg font-semibold text-slate-800">
                        {dashboard.branches || 0}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm text-slate-400">Departments</div>
                      <div className="mt-1 text-lg font-semibold text-slate-800">
                        {dashboard.departments || 0}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm text-slate-400">Divisions</div>
                      <div className="mt-1 text-lg font-semibold text-slate-800">
                        {dashboard.divisions || 0}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm text-slate-400">Units</div>
                      <div className="mt-1 text-lg font-semibold text-slate-800">
                        {dashboard.units || 0}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm text-slate-400">Positions</div>
                      <div className="mt-1 text-lg font-semibold text-slate-800">
                        {dashboard.positions || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* QUICK MENU */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    เมนูลัดสำหรับผู้ดูแลระบบ
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    เข้าถึงเมนูหลักได้รวดเร็วขึ้น
                  </div>
                </div>
              }
            >
              {quickMenus.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {quickMenus.map((menu) => (
                    <button
                      key={menu.href}
                      type="button"
                      onClick={() => router.push(menu.href)}
                      className="group relative flex flex-col overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]"
                    >
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-50/0 transition-all duration-500 group-hover:bg-blue-50/50" />

                      <div className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-300 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white">
                        <ArrowUpOutlined
                          rotate={45}
                          style={{ fontSize: "20px" }}
                        />
                      </div>

                      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl text-slate-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-700 group-hover:text-white group-hover:shadow-xl group-hover:shadow-slate-200">
                        {menu.icon}
                      </div>

                      <div className="relative">
                        <h3 className="text-lg font-bold tracking-tight text-slate-800 transition-colors group-hover:text-blue-600">
                          {menu.label}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                          เข้าถึงเมนู {menu.label} และจัดการข้อมูลทั้งหมดในส่วนนี้
                        </p>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
                        <span className="translate-x-[-10px] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                          Explore Menu
                        </span>
                        <div className="h-[2px] w-0 bg-blue-600 transition-all duration-300 group-hover:w-8" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
                  ไม่มีเมนูที่คุณสามารถเข้าถึงได้
                </div>
              )}
            </Card>
          </Col>
        </Row>

        {/* USAGE OVERVIEW */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    ภาพรวมการใช้งาน
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    ข้อมูลสรุประดับระบบ
                  </div>
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-400">Role ปัจจุบัน</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {user?.role_name || user?.role_code || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-400">Username</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {user?.username || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-400">Employee Code</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {dashboard.employees || 0} คน
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-400">Permissions</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {Array.isArray(user?.permissions) ? user.permissions.length : 0}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-400">Companies</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {dashboard.companies || 0} บริษัท
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-400">Branches</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {dashboard.branches || 0} สาขา
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-400">Departments</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {dashboard.departments || 0} แผนก
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-400">Divisions</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {dashboard.divisions || 0} ฝ่าย
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-400">Units</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {dashboard.units || 0} หน่วยงาน
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-400">Positions</div>
                  <div className="mt-1 text-lg font-semibold text-slate-800">
                    {dashboard.positions || 0} ตำแหน่ง
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Dashboard นี้เชื่อมข้อมูลจริงจากฐานข้อมูลแล้ว และเมนูจะแสดงตามสิทธิ์ของผู้ใช้งานปัจจุบัน
              </div>
            </Card>
          </Col>
        </Row>

        {/* RECENT ACTIVITIES */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              variant="borderless"
              className="rounded-[24px] shadow-sm"
              title={
                <div>
                  <div className="text-lg font-semibold text-slate-800">
                    กิจกรรมล่าสุด
                  </div>
                  <div className="text-sm font-normal text-slate-400">
                    ดึงข้อมูลล่าสุดจากฐานข้อมูลจริง
                  </div>
                </div>
              }
            >
              {loadingDashboard ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <Skeleton active paragraph={{ rows: 2 }} title={false} />
                    </div>
                  ))}
                </div>
              ) : dashboard.recent_activities?.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {dashboard.recent_activities.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${getActivityColor(
                            item.action
                          )}`}
                        >
                          <ClockCircleOutlined />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-base font-semibold text-slate-800">
                            {item.title}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <span>{formatThaiDateTime(item.activity_at)}</span>
                            <span className="text-slate-300">•</span>
                            <span className="capitalize">{item.entity}</span>
                            <span className="text-slate-300">•</span>
                            <span className="capitalize">{item.action}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Pagination
                      current={activityPage}
                      pageSize={activityPageSize}
                      total={dashboard.recent_activities_total || 0}
                      onChange={(page) => setActivityPage(page)}
                      showSizeChanger={false}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
                  ยังไม่พบกิจกรรมล่าสุดในระบบ
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}