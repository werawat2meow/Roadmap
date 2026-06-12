"use client";

import { useMemo, useState, useEffect } from "react";
import { Layout, Menu, Drawer, Grid , Button } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined , CloseOutlined } from "@ant-design/icons";
import { LayoutDashboard, Users } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";


const { Sider } = Layout;
const { useBreakpoint } = Grid;

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

  const menuItems = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/recruitment",
        icon: LayoutDashboard,
      },
      {
        label: "Report",
        icon: Users,
        defaultOpen: false,
        children: [
          {
            label: "Summary recruitment",
            href: "/recruitment/report_summary_recruit",
          },
        ]
      },
      {
        label: "Settings",
        icon: Users,
        defaultOpen: false,
        children: [
          {
            label: "Language",
            href: "/recruitment/setting/language",
          },
          {
            label: "Job Language",
            href: "/recruitment/setting/job_language",
          },
          {
            label: "Job Description",
            href: "/recruitment/setting/job_description",
          },
          {
            label: "Job Openings",
            href: "/recruitment/setting/job_openings",
          },
          {
            label: "Evaluation Form",
            href: "/recruitment/setting/evaluation_form",
          },
          {
            label:"Check Candidate Detail",
            href:"/recruitment/setting/candidate_detail"
          },
          {
            label:"Update interview appointment",
            href:"/recruitment/setting/update_interview_appointment"
          },
          {
            label:"Schedule interviews",
            href:"/recruitment/setting/schedule_interviews"
          },
          // {
          //   label:"Confirm start work",
          //   href:"/recruitment/setting/confirm_start_work"
          // }
          
        ],
      },
    ],
    []
  );

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

  const activeOpenKeys = useMemo(
    () =>
      menuItems
        .filter((item) =>
          item.children?.some((child) => pathname.startsWith(child.href))
        )
        .map((item) => item.label),
    [pathname, menuItems]
  );

  const [openKeys, setOpenKeys] = useState(activeOpenKeys);

  // sync เมื่อ pathname เปลี่ยน
  useEffect(() => {
    setOpenKeys(activeOpenKeys);
  }, [pathname]);

  const onMenuClick = ({ key }) => {
    if (key.startsWith("/")) {
      router.push(key);
      if (isMobile) setMobileOpen(false);
    }
  };

  const sidebarBody = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        {!collapsed ? (
          <div>
            <div className="text-lg font-bold text-slate-800">
              Recruit Management
            </div>
            <div className="text-xs text-slate-500">Recruitment System</div>
          </div>
        ) : (
          <div className="text-lg font-bold text-slate-800">RM</div>
        )}

        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        )}

        {isMobile && (
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={buildMenuItems(menuItems)}
          onClick={onMenuClick}
          className="border-r-0"
        />
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
        styles={{
          body: {
            padding: 0,
          },
        }}
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
      className="!bg-white border-r border-slate-200"
    >
      {sidebarBody}
    </Sider>
  );
}