"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Drawer, Tooltip } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {MenuFoldOutlined,MenuUnfoldOutlined,LogoutOutlined,DownOutlined,MenuOutlined,} from "@ant-design/icons";

import useAuth from "@/hooks/useAuth";
import { hasPermission } from "@/lib/permissions";

import { sidebarMenus } from "./components/sidebarMenus";
import LoadingOrb from "../../components/LoadingOrb";

export default function EmployeeMasterLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loadingUser } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("");

  const visibleMenus = useMemo(() => {
    return sidebarMenus
      .map((group) => ({
        ...group,
        items: (group.items || []).filter((item) => {
          if (!item.permission) return true;
          return hasPermission(user, item.permission);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [user]);

  const isActiveMenu = (href) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const activeGroupTitle = useMemo(() => {
    const activeGroup = visibleMenus.find((group) =>
      group.items.some((item) => isActiveMenu(item.href))
    );
    return activeGroup?.title || "";
  }, [visibleMenus, pathname]);

  useEffect(() => {
    if (activeGroupTitle) {
      setOpenGroup(activeGroupTitle);
    }
  }, [activeGroupTitle]);

  const goTo = (href) => {
    router.push(href);
    setMobileOpen(false);
  };

  const toggleGroup = (group) => {
    const firstHref = group.items?.[0]?.href;
    const isCurrentlyOpen = openGroup === group.title;
    const nextOpen = isCurrentlyOpen ? "" : group.title;
    setOpenGroup(nextOpen);
    if (!isCurrentlyOpen && firstHref) {
      router.push(firstHref);
      setMobileOpen(false);
    }
  };

  const handleCollapsedGroupClick = (group) => {
    const firstHref = group.items?.[0]?.href;
    setCollapsed(false);
    setOpenGroup(group.title);
    if (firstHref) {
      router.push(firstHref);
      setMobileOpen(false);
    }
  };

  const handlePortal = () => {
    router.replace("/admin");
  };

  const SidebarContent = ({ responsive = false } = {}) => (
    <div className="flex h-full flex-col">
      {/* HEADER */}
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-4">
        {!collapsed && (
          <div>
            <div className="text-lg font-bold text-slate-800">
              Employee Master
            </div>
            <div className="text-xs text-slate-400">Admin Management</div>
          </div>
        )}

        <Button
          type="text"
          shape="circle"
          className="hidden lg:inline-flex"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed((prev) => !prev)}
        />
      </div>

      {/* MENUS */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {visibleMenus.map((group) => {
          const isOpen = openGroup === group.title;
          const groupActive = activeGroupTitle === group.title;

          return (
            <div key={group.title} className="mb-3">
              {/* COLLAPSED */}
              {collapsed && !responsive ? (
                <Tooltip title={group.title} placement="right">
                  <button
                    type="button"
                    onClick={() => handleCollapsedGroupClick(group)}
                    className={`mb-3 flex h-12 w-full items-center justify-center rounded-2xl transition-all duration-300 ${
                      groupActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                    }`}
                  >
                    <span className="text-xl">{group.icon}</span>
                  </button>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className={`mb-2 flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-bold tracking-wider transition-all duration-300 ${
                    groupActive || isOpen
                      ? "bg-blue-50 text-blue-600"
                      : "text-slate-400 hover:bg-slate-50 hover:text-blue-600"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{group.icon}</span>
                    <span>{group.title}</span>
                  </span>

                  {/* ✅ inline style — ไม่พึ่ง Tailwind dynamic class */}
                  <span
                    style={{
                      display: "inline-flex",
                      fontSize: 10,
                      transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      color: isOpen ? "#3b82f6" : "inherit",
                    }}
                  >
                    <DownOutlined />
                  </span>
                </button>
              )}

              {/* BODY */}
              <AnimatePresence initial={false} mode="popLayout">
                {!collapsed && isOpen && (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: "top" }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -8 }}
                      animate={{ y: 0 }}
                      exit={{ y: -8 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-1 pb-2"
                    >
                      {group.items.map((item) => {
                        const active = isActiveMenu(item.href);
                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => goTo(item.href)}
                            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-300 ${
                              active
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span className="line-clamp-1">{item.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={handlePortal}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogoutOutlined />
          {!collapsed && <span>Portal</span>}
        </button>
      </div>
    </div>
  );

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* MOBILE HEADER */}
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div>
          <div className="font-bold text-slate-800">Employee Master</div>
          <div className="text-xs text-slate-400">Admin Management</div>
        </div>

        <Button
          type="text"
          shape="circle"
          icon={<MenuOutlined />}
          onClick={() => setMobileOpen(true)}
        />
      </div>

      {/* SIDEBAR */}
      <aside
        className={`sticky top-0 hidden h-screen border-r border-slate-200 bg-white transition-all duration-300 lg:block ${
          collapsed ? "w-[86px]" : "w-[290px]"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* MOBILE DRAWER */}
      <Drawer
        title={null}
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        size="default"
        styles={{
          body: { padding: 0 },
          section: { width: "85vw", maxWidth: 290 },
          wrapper: { boxShadow: "none" },
        }}
      >
        <SidebarContent responsive />
      </Drawer>

      {/* CONTENT */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

/*
 * 
 *  Flow - Employee Master Layout  
 *     3 ส่วนน 
 *  
 */