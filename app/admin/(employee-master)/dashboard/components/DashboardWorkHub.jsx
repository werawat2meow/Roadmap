"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Empty,
  Input,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  IdcardOutlined,
  ImportOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SolutionOutlined,
  StarOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";

import { hasPermission } from "@/lib/permissions";

import DashboardSetupJourney from "./DashboardSetupJourney";

import {
  DAILY_WORK_GROUPS,
  DASHBOARD_ACTIONS,
  DEFAULT_DAILY_ACTION_KEYS,
  ROLE_DAILY_ACTION_KEYS,
  SETUP_GUIDE_GROUPS,
} from "../dashboardWorkHubConfig";

const { Text, Title } = Typography;

const ICONS = {
  ApartmentOutlined: <ApartmentOutlined />,
  AuditOutlined: <AuditOutlined />,
  BankOutlined: <BankOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  CalendarOutlined: <CalendarOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
  ClockCircleOutlined: <ClockCircleOutlined />,
  DollarOutlined: <DollarOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  IdcardOutlined: <IdcardOutlined />,
  ImportOutlined: <ImportOutlined />,
  KeyOutlined: <KeyOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  SettingOutlined: <SettingOutlined />,
  SolutionOutlined: <SolutionOutlined />,
  TeamOutlined: <TeamOutlined />,
  UserOutlined: <UserOutlined />,
  WalletOutlined: <WalletOutlined />,
};

const SETUP_LEVEL_META = {
  required: {
    key: "required",
    title: "จำเป็นก่อนเพิ่มพนักงาน",
    description:
      "ข้อมูล Master หลักที่ควรพร้อมก่อนเริ่มสร้างข้อมูลพนักงานใหม่",
    tag: "จำเป็น",
    color: "volcano",
  },
  conditional: {
    key: "conditional",
    title: "ตั้งค่าตามเงื่อนไข",
    description:
      "ตั้งค่าเมื่อองค์กรหรือพนักงานมีการใช้งานในส่วนนั้น",
    tag: "ตามเงื่อนไข",
    color: "gold",
  },
  additional: {
    key: "additional",
    title: "การตั้งค่าเพิ่มเติม",
    description:
      "Master และการตั้งค่าเสริมที่สามารถกลับมาจัดการภายหลังได้",
    tag: "เพิ่มเติม",
    color: "blue",
  },
};

const SETUP_LEVEL_ORDER = [
  "required",
  "conditional",
  "additional",
];

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeRoleCode(user) {
  const values = [
    user?.role_code,
    user?.role,
    user?.role?.role_code,
  ];

  const found = values.find((value) => cleanText(value));

  return cleanText(found).toUpperCase();
}

function getRoleDisplayName(user) {
  return (
    cleanText(user?.role_name) ||
    cleanText(user?.role?.role_name) ||
    normalizeRoleCode(user) ||
    "User"
  );
}

function canOpen(user, item) {
  if (!item?.href) return false;
  if (!item?.permission) return true;
  return hasPermission(user, item.permission);
}

