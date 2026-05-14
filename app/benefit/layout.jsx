// app/benefit/layout.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout, Button, Avatar, Tag } from "antd";
import { HomeOutlined, GiftOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";

import { AuthProvider, useAuth } from "@/contexts/AuthContext"; // ✅ เปลี่ยน
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../components/LoadingOrb";

const { Header, Content } = Layout;

function BenefitContent({ children }) {
  const router = useRouter();
  const { user, loadingUser } = useAuth(); // ✅ ดึงจาก Context

  const canAccessBenefit = hasPermission(user, "benefit.view");

  useEffect(() => {
    if (loadingUser) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessBenefit) {
      router.replace("/admin");
    }
  }, [user, loadingUser, canAccessBenefit, router]);

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

      <Content>{children}</Content>
    </Layout>
  );
}

export default function BenefitLayout({ children }) {
  return (
    <AuthProvider>  {/* ✅ ครอบ Provider ที่นี่ แทน root layout */}
      <BenefitContent>{children}</BenefitContent>
    </AuthProvider>
  );
}