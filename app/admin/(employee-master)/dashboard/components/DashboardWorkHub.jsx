"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  ApartmentOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  BankOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DownOutlined,
  FileTextOutlined,
  IdcardOutlined,
  ImportOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SettingOutlined,
  SolutionOutlined,
  TeamOutlined,
  UpOutlined,
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
  const [setupGuideOpen, setSetupGuideOpen] = useState(false);

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

  const go = (href) => {
    if (!href) return;
    router.push(href);
  };

  return (
    <div className="flex flex-col gap-10 py-6">
      <Card
        data-dashboard-tour="workspace"
        className="rounded-2xl border-blue-100 shadow-sm"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between ">
          <div>
            <Space size={8} wrap>
              <Tag color="blue">HR WORKSPACE</Tag>
              <Tag>{roleCode || "ROLE"}</Tag>
            </Space>

            <Title level={4} className="!mb-1 !mt-2 !text-slate-900">
              งานของคุณ และทางลัดไปยังส่วนที่ต้องจัดการ
            </Title>

            <Text className="text-slate-500">
              งานหลักจัดลำดับตาม Role <strong>{roleName}</strong> และทุกหมวดด้านล่าง
              แสดงตาม Permission — สามารถใช้งาน Dashboard แทน Sidebar ได้
            </Text>
          </div>

          <div
            data-dashboard-tour="search"
            className="w-full xl:w-[430px]"
          >
            <Input
              allowClear
              size="large"
              prefix={<SearchOutlined className="text-slate-400" />}
              placeholder="ค้นหา เช่น พนักงาน, ภาษี, Payroll, Role..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </Card>

      {cleanText(search) ? (
        <Card
          title={`ผลการค้นหา (${searchResults.length})`}
          className="rounded-2xl border-slate-200 shadow-sm"
        >
          {searchResults.length ? (
            <Row gutter={[12, 12]}>
              {searchResults.map((item) => (
                <Col xs={24} md={12} xl={8} key={item.key || item.href}>
                  <button
                    type="button"
                    onClick={() => go(item.href)}
                    className="flex min-h-[92px] w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                      {ICONS[item.icon] || <ArrowRightOutlined />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800">{item.label}</div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {item.description || "เปิดหน้าจัดการ"}
                      </div>
                    </div>
                    <ArrowRightOutlined className="text-slate-300" />
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
          <Card
            data-dashboard-tour="primary-work "
            title={
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-lg text-white shadow-sm">
                  <CheckCircleOutlined />
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">งานหลักของคุณ</div>
                  <div className="text-xs font-normal text-slate-500">
                    เริ่มงานจากส่วนนี้ก่อน — ระบบจัดลำดับตาม Role และ Permission ของคุณ
                  </div>
                </div>
              </div>
            }
            extra={
              <Space size={8} wrap>
                <Tag color="blue">{roleName}</Tag>
                <Tag color="gold">เริ่มจากตรงนี้</Tag>
              </Space>
            }
            className="overflow-hidden rounded-2xl border-2 border-blue-200 shadow-md"
          >
            <div className="mb-5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4 text-white shadow-sm ">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-blue-100">งานที่ควรเห็นและใช้บ่อยที่สุด</div>
                  <div className="mt-1 text-lg font-bold">
                    คุณมีงานหลัก {primaryDailyActions.length} รายการที่พร้อมใช้งาน
                  </div>
                  <div className="mt-1 text-xs leading-5 text-blue-100">
                    รายการด้านล่างผ่านการกรองแล้ว กดที่การ์ดเพื่อเริ่มทำงานได้ทันที
                  </div>
                </div>
                <div className="rounded-xl bg-white/15 px-4 py-2 text-center backdrop-blur-sm">
                  <div className="text-2xl font-bold">{primaryDailyActions.length}</div>
                  <div className="text-xs text-blue-100">งานหลักของคุณ</div>
                </div>
              </div>
            </div>

            {primaryDailyActions.length ? (
              <Row gutter={[18, 18]}>
                {primaryDailyActions.map((item, index) => (
                  <Col xs={24} sm={12} xl={6} key={item.key}>
                    <button
                      type="button"
                      onClick={() => go(item.href)}
                      className="group relative flex min-h-[158px] w-full flex-col overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg"
                    >
                      <div className="absolute right-3 top-3 rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        งานหลัก #{index + 1}
                      </div>

                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white shadow-sm">
                        {ICONS[item.icon] || <ArrowRightOutlined />}
                      </div>

                      <div className="pr-20 text-[15px] font-bold text-slate-900">{item.label}</div>
                      <div className="mt-1 flex-1 text-xs leading-5 text-slate-500">
                        {item.description}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-blue-100 pt-3">
                        <span className="text-xs font-semibold text-blue-600">ควรใช้เป็นประจำ</span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                          เริ่มงาน <ArrowRightOutlined />
                        </span>
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
          </Card>

          <Card
            data-dashboard-tour="daily-work"
            title={
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white shadow-sm">
                  <SolutionOutlined />
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">งานที่ใช้เป็นประจำทั้งหมด</div>
                  <div className="text-xs font-normal text-slate-500">
                    เมนูงานปฏิบัติการทั้งหมดที่บัญชีนี้มี
                  </div>
                </div>
              </div>
            }
            extra={
              <Space size={8} wrap>
                <Tag color="green">{dailyGroups.length} หมวด</Tag>
                <Tag color="cyan">{dailyActionCount} งานที่เข้าได้</Tag>
              </Space>
            }
            className="overflow-hidden rounded-2xl border-2 border-emerald-200 shadow-md"
          >
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <div className="flex items-start gap-3">
                <CheckCircleOutlined className="mt-0.5 text-xl text-emerald-600" />
                <div>
                  <div className="font-bold text-emerald-900">ถ้าหางานไม่เจอจาก “งานหลักของคุณ” ให้ดูส่วนนี้</div>
                  <div className="mt-1 text-sm leading-6 text-emerald-800">
                    รวมงานประจำ งานตามรอบ และงานตามเหตุการณ์ทั้งหมดที่  เช่น การครองตำแหน่งองค์กร ค่าตอบแทน ภาษี ประกันสังคม Recruitment Payroll และงาน HR อื่น ๆ
                  </div>
                </div>
              </div>
            </div>

            {dailyGroups.length ? (
              <Row gutter={[18, 18]}>
                {dailyGroups.map((group) => (
                  <Col xs={24} lg={12} xxl={8} key={group.key}>
                    <Card
                      size="small"
                      className="h-full overflow-hidden rounded-2xl border-emerald-100 bg-white shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="-mx-3 -mt-3 mb-3 border-b border-emerald-100 bg-emerald-50/70 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-emerald-600 shadow-sm">
                            {ICONS[group.icon] || <ArrowRightOutlined />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-bold text-slate-900">{group.title}</div>
                              <Tag color="green">{group.items.length} งาน</Tag>
                            </div>
                            <div className="mt-0.5 text-xs leading-5 text-slate-500">
                              {group.subtitle}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => go(item.href)}
                            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                          >
                            <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-800">
                              {item.label}
                            </span>
                            <ArrowRightOutlined className="shrink-0 text-slate-300 group-hover:text-emerald-600" />
                          </button>
                        ))}
                      </div>
                    </Card>
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

          <Card
            data-dashboard-tour="setup-guide"
            title="ตั้งค่าพื้นฐาน HRMS"
            extra={
              <Space size={8} wrap>
                <Tag color="gold">ทำครั้งแรก / กลับมาเมื่อมีการเปลี่ยนแปลง</Tag>
                <Button
                  size="small"
                  onClick={() => setSetupGuideOpen((current) => !current)}
                  icon={setupGuideOpen ? <UpOutlined /> : <DownOutlined />}
                >
                  {setupGuideOpen ? "ปิด" : "เปิด"}
                </Button>
              </Space>
            }
            className="rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm"
          >
            <DashboardSetupJourney
              user={user}
              compact={!setupGuideOpen}
            />

            {setupGuideOpen ? (
              <>
                <div className="mb-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <strong>ไม่ใช่ Step ที่ต้องทำซ้ำทุกวัน:</strong> ลำดับด้านบนใช้เป็นแนวทางจากขั้นแรกถึงขั้นสุดท้ายตอนเริ่มระบบ
                  ส่วนรายการด้านล่างคือทางลัดไปยัง Master / Setup ทั้งหมดที่บัญชีนี้มี Permission
                </div>

                {setupGroups.length ? (
                  <Row gutter={[18, 18]}>
                    {setupGroups.map((group) => (
                      <Col xs={24} lg={12} xxl={8} key={group.key}>
                        <Card
                          size="small"
                          className="h-full rounded-2xl border-slate-200 bg-slate-50/60"
                        >
                          <div className="mb-3 flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-blue-600 shadow-sm">
                              {ICONS[group.icon] || <SettingOutlined />}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900">
                                {group.order}. {group.title}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {group.subtitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {group.items.map((item) => (
                              <Button
                                key={item.href}
                                size="small"
                                onClick={() => go(item.href)}
                              >
                                {item.label}
                              </Button>
                            ))}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="User นี้ไม่มี Permission สำหรับหน้าตั้งค่า"
                  />
                )}
              </>
            ) : null}
          </Card>
        </>
      )}
    </div>
  );
}
