"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Drawer, Tooltip } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import {MenuFoldOutlined,MenuUnfoldOutlined,LogoutOutlined,DownOutlined,} from "@ant-design/icons";

import { hasPermission } from "@/lib/permissions";
import { sidebarMenus } from "./sidebarMenus";

export default function EmployeeMasterSidebar({user,collapsed,setCollapsed,mobileOpen,setMobileOpen,}) {
  const router = useRouter();
  const pathname = usePathname();

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

  const SidebarContent = ({ responsive = false } = {}) => (
    <div className="flex h-full flex-col bg-[#123A63] text-white">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
        {!collapsed && (
          <div>
            <div className="text-lg font-bold text-white">HR System</div>
            <div className="text-xs text-white/60">Employee Master</div>
          </div>
        )}

        <Button
          type="text"
          shape="circle"
          className="!text-white hover:!bg-white/10 hover:!text-white"
            icon={
              responsive
                ? <MenuFoldOutlined />
                : collapsed
                  ? <MenuUnfoldOutlined />
                  : <MenuFoldOutlined />
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
                        ? "bg-white/20 text-white shadow-lg"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
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
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
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
                        "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
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
                                ? "bg-white/20 text-white shadow-lg"
                                : "text-white/75 hover:bg-white/10 hover:text-white"
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

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={handlePortal}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <LogoutOutlined />
          {!collapsed && <span>Portal</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={`sticky top-0 hidden h-screen bg-[#123A63] transition-all duration-300 lg:block ${
          collapsed ? "w-[86px]" : "w-[290px]"
        }`}
      >
        <SidebarContent />
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
          section: {
            background: "#123A63",
          },
          wrapper: {
            boxShadow: "none",
            width: 286,
            maxWidth: "85vw",
          },
          mask: {
            background: "rgba(0,0,0,0.45)",
          },
        }}
      >
        <SidebarContent responsive />
      </Drawer>
    </>
  );
}