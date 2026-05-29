"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Layout, Button, Avatar, Tag, Menu } from "antd";
import {
  HomeOutlined,
  GiftOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../components/LoadingOrb";
import { getVisibleBenefitSidebarMenus } from "./components/benefitMenus";

const { Header, Content, Sider } = Layout;

function BenefitContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loadingUser } = useAuth();

  const canAccessBenefit = hasPermission(user, "benefit.view");

  useEffect(() => {
    if (loadingUser) return;
    if (!user) router.replace("/login");
    if (user && !canAccessBenefit) router.replace("/admin");
  }, [user, loadingUser, canAccessBenefit, router]);

  const sidebarMenus = useMemo(() => {
    return getVisibleBenefitSidebarMenus(user);
  }, [user]);

  const menuItems = sidebarMenus.map((section) => ({
    type: "group",
    label: section.title,
    children: section.items.map((item) => ({
      key: item.href,
      icon: item.icon,
      label: item.label,
    })),
  }));

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;
  if (!canAccessBenefit) return null;

  return (
    <Layout className="min-h-screen bg-slate-100">
      <Header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#073b2f] px-4 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/benefit")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-xl text-white">
            <GiftOutlined />
          </div>
          <div>
            <div className="text-base font-bold text-white">Benefit System</div>
            <div className="hidden text-xs text-emerald-100 sm:block">
              Enterprise Staff Benefit Platform
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => router.push("/admin")}
            className="!text-emerald-100 hover:!bg-white/10 hover:!text-white"
          />
          <Tag className="m-0 hidden rounded-full border-0 bg-white px-3 py-1 text-xs font-medium text-emerald-700 md:inline-flex">
            {user?.role_name || user?.role_code || "User"}
          </Tag>
          <Avatar
            src={user?.employee_photo_url || undefined}
            icon={!user?.employee_photo_url ? <UserOutlined /> : null}
            className="!bg-emerald-600"
          />
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => router.push("/admin")}
            className="!text-emerald-100 hover:!bg-white/10 hover:!text-white"
          >
            <span className="hidden lg:inline">Portal</span>
          </Button>
        </div>
      </Header>

      <Layout>
        <Sider
          width={290}
          theme="light"
          className="min-h-[calc(100vh-64px)] border-r border-slate-200"
        >
          <div className="border-b border-slate-100 p-4">
            <div className="text-sm font-bold text-slate-800">
              Benefit Modules
            </div>
            <div className="text-xs text-slate-500">
              แบ่งส่วนการทำงานของระบบสวัสดิการ
            </div>
          </div>

          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            className="border-0"
          />
        </Sider>

        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
}

export default function BenefitLayout({ children }) {
  return (
    <AuthProvider>
      <BenefitContent>{children}</BenefitContent>
    </AuthProvider>
  );
}