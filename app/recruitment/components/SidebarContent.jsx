"use client";

import { useMemo, useState, useEffect } from "react";
import { Layout, Menu, Drawer, Grid, Button, ConfigProvider } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, CloseOutlined } from "@ant-design/icons";
import { LayoutDashboard, Users , Summary , Settings , LayoutList } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

const { Sider } = Layout;
const { useBreakpoint } = Grid;

// สีหลักของ Sidebar
const SIDEBAR_BG = "#123a63";
const SIDEBAR_BG_HOVER = "rgba(255, 255, 255, 0.08)";
const SIDEBAR_BG_SELECTED = "rgba(255, 255, 255, 0.16)";
const SIDEBAR_BORDER = "rgba(255, 255, 255, 0.15)";
const SIDEBAR_TEXT = "#ffffff";
const SIDEBAR_TEXT_MUTED = "rgba(255, 255, 255, 0.65)";

export default function SidebarContent({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  // ✅ Redirect /recruitment/setting → /recruitment
  useEffect(() => {
    if (pathname === "/recruitment/setting") {
      router.replace("/recruitment");
    }
  }, [pathname]);

  const menuItems = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/recruitment",
        icon: LayoutDashboard,
      },
      {
        label: "Check Candidate Detail",
        href: "/recruitment/candidate_detail",
        icon: LayoutList,
      },
      {
        label: "Schedule interviews",
        href: "/recruitment/schedule_interviews",
        icon: LayoutList,
      },
      {
        label: "Update interview appointment",
        href: "/recruitment/update_interview_appointment",
        icon: LayoutList,
      },
      {
        label: "Report",
        icon: Summary,
        defaultOpen: false,
        children: [
          {
            label: "Summary recruitment",
            href: "/recruitment/report_summary_recruit",
          },
        ],
      },
      {
        label: "Settings",
        icon: Settings,
        defaultOpen: false,
        children: [
          { label: "Language",                     href: "/recruitment/setting/language" },
          { label: "Job Language",                 href: "/recruitment/setting/job_language" },
          { label: "Job Description",              href: "/recruitment/setting/job_description" },
          { label: "Job Openings",                 href: "/recruitment/setting/job_openings" },
          // { label: "Evaluation Form",              href: "/recruitment/setting/evaluation" },
        ],
      },
    ],
    []
  );

  // ✅ รวบทุก candidate แล้วเลือก href ที่ยาวที่สุด (specific ที่สุด)
  const activeKey = useMemo(() => {
    const candidates = [];

    for (const item of menuItems) {
      if (item.children) {
        for (const child of item.children) {
          // match ถ้า pathname ตรงกับ child.href หรือเป็น sub-path ของมัน
          if (
            pathname === child.href ||
            pathname.startsWith(child.href + "/")
          ) {
            candidates.push({ key: child.href, len: child.href.length });
          }
        }
      } else if (item.href) {
        // top-level ที่ไม่มี children ใช้ exact match หรือ sub-path
        if (
          pathname === item.href ||
          pathname.startsWith(item.href + "/")
        ) {
          candidates.push({ key: item.href, len: item.href.length });
        }
      }
    }

    if (candidates.length === 0) return pathname;

    // เลือก match ที่ยาวที่สุด → specific ที่สุด
    return candidates.sort((a, b) => b.len - a.len)[0].key;
  }, [pathname, menuItems]);

  // ✅ เปิด parent submenu อัตโนมัติตาม activeKey
  const activeOpenKeys = useMemo(
    () =>
      menuItems
        .filter((item) =>
          item.children?.some(
            (child) =>
              pathname === child.href ||
              pathname.startsWith(child.href + "/")
          )
        )
        .map((item) => item.label),
    [pathname, menuItems]
  );

  const [openKeys, setOpenKeys] = useState(activeOpenKeys);

  useEffect(() => {
    setOpenKeys(activeOpenKeys);
  }, [pathname]);

  const buildMenuItems = (menus) =>
    menus.map((item) => {
      const Icon = item.icon;
      return {
        key: item.href || item.label,
        icon: Icon ? <Icon size={18} /> : null,
        label: item.label,
        children: item.children?.map((child) => ({
          key: child.href,
          label: child.label,
        })),
      };
    });

  const onMenuClick = ({ key }) => {
    if (key.startsWith("/")) {
      router.push(key);
      if (isMobile) setMobileOpen(false);
    }
  };

  const sidebarBody = (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: SIDEBAR_BG }}
    >
      <div
        className="flex items-center justify-between px-4 py-4"
        style={{ borderBottom: `1px solid ${SIDEBAR_BORDER}` }}
      >
        {!collapsed ? (
          <div>
            <div className="text-lg font-bold" style={{ color: SIDEBAR_TEXT }}>
              Recruit Management
            </div>
            <div className="text-xs" style={{ color: SIDEBAR_TEXT_MUTED }}>
              Recruitment System
            </div>
          </div>
        ) : (
          <div className="text-lg font-bold" style={{ color: SIDEBAR_TEXT }}>
            RM
          </div>
        )}

        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition"
            style={{ color: SIDEBAR_TEXT_MUTED }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = SIDEBAR_BG_HOVER;
              e.currentTarget.style.color = SIDEBAR_TEXT;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = SIDEBAR_TEXT_MUTED;
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        )}

        {isMobile && (
          <Button
            type="text"
            icon={<CloseOutlined style={{ color: SIDEBAR_TEXT }} />}
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                darkItemBg: "transparent",
                darkItemColor: SIDEBAR_TEXT_MUTED,
                darkItemSelectedBg: SIDEBAR_BG_SELECTED,
                darkItemSelectedColor: SIDEBAR_TEXT,
                darkItemHoverBg: SIDEBAR_BG_HOVER,
                darkItemHoverColor: SIDEBAR_TEXT,
                darkSubMenuItemBg: "transparent",
                darkPopupBg: SIDEBAR_BG,
              },
            },
          }}
        >
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[activeKey]}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            items={buildMenuItems(menuItems)}
            onClick={onMenuClick}
            style={{ backgroundColor: "transparent", borderRight: 0 }}
          />
        </ConfigProvider>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        placement="left"
        size="default"
        styles={{ body: { padding: 0, backgroundColor: SIDEBAR_BG } }}
        closable={false}
      >
        {sidebarBody}
      </Drawer>
    );
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      collapsedWidth={80}
      width={260}
      style={{ backgroundColor: SIDEBAR_BG, borderRight: `1px solid ${SIDEBAR_BORDER}` }}
    >
      {sidebarBody}
    </Sider>
  );
}
