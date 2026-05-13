"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, Avatar, Tag, Button, Tooltip, Dropdown } from "antd";
import {UserOutlined,LogoutOutlined,LoadingOutlined,HomeOutlined,KeyOutlined,} from "@ant-design/icons";
import useAuth from "@/hooks/useAuth";
import { swalSuccess, swalError, swalConfirm } from "../components/Swal";

const { Header, Content } = Layout;

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

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
        <div className="min-w-[180px]">
          <div className="font-semibold text-slate-800">
            {user?.full_name || user?.username || "-"}
          </div>
          <div className="text-xs text-slate-400">
            {user?.role_name || user?.role_code || "User"}
          </div>
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
    <Layout className="min-h-screen bg-slate-100">
      <Header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-[#06192c] px-3 sm:px-4 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="flex min-w-0 items-center gap-2 text-left sm:gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
            HW
          </div>

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

      <Content>{children}</Content>
    </Layout>
  );
}