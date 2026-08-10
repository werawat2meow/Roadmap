"use client";

import {
  Avatar,
  Dropdown,
} from "antd";

import {
  DownOutlined,
  KeyOutlined,
  LoadingOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  portalMenus,
} from "./portalMenus";

import {
  PORTAL_SIDEBAR,
} from "./portalLayoutConfig";

/* =========================================================
   Helpers
========================================================= */

function normalizeHref(
  href = ""
) {
  if (
    /^https?:\/\//i.test(
      href
    )
  ) {
    return "";
  }

  return String(href)
    .split("?")[0]
    .trim();
}

/* =========================================================
   Find Active Menu Recursive

   รองรับ:
   System
   └── Group
       └── Menu
           └── Sub Menu
========================================================= */

function findActiveInChildren(
  items = [],
  pathname,
  parents = []
) {
  for (
    const item of items
  ) {
    const target =
      normalizeHref(
        item?.activeHref ||
          item?.href
      );

    if (
      target &&
      (
        pathname ===
          target ||
        pathname.startsWith(
          `${target}/`
        )
      )
    ) {
      return {
        item,
        parents,
      };
    }

    if (
      Array.isArray(
        item?.children
      ) &&
      item.children.length >
        0
    ) {
      const found =
        findActiveInChildren(
          item.children,
          pathname,
          [
            ...parents,
            item,
          ]
        );

      if (found) {
        return found;
      }
    }
  }

  return null;
}

function findActiveMenu(
  pathname
) {
  return findActiveInChildren(
    portalMenus,
    pathname,
    []
  );
}

/* =========================================================
   Component
========================================================= */

export default function PortalTopbar({
  user,

  collapsed = false,

  loggingOut = false,

  onLogout,
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  /* =======================================================
     Active Menu
  ======================================================= */

  const activeMenu =
    findActiveMenu(
      pathname
    );

  const pageTitle =
    activeMenu?.item?.label ||
    "Admin Portal";

  /*
   * Parent ตัวแรกสุด = ระบบหลัก
   *
   * ตัวอย่าง:
   *
   * Employee Master
   * └── Setting
   *     └── ตั้งค่ารหัสพนักงาน
   *
   * systemTitle = Employee Master
   * pageTitle   = ตั้งค่ารหัสพนักงาน
   */

  const systemTitle =
    activeMenu
      ?.parents?.[0]
      ?.label ||
    activeMenu?.item
      ?.system_name ||
    "HR System";

  /* =======================================================
     User Dropdown
  ======================================================= */

  const userMenuItems = [
    {
      key: "profile",

      disabled: true,

      label: (
        <div className="min-w-[220px] px-1 py-1">
          <div className="truncate text-sm font-semibold text-slate-800">
            {user?.full_name ||
              user?.username ||
              "-"}
          </div>

          <div className="mt-1 truncate text-xs text-slate-400">
            {user?.role_name ||
              user?.role_code ||
              "User"}
          </div>
        </div>
      ),
    },

    {
      type: "divider",
    },

    {
      key:
        "change-password",

      icon:
        <KeyOutlined />,

      label:
        "เปลี่ยนรหัสผ่าน",

      onClick: () =>
        router.push(
          "/admin/change-password"
        ),
    },

    {
      type: "divider",
    },

    {
      key: "logout",

      danger: true,

      disabled:
        loggingOut,

      icon: loggingOut ? (
        <LoadingOutlined
          spin
        />
      ) : (
        <LogoutOutlined />
      ),

      label: loggingOut
        ? "กำลังออกจากระบบ..."
        : "ออกจากระบบ",

      onClick: () => {
        if (
          loggingOut
        ) {
          return;
        }

        onLogout?.();
      },
    },
  ];

  /* =======================================================
     CSS Variables

     ใช้ config เดียวกับ
     PortalSidebar.jsx
     AdminLayout.jsx
  ======================================================= */

  const topbarStyle = {
    "--portal-sidebar-collapsed":
      `${PORTAL_SIDEBAR.collapsed}px`,

    "--portal-sidebar-lg":
      `${PORTAL_SIDEBAR.lg}px`,

    "--portal-sidebar-xl":
      `${PORTAL_SIDEBAR.xl}px`,

    "--portal-sidebar-xxl":
      `${PORTAL_SIDEBAR.xxl}px`,
  };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <header
      style={
        topbarStyle
      }
      className={`
        fixed
        right-0
        top-0
        z-30

        hidden
        h-[76px]

        items-center
        justify-between

        border-b
        border-slate-200

        bg-white

        px-4
        shadow-sm

        transition-[left]
        duration-300
        ease-in-out

        sm:px-6

        lg:flex
        lg:px-8

        ${
          collapsed
            ? `
              lg:left-[var(--portal-sidebar-collapsed)]
            `
            : `
              lg:left-[var(--portal-sidebar-lg)]

              xl:left-[var(--portal-sidebar-xl)]

              2xl:left-[var(--portal-sidebar-xxl)]
            `
        }
      `}
    >
      {/* =================================================
          Left
      ================================================= */}

      <div className="min-w-0 flex-1 pr-4">
        <div
          className="
            truncate
            text-xs
            font-semibold
            text-slate-400
          "
        >
          {systemTitle}
        </div>

        <div
          className="
            mt-1
            truncate
            text-xl
            font-bold
            text-slate-800
          "
        >
          {pageTitle}
        </div>
      </div>

      {/* =================================================
          Right
      ================================================= */}

      <div className="flex shrink-0 items-center">
        <Dropdown
          menu={{
            items:
              userMenuItems,
          }}
          trigger={[
            "click",
          ]}
          placement="bottomRight"
        >
          <button
            type="button"
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border-l
              border-slate-200
              px-3
              py-2
              text-left
              transition
              hover:bg-slate-50
              sm:px-4
            "
          >
            <Avatar
              size={42}
              src={
                user
                  ?.employee_photo_url ||
                undefined
              }
              icon={
                !user
                  ?.employee_photo_url
                  ? (
                    <UserOutlined />
                  )
                  : null
              }
              className="
                !bg-gradient-to-br
                !from-blue-500
                !to-indigo-600
              "
            />

            <div className="hidden min-w-0 sm:block">
              <div
                className="
                  max-w-[180px]
                  truncate
                  text-sm
                  font-semibold
                  text-slate-800
                "
              >
                {user?.full_name ||
                  user?.username ||
                  "-"}
              </div>

              <div
                className="
                  mt-0.5
                  max-w-[180px]
                  truncate
                  text-xs
                  text-slate-400
                "
              >
                {user?.role_name ||
                  user?.role_code ||
                  "User"}
              </div>
            </div>

            <DownOutlined
              className="
                hidden
                text-xs
                text-slate-400
                sm:block
              "
            />
          </button>
        </Dropdown>
      </div>
    </header>
  );
}