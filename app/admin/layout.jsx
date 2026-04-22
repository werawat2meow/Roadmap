"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { sidebarMenus } from "./components/sidebarMenus";
import { swalSuccess, swalError, swalConfirm } from "../components/Swal";
import { Button, Tooltip, Tag } from "antd";
import { LogoutOutlined, LoadingOutlined } from "@ant-design/icons";
import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menus = useMemo(() => sidebarMenus, []);
  const [openGroup, setOpenGroup] = useState(menus[0]?.title ?? null);

  const {user,setUser,} = useAuth();

  const handleGroupClick = (title) => {
    setOpenGroup((prev) => (prev === title ? null : title));
  };

  const handleLogout = async () => {
    const result = await swalConfirm(
      "ออกจากระบบ?",
      "คุณต้องการออกจากระบบ Admin ใช่หรือไม่"
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

  const isActiveMenu = (href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    const activeGroup = menus.find((group) =>
      group.items.some((item) => isActiveMenu(item.href))
    );

    if (activeGroup) {
      setOpenGroup(activeGroup.title);
    }

    setMobileMenuOpen(false);
  }, [pathname, menus]);

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-[#0a1628] text-white flex flex-col z-40
          transform transition-transform duration-300
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0f6e56] flex items-center justify-center text-white text-xs font-bold">
              HW
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                Employee Master
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Hanuman World · Admin
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {menus.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (!item.permission) return true;
              return hasPermission(user, item.permission);
            });

            if (visibleItems.length === 0) return null;

            const isOpen = openGroup === group.title;

            return (
              <div key={group.title} className="mb-1">
                <button
                  type="button"
                  onClick={() => handleGroupClick(group.title)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="text-[14px] font-semibold tracking-widest text-slate-500 uppercase">
                    {group.title}
                  </span>

                  <span
                    className={`text-slate-500 transition-transform duration-300 inline-block ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3.5L5 6.5L8 3.5" />
                    </svg>
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="space-y-0.5 pt-0.5">
                    {visibleItems.map((item) => {
                      const active = isActiveMenu(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                            active
                              ? "bg-[#0f6e56] text-white font-medium"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="text-base">{item.icon}</span>
                          <span>{item.label}</span>
                          {active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout ใน sidebar */}
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
              loggingOut
                ? "text-slate-500 cursor-not-allowed"
                : "text-slate-400 hover:bg-red-500/10 hover:text-red-400"
            }`}
          >
            {loggingOut ? <LoadingOutlined spin /> : <LogoutOutlined />}
            <span>{loggingOut ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Overlay สำหรับ mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex lg:hidden items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-800 truncate">
                Admin Panel
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Manage employee master data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Tag className="rounded-full px-3 text-xs font-medium border-0 bg-emerald-50 text-emerald-700 m-0 max-w-[180px] sm:max-w-none truncate">
              {user?.full_name || user?.employee_name || user?.username || "-"}
            </Tag>

            <div className="w-px h-5 bg-slate-200 hidden sm:block" />

            <Tooltip title="Logout" placement="bottom">
              <Button
                type="text"
                danger
                icon={loggingOut ? <LoadingOutlined spin /> : <LogoutOutlined />}
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-1.5 text-slate-400 hover:text-red-500 text-xs"
              >
                <span className="hidden sm:inline">
                  {loggingOut ? "Signing out..." : "Logout"}
                </span>
              </Button>
            </Tooltip>
          </div>
        </header>

        <main className="flex-1 p-0 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}