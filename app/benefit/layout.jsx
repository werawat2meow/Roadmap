"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Drawer, Tooltip, Avatar, Tag } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {MenuFoldOutlined,MenuUnfoldOutlined,LogoutOutlined,DownOutlined,MenuOutlined,GiftOutlined,HomeOutlined,UserOutlined,} from "@ant-design/icons";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/lib/permissions";
import LoadingOrb from "../components/LoadingOrb";
import { getVisibleBenefitSidebarMenus } from "./components/benefitMenus";

function BenefitContent({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loadingUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("");
  const [navigating, setNavigating] = useState(false);
  
  const canAccessBenefit = hasPermission(user, "benefit.portal.view");

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

  const visibleMenus = useMemo(() => {
    return getVisibleBenefitSidebarMenus(user);
  }, [user]);

  const isActiveMenu = (href) => {
    if (href === "/benefit/requests") {
      return pathname === "/benefit/requests";
    }
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

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  const goTo = (href) => {
    if (pathname === href) return;
    setNavigating(true);
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
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-4">
        {!collapsed && (
          <button
            type="button"
            onClick={() => goTo("/benefit")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-lg shadow-emerald-100">
              <GiftOutlined />
            </div>

            <div>
              <div className="text-lg font-bold text-slate-800">
                Benefit System
              </div>
              <div className="text-xs text-slate-400">
                Staff Benefit Platform
              </div>
            </div>
          </button>
        )}

        {collapsed && !responsive && (
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-xl text-white shadow-lg shadow-emerald-100">
            <GiftOutlined />
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

 
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {visibleMenus.map((group) => {
          const isOpen = openGroup === group.title;
          const groupActive = activeGroupTitle === group.title;

          return (
            <div key={group.title} className="mb-3">
              {collapsed && !responsive ? (
                <Tooltip title={group.title} placement="right">
                  <button
                    type="button"
                    onClick={() => handleCollapsedGroupClick(group)}
                    className={`mb-3 flex h-12 w-full items-center justify-center rounded-2xl transition-all duration-300 ${
                      groupActive
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"
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
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-400 hover:bg-slate-50 hover:text-emerald-600"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{group.icon}</span>
                    <span>{group.title}</span>
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      fontSize: 10,
                      transition:
                        "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      color: isOpen ? "#047857" : "inherit",
                    }}
                  >
                    <DownOutlined />
                  </span>
                </button>
              )}

              <AnimatePresence initial={false} mode="popLayout">
                {!collapsed && isOpen && (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{
                      duration: 0.28,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{ transformOrigin: "top" }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      initial={{ y: -8 }}
                      animate={{ y: 0 }}
                      exit={{ y: -8 }}
                      transition={{
                        duration: 0.28,
                        ease: [0.22, 1, 0.36, 1],
                      }}
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
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                                : "text-slate-600 hover:bg-slate-100 hover:text-emerald-600"
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate">
                                {item.label}
                              </span>

                              {item.desc && (
                                <span
                                  className={`mt-0.5 block truncate text-[11px] ${
                                    active
                                      ? "text-emerald-50"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {item.desc}
                                </span>
                              )}
                            </span>
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

      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={handlePortal}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 hover:scale-[1.02] hover:shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <LogoutOutlined />
          {!collapsed && <span>Portal</span>}
        </button>
      </div>
    </div>
  );

  if (loadingUser || navigating) return <LoadingOrb />;
  if (!user) return null;
  if (!canAccessBenefit) return null;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => goTo("/benefit")}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-lg text-white">
            <GiftOutlined />
          </div>

          <div>
            <div className="font-bold text-slate-800">Benefit System</div>
            <div className="text-xs text-slate-400">Staff Benefit Platform</div>
          </div>
        </button>

        <Button
          type="text"
          shape="circle"
          icon={<MenuOutlined />}
          onClick={() => setMobileOpen(true)}
        />
      </div>

      <aside
        className={`sticky top-0 hidden h-screen border-r border-slate-200 bg-white transition-all duration-300 lg:block ${
          collapsed ? "w-[86px]" : "w-[310px]"
        }`}
      >
        <SidebarContent />
      </aside>

      <Drawer
        title={null}
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        size="default"
        styles={{
          body: { padding: 0 },
          section: { width: "85vw", maxWidth: 310 },
          wrapper: { boxShadow: "none" },
        }}
      >
        <SidebarContent responsive />
      </Drawer>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export default function BenefitLayout({ children }) {
  return (
    <AuthProvider>
      <BenefitContent>{children}</BenefitContent>
    </AuthProvider>
  );
}