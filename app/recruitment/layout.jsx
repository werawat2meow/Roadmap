"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Avatar, Tag, Button, Tooltip, Dropdown } from "antd";
import {
  UserOutlined,
  LogoutOutlined,
  LoadingOutlined,
  HomeOutlined,
  KeyOutlined,
  MenuOutlined,
} from "@ant-design/icons";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoadingOrb from "@/app/components/LoadingOrb";
import { swalSuccess, swalError, swalConfirm } from "@/app/components/Swal";

import SidebarContent from "./components/SidebarContent";

const { Header, Content } = Layout;

function RecruitmentAuthGuard({ children }) {
  const { user, loadingUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.replace("/login");
    }
  }, [user, loadingUser, router]);

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingOrb />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

function AdminTopBar({ children , setMobileOpen, mobileOpen}) {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  
  const handleLogout = async () => {
    const result = await swalConfirm(
      "ออกจากระบบ?",
      "คุณต้องการออกจากระบบใช่หรือไม่"
    );

    if (!result.isConfirmed) return;
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Logout failed");
      }

      localStorage.removeItem("employee_user");
      setUser(null);

      swalSuccess("Logout สำเร็จ");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("LOGOUT_ERROR:", error);
      swalError(error?.message || "Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  const userMenuItems = [
    {
      key: "profile",
      disabled: true,
      label: (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-slate-900">
            {user?.full_name || user?.username || "-"}
          </span>
          <span className="text-xs text-slate-500">
            {user?.role_name || user?.role_code || "User"}
          </span>
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "change-password",
      icon: <KeyOutlined />,
      label: "เปลี่ยนรหัสผ่าน",
      onClick: () => router.push("/admin/change-password"),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header
        className="
          sticky top-0 z-50
          flex items-center justify-between
          bg-slate-900 px-4
        "
      >
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="flex min-w-0 items-center gap-2 text-left sm:gap-3"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-bold leading-tight text-white sm:text-base">
              HR Portal
            </div>
            <div className="hidden truncate text-xs leading-tight text-slate-400 sm:block">
              Central HR Platform
            </div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">

          <Tooltip title="กลับหน้า Portal">
            <Button
              type="text"
              icon={<HomeOutlined />}
              onClick={() => router.push("/admin")}
              className="!h-9 !w-9 !text-slate-300 hover:!bg-white/10 hover:!text-white"
            />
          </Tooltip>

          <Tag className="m-0 hidden max-w-[120px] truncate rounded-full border-0 bg-white px-3 py-1 text-xs font-medium text-slate-800 md:inline-flex">
            {user?.role_name || user?.role_code || "User"}
          </Tag>

          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={["hover", "click"]}
            placement="bottomRight"
          >
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
            >
              <Avatar
                src={user?.employee_photo_url || undefined}
                icon={!user?.employee_photo_url ? <UserOutlined /> : null}
                className="!bg-slate-950"
              />
            </button>
          </Dropdown>

          <Tooltip title="Logout" placement="bottom">
            <Button
              type="text"
              danger
              icon={loggingOut ? <LoadingOutlined spin /> : <LogoutOutlined />}
              onClick={handleLogout}
              disabled={loggingOut}
              className="!h-9 !text-red-400 hover:!bg-red-500/10 hover:!text-red-500"
            >
              <span className="hidden lg:inline">
                {loggingOut ? "Signing out..." : "Logout"}
              </span>
            </Button>
          </Tooltip>
        </div>
      </Header>

      <Layout>
        <SidebarContent
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <div>
            <div className="font-bold text-slate-800">Recruit Management</div>
            <div className="text-xs text-slate-400">Recruitment System</div>
          </div>

          <Button
            type="text"
            shape="circle"
            icon={<MenuOutlined />}
            onClick={() => setMobileOpen(true)}
          />
        </div>
        <Layout>
          <Content
            className="bg-slate-50 p-4 md:p-6 transition-all duration-300"
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

export default function RecruitmentLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <AuthProvider>
      <RecruitmentAuthGuard>
        <AdminTopBar 
          setMobileOpen={setMobileOpen}
          mobileOpen={mobileOpen}>
            <div className="rounded-3xl bg-slate-100">
              {children}
            </div>
        </AdminTopBar>
      </RecruitmentAuthGuard>
    </AuthProvider>
  );
}