"use client";

import {
  Avatar,
  Dropdown,
} from "antd";

import {
  AppstoreOutlined,
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

import NotificationBell from "./NotificationBell";

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
   Permission Helper
========================================================= */

function isSuperAdmin(
  user
) {
  const roleCode =
    String(
      user?.role_code ||
        user?.role ||
        ""
    )
      .trim()
      .toUpperCase();

  return (
    roleCode ===
    "SUPER_ADMIN"
  );
}

function hasPermission(
  user,
  permissionCode
) {
  if (
    !permissionCode
  ) {
    return true;
  }

  /*
   * SUPER_ADMIN
   * ใช้ Bypass ได้
   */
  if (
    isSuperAdmin(
      user
    )
  ) {
    return true;
  }

  const permissions =
    Array.isArray(
      user?.permissions
    )
      ? user.permissions
      : [];

  return permissions.includes(
    permissionCode
  );
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
     Employee Portal Access
  ======================================================= */

  const canAccessEmployeePortal =
    hasPermission(
      user,
      "ep.portal.view"
    );

  /*
   * ถ้าต้องการเข้มขึ้นในอนาคต
   * สามารถตรวจ employee_id เพิ่มได้ เช่น:
   *
   * const canAccessEmployeePortal =
   *   Boolean(user?.employee_id) &&
   *   hasPermission(
   *     user,
   *     "ep.portal.view"
   *   );
   *
   * รอบนี้ยึด Permission เป็นหลักก่อน
   */

  /* =======================================================
     User Dropdown
  ======================================================= */

  const userMenuItems = [
    /* =====================================================
       Profile
    ===================================================== */

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

          {user?.employee_code ? (
            <div className="mt-1 truncate text-xs text-slate-400">
              รหัสพนักงาน{" "}
              {user.employee_code}
            </div>
          ) : null}
        </div>
      ),
    },

    {
      type: "divider",
    },

    /* =====================================================
       Employee Portal

       แสดงเฉพาะผู้ที่มี:
       ep.portal.view
    ===================================================== */

    ...(canAccessEmployeePortal
      ? [
          {
            key:
              "employee-portal",

            icon:
              <AppstoreOutlined />,

            label:
              "Employee Portal",

            onClick: () => {
              router.push(
                "/employee"
              );
            },
          },

          {
            type:
              "divider",
          },
        ]
      : []),

    /* =====================================================
       Change Password
    ===================================================== */

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

    /* =====================================================
       Logout
    ===================================================== */

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
        no-print
      `}
    >
      {/* =================================================
          Left
      ================================================= */}

      <div className="min-w-0 flex-1 pr-4 no-print">
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

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />

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
            {/* ===========================================
                Avatar
            =========================================== */}

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

            {/* ===========================================
                User
            =========================================== */}

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
