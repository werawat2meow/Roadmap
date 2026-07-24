"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Drawer, Tooltip } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";

import { hasPermission } from "@/lib/permissions";
import { sidebarMenus } from "./sidebarMenus";

export default function EmployeeMasterSidebar({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [openGroup, setOpenGroup] = useState("");
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const handleSidebarScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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

    setOpenGroup(isCurrentlyOpen ? "" : group.title);

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

  const renderSidebarContent = ({ responsive = false } = {}) => (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0F2942] via-[#123A63] to-[#0A223B] text-white shadow-xl">
      {/* Header Brand */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5 backdrop-blur-md">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-md shadow-blue-500/20 font-bold text-white">
              HR
            </div>
            <div>
              <div className="text-base font-bold tracking-wide text-white">HR System</div>
              <div className="text-[11px] font-medium text-blue-200/70">Employee Master</div>
            </div>
          </motion.div>
        )}

        <Button
          type="text"
          shape="circle"
          className="!text-white/80 hover:!bg-white/10 hover:!text-white transition-all"
          icon={
            responsive ? (
              <MenuFoldOutlined />
            ) : collapsed ? (
              <MenuUnfoldOutlined />
            ) : (
              <MenuFoldOutlined />
            )
          }
          onClick={() => {
            if (responsive) {
              setMobileOpen(false);
              return;
            }
            setCollapsed((prev) => !prev);
          }}
        />
      </div>

      {/* Menu List */}
      <div
        onScroll={handleSidebarScroll}
        className={`flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-2 sidebar-scroll ${
          isScrolling ? "is-scrolling" : ""
        }`}
      >
        {visibleMenus.map((group) => {
          const isOpen = openGroup === group.title;
          const groupActive = activeGroupTitle === group.title;

          return (
            <div key={group.title} className="space-y-1">
              {collapsed && !responsive ? (
                <Tooltip title={group.title} placement="right">
                  <button
                    type="button"
                    onClick={() => handleCollapsedGroupClick(group)}
                    className={`flex h-12 w-full items-center justify-center rounded-xl transition-all duration-300 relative group ${
                      groupActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/30"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-xl">{group.icon}</span>
                    {groupActive && (
                      <span className="absolute left-0 h-6 w-1 rounded-r-full bg-white" />
                    )}
                  </button>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-semibold tracking-wider transition-all duration-300 group ${
                    groupActive || isOpen
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`text-base transition-colors ${groupActive ? "text-blue-400" : "text-white/70 group-hover:text-white"}`}>
                      {group.icon}
                    </span>
                    <span className="uppercase tracking-wider">{group.title}</span>
                  </span>

                  <span
                    style={{
                      display: "inline-flex",
                      fontSize: 10,
                      transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                    className="text-white/50"
                  >
                    <DownOutlined />
                  </span>
                </button>
              )}

              {/* Submenus */}
              <AnimatePresence initial={false} mode="popLayout">
                {!collapsed && isOpen && (
                  <motion.div
                    key={group.title}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    exit={{ opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: "top" }}
                    className="overflow-hidden pl-2"
                  >
                    <motion.div
                      initial={{ y: -6 }}
                      animate={{ y: 0 }}
                      exit={{ y: -6 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-1 py-1 border-l border-white/10 ml-3 pl-2"
                    >
                      {group.items.map((item) => {
                        const active = isActiveMenu(item.href);

                        return (
                          <button
                            key={item.href}
                            type="button"
                            onClick={() => goTo(item.href)}
                            className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 group/item ${
                              active
                                ? "bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-md shadow-blue-900/20 font-semibold"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span className={`text-base transition-transform group-hover/item:scale-110 ${active ? "text-white" : "text-white/60"}`}>
                              {item.icon}
                            </span>
                            <span className="line-clamp-1">{item.label}</span>
                            
                            {active && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white shadow-sm"
                              />
                            )}
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

      {/* Footer / Portal Action */}
      <div className="border-t border-white/10 p-3 bg-black/10 backdrop-blur-sm">
        <button
          type="button"
          onClick={handlePortal}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white group"
        >
          <LogoutOutlined className="text-red-400 group-hover:scale-110 transition-transform" />
          {!collapsed && <span className="tracking-wide">Portal Dashboard</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen transition-all duration-300 lg:block z-40 ${
          collapsed ? "w-[84px]" : "w-[280px]"
        }`}
      >
        {renderSidebarContent()}
      </aside>

      <Drawer
        title={null}
        placement="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        closable={false}
        size="default"
        styles={{
          header: { display: "none" },
          body: {
            padding: 0,
            background: "#123A63",
          },
          wrapper: {
            boxShadow: "none",
            width: 280,
            maxWidth: "85vw",
          },
          mask: {
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
          },
        }}
      >
        {renderSidebarContent(true)}
      </Drawer>
    </>
  );
}