function filterBySearch(items, keyword) {
  const search = cleanText(keyword).toLowerCase();

  if (!search) return items;

  return items.filter((item) => {
    const source = [
      item?.label,
      item?.description,
      item?.href,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return source.includes(search);
  });
}

export default function DashboardWorkHub({ user }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [workspace, setWorkspace] = useState("my-work");

  const roleCode = normalizeRoleCode(user);
  const roleName = getRoleDisplayName(user);

  const primaryDailyActions = useMemo(() => {
    const preferredKeys =
      ROLE_DAILY_ACTION_KEYS[roleCode] ||
      DEFAULT_DAILY_ACTION_KEYS;

    const preferred = preferredKeys
      .map((key) => DASHBOARD_ACTIONS[key])
      .filter(Boolean)
      .filter((item) => canOpen(user, item));

    if (preferred.length) {
      return preferred;
    }

    return DEFAULT_DAILY_ACTION_KEYS
      .map((key) => DASHBOARD_ACTIONS[key])
      .filter(Boolean)
      .filter((item) => canOpen(user, item));
  }, [roleCode, user]);

  const dailyGroups = useMemo(() => {
    return DAILY_WORK_GROUPS
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => canOpen(user, item)),
      }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  const dailyActionCount = useMemo(
    () => dailyGroups.reduce((total, group) => total + group.items.length, 0),
    [dailyGroups]
  );

  const setupGroups = useMemo(() => {
    return SETUP_GUIDE_GROUPS
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => canOpen(user, item)),
      }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  const setupSections = useMemo(() => {
    return SETUP_LEVEL_ORDER
      .map((level) => ({
        ...SETUP_LEVEL_META[level],
        groups: setupGroups.filter(
          (group) =>
            (group.employeeSetupLevel || "additional") === level
        ),
      }))
      .filter((section) => section.groups.length > 0);
  }, [setupGroups]);

  const searchableActions = useMemo(() => {
    const actionItems = Object.values(DASHBOARD_ACTIONS)
      .filter((item) => canOpen(user, item));

    const setupItems = setupGroups.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        key: `${group.key}:${item.href}`,
        description: `ตั้งค่า: ${group.title}`,
        icon: group.icon,
      }))
    );

    const byHref = new Map();

    [...actionItems, ...setupItems].forEach((item) => {
      if (!item?.href || byHref.has(item.href)) return;
      byHref.set(item.href, item);
    });

    return [...byHref.values()];
  }, [setupGroups, user]);

  const searchResults = useMemo(
    () => filterBySearch(searchableActions, search).slice(0, 18),
    [searchableActions, search]
  );

  const setupItemCount = useMemo(
    () => setupGroups.reduce((total, group) => total + group.items.length, 0),
    [setupGroups]
  );

  const go = (href) => {
    if (!href) return;
    router.push(href);
  };

  const setupCollapseItems = setupSections.map((section) => ({
    key: section.key,
    label: (
      <div className="flex flex-wrap items-center gap-2 py-1">
        <Tag color={section.color} style={{ marginInlineEnd: 0 }}>
          {section.tag}
        </Tag>
        <span className="font-semibold text-slate-800">
          {section.title}
        </span>
        <span className="text-xs text-slate-400">
          {section.groups.length} หมวด
        </span>
      </div>
    ),
    children: (
      <div>
        <div className="mb-4 text-sm text-slate-500">
          {section.description}
        </div>

        <Row gutter={[14, 14]}>
          {section.groups.map((group) => (
            <Col xs={24} lg={12} xxl={8} key={group.key}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-700">
                    {ICONS[group.icon] || <SettingOutlined />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">
                      {group.order}. {group.title}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {group.subtitle}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {group.items.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => go(item.href)}
                      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
                        {item.label}
                      </span>
                      <ArrowRightOutlined className="shrink-0 text-slate-300 group-hover:text-blue-600" />
                    </button>
                  ))}
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    ),
  }));

  return (
    <div className="space-y-5 py-1">
      <Card
        data-dashboard-tour="workspace"
        className="overflow-hidden rounded-2xl border-slate-200 shadow-sm transition-all hover:shadow-md"
      >
        {/* ส่วนหัวข้อและคำอธิบาย */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <SearchOutlined className="text-base" />
              </span>
              <Title level={4} className="!mb-0 !mt-0 !text-slate-900">
                ค้นหาเมนูและฟังก์ชัน
              </Title>
            </div>
            <Text className="text-sm text-slate-500">
              พิมพ์ชื่อเมนูเพื่อเข้าใช้งานระบบได้อย่างรวดเร็ว
            </Text>
          </div>

          {/* ส่วนแสดง Role หรือสถิติต่างๆ (สามารถเปิดใช้งานได้) */}
          {/* <Space size={[8, 8]} wrap>
            <Tag color="blue" className="px-3 py-1 rounded-full">{roleName}</Tag>
            <Tag className="px-3 py-1 rounded-full">{dailyActionCount} งาน</Tag>
            <Tag className="px-3 py-1 rounded-full">{setupItemCount} รายการตั้งค่า</Tag>
          </Space> */}
        </div>

        {/* ช่องสำหรับค้นหา */}
        <div
          data-dashboard-tour="search"
          className="mt-5 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 transition-all focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50"
        >
          <Input
            allowClear
            size="large"
            prefix={<SearchOutlined className="mr-2 text-slate-400 text-lg" />}
            placeholder="ค้นหาเมนูหรือฟังก์ชัน เช่น พนักงาน, Payroll, ภาษี, Role..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="!border-0 !bg-transparent !shadow-none [&>input]:!text-base"
          />
        </div>
      </Card>

      {cleanText(search) ? (
        <Card
          title={
            <div>
              <div className="font-semibold text-slate-900">
                ผลการค้นหา
              </div>
              <div className="text-xs font-normal text-slate-500">
                พบ {searchResults.length} รายการที่คุณมีสิทธิ์ใช้งาน
              </div>
            </div>
          }
          className="rounded-2xl border-slate-200 shadow-sm"
        >
          {searchResults.length ? (
            <Row gutter={[12, 12]}>
              {searchResults.map((item) => (
                <Col xs={24} md={12} xl={8} key={item.key || item.href}>
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    className="group flex min-h-[96px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-sm"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                      {ICONS[item.icon] || <ArrowRightOutlined />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800">
                        {item.label}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {item.description || "เปิดหน้าจัดการ"}
                      </div>
                    </div>

                    <ArrowRightOutlined className="text-slate-300 group-hover:text-blue-600" />
                  </button>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="ไม่พบเมนูที่คุณมีสิทธิ์ใช้งาน"
            />
          )}
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <Segmented
              block
              size="large"
              value={workspace}
              onChange={setWorkspace}
              options={[
                {
                  label: "งานของฉัน",
                  value: "my-work",
                  icon: <StarOutlined />,
                },
                {
                  label: "งานทั้งหมด",
                  value: "operations",
                  icon: <AppstoreOutlined />,
                },
                {
                  label: "ตั้งค่าระบบ",
                  value: "setup",
                  icon: <SettingOutlined />,
                },
              ]}
            />
          </Card>

          {workspace === "my-work" ? (
            <Card
              data-dashboard-tour="primary-work"
              title={
                <div>
                  <div className="font-bold text-slate-900">
                    งานของฉัน
                  </div>
                  <div className="text-xs font-normal text-slate-500">
                    ทางลัดงานที่เหมาะกับ Role นี้มากที่สุด
                  </div>
                </div>
              }
              extra={<Tag color="blue">{primaryDailyActions.length} รายการ</Tag>}
              className="rounded-2xl border-slate-200 shadow-sm"
            >
              {primaryDailyActions.length ? (
                <Row gutter={[16, 16]}>
                  {primaryDailyActions.map((item, index) => (
                    <Col xs={24} sm={12} xl={6} key={item.key}>
                      <button
                        type="button"
                        onClick={() => go(item.href)}
                        className="group flex min-h-[150px] w-full flex-col rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">
                            {ICONS[item.icon] || <ArrowRightOutlined />}
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                            #{index + 1}
                          </span>
                        </div>

                        <div className="mt-4 font-bold text-slate-900">
                          {item.label}
                        </div>
                        <div className="mt-1 flex-1 text-xs leading-5 text-slate-500">
                          {item.description}
                        </div>

                        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-600">
                          เปิดงาน <ArrowRightOutlined />
                        </div>
                      </button>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Role นี้ยังไม่มีงานหลักที่ตรงกับ Permission ปัจจุบัน"
                />
              )}

              {/* <Alert
                className="mt-5 rounded-xl"
                type="info"
                showIcon
                title="หาเมนูอื่นไม่เจอ?"
                description="เลือกแท็บ “งานทั้งหมด” หรือใช้ช่องค้นหาด้านบน ระบบจะแสดงเฉพาะหน้าที่คุณมีสิทธิ์เข้าใช้งาน"
              /> */}
            </Card>
          ) : null}

          {workspace === "operations" ? (
            <Card
              data-dashboard-tour="daily-work"
              title={
                <div>
                  <div className="font-bold text-slate-900">
                    งานทั้งหมดที่ใช้งานได้
                  </div>
                  <div className="text-xs font-normal text-slate-500">
                    จัดกลุ่มตามกระบวนงาน เพื่อให้หาเมนูได้เร็วขึ้น
                  </div>
                </div>
              }
              extra={
                <Space size={8} wrap>
                  <Tag>{dailyGroups.length} หมวด</Tag>
                  <Tag color="cyan">{dailyActionCount} งาน</Tag>
                </Space>
              }
              className="rounded-2xl border-slate-200 shadow-sm"
            >
              {dailyGroups.length ? (
                <Row gutter={[16, 16]}>
                  {dailyGroups.map((group) => (
                    <Col xs={24} lg={12} xxl={8} key={group.key}>
                      <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-slate-700 shadow-sm">
                              {ICONS[group.icon] || <ArrowRightOutlined />}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-bold text-slate-900">
                                  {group.title}
                                </div>
                                <Tag style={{ marginInlineEnd: 0 }}>
                                  {group.items.length}
                                </Tag>
                              </div>
                              <div className="mt-1 text-xs leading-5 text-slate-500">
                                {group.subtitle}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 p-3">
                          {group.items.map((item) => (
                            <button
                              key={item.href}
                              type="button"
                              onClick={() => go(item.href)}
                              className="group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-blue-50"
                            >
                              <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">
                                {item.label}
                              </span>
                              <ArrowRightOutlined className="shrink-0 text-slate-300 group-hover:text-blue-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="User นี้ยังไม่มี Permission สำหรับงานปฏิบัติการ"
                />
              )}
            </Card>
          ) : null}

          {workspace === "setup" ? (
            <Card
              data-dashboard-tour="setup-guide"
              title={
                <div>
                  <div className="font-bold text-slate-900">
                    ตั้งค่าระบบ HRMS
                  </div>
                  <div className="text-xs font-normal text-slate-500">
                    ตรวจความพร้อมและเปิด Master Data ตามลำดับความสำคัญ
                  </div>
                </div>
              }
              extra={<Tag color="blue">{setupItemCount} รายการ</Tag>}
              className="rounded-2xl border-slate-200 shadow-sm"
            >
              <DashboardSetupJourney
                user={user}
                compact={false}
              />

              <div className="mt-5">
                {setupCollapseItems.length ? (
                  <Collapse
                    defaultActiveKey={
                      setupCollapseItems.some((item) => item.key === "required")
                        ? ["required"]
                        : []
                    }
                    items={setupCollapseItems}
                    className="!rounded-2xl !border-slate-200 !bg-white"
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="User นี้ไม่มี Permission สำหรับหน้าตั้งค่า"
                  />
                )}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
