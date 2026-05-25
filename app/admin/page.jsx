"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Tag, Avatar, Typography, Input, Empty } from "antd";
import {UserOutlined,UnlockOutlined,ArrowRightOutlined,AppstoreOutlined,SafetyCertificateOutlined,SearchOutlined,TeamOutlined,SettingOutlined,LockOutlined,} from "@ant-design/icons";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../components/LoadingOrb";
import { systemApps } from "./components/systemApps";

const { Title, Text } = Typography;

export default function AdminPage() {
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, loadingUser, router]);

  const visibleSystemApps = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return systemApps
      .filter((app) => {
        if (!app.permission) return true;
        return hasPermission(user, app.permission);
      })
      .filter((app) => {
        if (!keyword) return true;

        return (
          app.code?.toLowerCase().includes(keyword) ||
          app.title?.toLowerCase().includes(keyword) ||
          app.subtitle?.toLowerCase().includes(keyword) ||
          app.description?.toLowerCase().includes(keyword) ||
          app.category?.toLowerCase().includes(keyword)
        );
      })
      .sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  }, [user, search]);

  const groupedSystemApps = useMemo(() => {
    return visibleSystemApps.reduce((groups, app) => {
      const category = app.category || "Other";

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(app);

      return groups;
    }, {});
  }, [visibleSystemApps]);

  const visibleCategories = useMemo(() => {
    return Object.keys(groupedSystemApps);
  }, [groupedSystemApps]);

  // เพิ่ม สำหรับเมนูทางลัด
  const adminMenus = useMemo(
    () => [
      {
        title: "จัดการพนักงาน",
        description: "เพิ่ม แก้ไข และตรวจสอบข้อมูลพนักงาน",
        path: "/admin/employees",
        permission: "ems.portal.view",
        icon: <TeamOutlined />,
      },
      {
        title: "Roles",
        description: "กำหนดสิทธิ์การเข้าถึงระบบและเมนู",
        path: "/admin/roles",
        permission: "access.roles.view",
        icon: <SafetyCertificateOutlined />,
      },
      {
        title: "API Management",
        description: "จัดการ API Clients, Tokens และ Logs",
        path: "/admin/api-tokens",
        permission: "api.api_tokens.view",
        icon: <SettingOutlined />,
      },
      {
        title: "Roles & Permissions",
        description: "กำหนดสิทธิ์การใช้งานระบบ",
        path: "/admin/role-permissions",
        permission: "access.role_permissions.view",
        icon: <LockOutlined />,
      },
      {
        title: "Permissions",
        description: "จัดการสิทธิ์การเข้าถึงเมนูและการใช้งานในระบบ",
        path: "/admin/permissions",
        permission: "access.permissions.view",
        icon: <UnlockOutlined  />,
      },
    ],
    []
  );

  const visibleAdminMenus = useMemo(() => {
    return adminMenus.filter((menu) => {
      if (!menu.permission) return true;
      return hasPermission(user, menu.permission);
    });
  }, [adminMenus, user]);

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="space-y-6 p-4 lg:p-6">
        <Card
          variant="borderless"
          className="overflow-hidden rounded-[32px] border border-slate-200 shadow-sm"
          styles={{ body: { padding: 0 } }}
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 px-6 py-8 text-white lg:px-8 lg:py-10">
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Tag className="m-0 rounded-full border-0 bg-white/15 px-4 py-1 text-white">
                    HR Portal
                  </Tag>

                  <Tag className="m-0 rounded-full border-0 bg-emerald-400/20 px-4 py-1 text-emerald-100">
                    Single Sign-On
                  </Tag>

                  <Tag className="m-0 rounded-full border-0 bg-sky-400/20 px-4 py-1 text-sky-100">
                    Permission Based
                  </Tag>
                </div>

                <Title level={2} className="!mb-2 !text-white">
                  ยินดีต้อนรับ,{" "}
                  <span className="text-sky-300">
                    {user?.full_name || user?.username || "ผู้ใช้งาน"}
                  </span>
                </Title>

                <Text className="block max-w-2xl text-base leading-relaxed !text-slate-300">
                  ศูนย์กลางการเข้าใช้งานระบบ HR ขององค์กร
                  เลือกระบบที่ต้องการใช้งานได้ตามสิทธิ์ของคุณ
                </Text>
              </div>

              <div className="flex min-w-[280px] items-center gap-4 rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-xl">
                <Avatar
                  size={72}
                  src={user?.employee_photo_url || undefined}
                  icon={!user?.employee_photo_url ? <UserOutlined /> : null}
                  className="!bg-gradient-to-br !from-sky-400 !to-emerald-400"
                />

                <div className="flex-1">
                  <div className="text-xl font-bold text-white">
                    {user?.username || "-"}
                  </div>

                  <div className="mt-1 text-sm text-slate-300">
                    {user?.role_name || user?.role_code || "User"}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Tag className="m-0 rounded-full border-0 bg-emerald-400/20 px-3 py-1 text-emerald-100">
                      Active
                    </Tag>

                    <Tag className="m-0 rounded-full border-0 bg-white/10 px-3 py-1 text-slate-200">
                      Online
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          variant="borderless"
          className="rounded-[28px] shadow-sm"
          title={
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <AppstoreOutlined />
                  ระบบที่คุณสามารถใช้งานได้
                </div>

                <div className="text-sm font-normal text-slate-400">
                  แสดงเฉพาะระบบที่ Role / Permission ของคุณมีสิทธิ์เข้าใช้งาน
                </div>
              </div>

              <Input
                allowClear
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<SearchOutlined className="text-slate-400" />}
                placeholder="ค้นหาระบบ เช่น Benefit, Payroll, HRM"
                className="!h-11 !w-full !rounded-2xl lg:!w-[340px]"
              />
            </div>
          }
        >
          {visibleSystemApps.length > 0 ? (
            <div className="space-y-8">
              {visibleCategories.map((category) => (
                <div key={category}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="text-base font-bold text-slate-800">
                      {category}
                    </div>
                    <div className="h-px flex-1 bg-slate-200" />
                    <Tag className="m-0 rounded-full border-0 bg-slate-100 text-slate-500">
                      {groupedSystemApps[category].length} ระบบ
                    </Tag>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {groupedSystemApps[category].map((app) => (
                      <button
                        key={app.code}
                        type="button"
                        onClick={() => router.push(app.path)}
                        className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
                      >
                        <div
                          className={`bg-gradient-to-br ${
                            app.gradient || "from-slate-500 to-slate-700"
                          } p-5 text-white`}
                        >
                          <div className="mb-6 flex items-start justify-between gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur-sm">
                              {app.icon}
                            </div>

                            <Tag className="m-0 rounded-full border-0 bg-white/20 px-3 py-1 text-white">
                              {app.badge || app.code}
                            </Tag>
                          </div>

                          <div className="text-2xl font-bold">{app.title}</div>

                          <div className="mt-1 text-sm text-white/80">
                            {app.subtitle}
                          </div>
                        </div>

                        <div className="p-5">
                          <p className="min-h-[66px] text-sm leading-relaxed text-slate-500">
                            {app.description}
                          </p>

                          <div className="mt-5 flex items-center justify-between text-sm font-semibold text-sky-600">
                            <span>เข้าสู่ระบบ</span>
                            <ArrowRightOutlined className="transition-transform duration-300 group-hover:translate-x-1" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              description={
                search
                  ? "ไม่พบระบบที่ค้นหา หรือคุณยังไม่มีสิทธิ์เข้าใช้งาน"
                  : "ยังไม่มีระบบที่คุณสามารถเข้าใช้งานได้ กรุณาติดต่อผู้ดูแลระบบ"
              }
            />
          )}
        </Card>

        {visibleAdminMenus.length > 0 && (
          <Card
            variant="borderless"
            className="rounded-[28px] shadow-sm"
            title={
              <div>
                <div className="text-lg font-semibold text-slate-800">
                  เมนูผู้ดูแลระบบ
                </div>

                <div className="text-sm font-normal text-slate-400">
                  เมนูลัดสำหรับจัดการ Employee Master
                </div>
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleAdminMenus.map((menu) => (
                <button
                  key={menu.path}
                  type="button"
                  onClick={() => router.push(menu.path)}
                  className="group rounded-[22px] border border-slate-200 bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white">
                    {menu.icon}
                  </div>

                  <div className="text-base font-bold text-slate-800">
                    {menu.title}
                  </div>

                  <div className="mt-2 text-sm leading-relaxed text-slate-500">
                    {menu.description}
                  </div>

                  <div className="mt-4 text-sm font-semibold text-blue-600">
                    เปิดเมนู →
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card variant="borderless" className="rounded-[28px] shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm text-slate-400">Role ปัจจุบัน</div>
              <div className="mt-1 text-lg font-bold text-slate-800">
                {user?.role_name || user?.role_code || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm text-slate-400">Username</div>
              <div className="mt-1 text-lg font-bold text-slate-800">
                {user?.username || "-"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-sm text-slate-400">Permissions</div>
              <div className="mt-1 text-lg font-bold text-slate-800">
                {Array.isArray(user?.permissions) ? user.permissions.length : 0}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


/*
  บัตรประชาชน - 13 หลัก
  วันเดือนปีเกิด - 6 หลัก (YYMMDD)
  id line
*/