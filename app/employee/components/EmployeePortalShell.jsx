"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Avatar,
  Button,
  Dropdown,
  Modal,
} from "antd";

import {
  AppstoreOutlined,
  BellOutlined,
  CalendarOutlined,
  HomeOutlined,
  LogoutOutlined,
  ReadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";

import {
  hasEmployeePortalPermission,
} from "../lib/employeePortalAccess";

/* =========================================================
   Navigation
========================================================= */

const NAV_ITEMS = [
  {
    key: "home",

    label: "หน้าหลัก",

    href: "/employee",

    permission:
      "ep.portal.view",

    icon:
      <HomeOutlined />,
  },

  {
    key: "news",

    label: "ข่าวสาร",

    href:
      "/employee/news",

    permission:
      "ep.news.view",

    icon:
      <ReadOutlined />,
  },

  {
    key: "leave",

    label:
      "ขออนุมัติการลา",

    href:
      "/employee/leave",

    permission:
      "ep.leave_requests.view",

    icon:
      <CalendarOutlined />,
  },

  {
    key: "requests",

    label:
      "ติดตามคำขอ",

    href:
      "/employee/requests",

    permission:
      "ep.request_tracking.view",

    icon:
      <SearchOutlined />,
  },
];

/* =========================================================
   Active Path
========================================================= */

function isActivePath(
  pathname,
  href
) {
  if (
    href === "/employee"
  ) {
    return (
      pathname === href
    );
  }

  return (
    pathname === href ||
    pathname?.startsWith(
      `${href}/`
    )
  );
}

/* =========================================================
   Super Admin
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

/* =========================================================
   Admin Portal Permission

   ใช้ Permission เป็นหลัก
   ไม่ตัดสินจากชื่อ Role

   Employee:
   ep.*
   mss.*

   HR / Admin:
   ems.*
   policy.*
   system.*
   data.*
   analytics.*
   access.*
========================================================= */

function canAccessAdminPortal(
  user
) {
  /*
   * SUPER_ADMIN
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

  return permissions.some(
    (permission) => {
      const code =
        String(
          permission || ""
        )
          .trim()
          .toLowerCase();

      return (
        code.startsWith(
          "ems."
        ) ||
        code.startsWith(
          "policy."
        ) ||
        code.startsWith(
          "system."
        ) ||
        code.startsWith(
          "data."
        ) ||
        code.startsWith(
          "analytics."
        ) ||
        code.startsWith(
          "access."
        )
      );
    }
  );
}

/* =========================================================
   Component
========================================================= */

export default function EmployeePortalShell({
  children,
}) {
  const router =
    useRouter();

  const pathname =
    usePathname();

  const {
    user,
    setUser,
  } =
    useAuth();

  const [
    logoutLoading,
    setLogoutLoading,
  ] =
    useState(false);

  /* =======================================================
     Visible Navigation
  ======================================================= */

  const visibleNav =
    useMemo(
      () =>
        NAV_ITEMS.filter(
          (item) =>
            hasEmployeePortalPermission(
              user,
              item.permission
            )
        ),
      [
        user,
      ]
    );

  /* =======================================================
     User
  ======================================================= */

  const displayName =
    user?.full_name ||
    user?.username ||
    "พนักงาน";

  const employeeCode =
    user?.employee_code ||
    "Employee";

  const roleName =
    user?.role_name ||
    user?.role_code ||
    user?.role ||
    "Employee";

  /* =======================================================
     Admin Portal Access
  ======================================================= */

  const canOpenAdminPortal =
    useMemo(
      () =>
        canAccessAdminPortal(
          user
        ),
      [
        user,
      ]
    );

  /* =======================================================
     Logout
  ======================================================= */

  async function handleLogout() {
    if (
      logoutLoading
    ) {
      return;
    }

    try {
      setLogoutLoading(
        true
      );

      const response =
        await fetch(
          "/api/auth/logout",
          {
            method:
              "POST",

            cache:
              "no-store",
          }
        );

      if (
        !response.ok
      ) {
        let message =
          "ไม่สามารถออกจากระบบได้";

        try {
          const json =
            await response.json();

          message =
            json?.error ||
            json?.message ||
            message;
        } catch {
          // response ไม่มี JSON
        }

        throw new Error(
          message
        );
      }

      /* ===============================================
         Clear Auth Context
      =============================================== */

      if (
        typeof setUser ===
        "function"
      ) {
        setUser(
          null
        );
      }

      /* ===============================================
         Redirect Login
      =============================================== */

      router.replace(
        "/login"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "EMPLOYEE_PORTAL_LOGOUT_ERROR:",
        error
      );

      Modal.error({
        title:
          "ออกจากระบบไม่สำเร็จ",

        content:
          error?.message ||
          "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setLogoutLoading(
        false
      );
    }
  }

  /* =======================================================
     Profile Menu
  ======================================================= */

  const profileMenuItems = [
    /* =====================================================
       Profile
    ===================================================== */

    {
      key: "profile",

      disabled: true,

      label: (
        <div className="min-w-[220px] px-1 py-1">
          <div className="truncate text-sm font-semibold text-slate-800">
            {displayName}
          </div>

          <div className="mt-1 truncate text-xs text-slate-400">
            {roleName}
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
      type:
        "divider",
    },

    /* =====================================================
       HR Admin Portal

       แสดงเฉพาะ User ที่มี Admin Permission

       เช่น:
       HR_OFFICER
       HR_SUPERVISOR
       HR_MANAGER
       HR_EXECUTIVE
       EMS_ADMIN
       SUPER_ADMIN

       EMPLOYEE ปกติจะไม่เห็น
    ===================================================== */

    ...(canOpenAdminPortal
      ? [
          {
            key:
              "admin-portal",

            icon:
              <AppstoreOutlined />,

            label:
              "HR Admin Portal",
          },

          {
            type:
              "divider",
          },
        ]
      : []),

    /* =====================================================
       Logout
    ===================================================== */

    {
      key:
        "logout",

      icon:
        <LogoutOutlined />,

      label:
        logoutLoading
          ? "กำลังออกจากระบบ..."
          : "ออกจากระบบ",

      danger: true,

      disabled:
        logoutLoading,
    },
  ];

  /* =======================================================
     Profile Menu Click
  ======================================================= */

  function handleProfileMenuClick({
    key,
  }) {
    /* =====================================================
       Admin Portal
    ===================================================== */

    if (
      key ===
      "admin-portal"
    ) {
      if (
        !canOpenAdminPortal
      ) {
        return;
      }

      router.push(
        "/admin"
      );

      return;
    }

    /* =====================================================
       Logout
    ===================================================== */

    if (
      key === "logout"
    ) {
      handleLogout();
    }
  }

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ===============================================
          Desktop / Tablet Header
      =============================================== */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* =============================================
              Brand
          ============================================= */}

          <button
            type="button"
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() =>
              router.push(
                "/employee"
              )
            }
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
              EP
            </div>

            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-900">
                Employee Portal
              </div>

              <div className="truncate text-xs text-slate-400">
                HR System
              </div>
            </div>
          </button>

          {/* =============================================
              Desktop Navigation
          ============================================= */}

          <nav className="hidden items-center gap-1 md:flex">
            {visibleNav.map(
              (item) => {
                const active =
                  isActivePath(
                    pathname,
                    item.href
                  );

                return (
                  <Button
                    key={
                      item.key
                    }
                    type={
                      active
                        ? "primary"
                        : "text"
                    }
                    icon={
                      item.icon
                    }
                    onClick={() =>
                      router.push(
                        item.href
                      )
                    }
                  >
                    {item.label}
                  </Button>
                );
              }
            )}
          </nav>

          {/* =============================================
              User Area
          ============================================= */}

          <div className="flex items-center gap-2">
            {/* ===========================================
                Notification
            =========================================== */}

            <Button
              type="text"
              shape="circle"
              icon={
                <BellOutlined />
              }
              aria-label="การแจ้งเตือน"
            />

            {/* ===========================================
                Profile Dropdown
            =========================================== */}

            <Dropdown
              trigger={[
                "click",
              ]}
              placement="bottomRight"
              menu={{
                items:
                  profileMenuItems,

                onClick:
                  handleProfileMenuClick,
              }}
            >
              <button
                type="button"
                className="
                  flex
                  items-center
                  gap-2
                  rounded-xl
                  px-2
                  py-1.5
                  text-left
                  transition

                  hover:bg-slate-100
                "
                aria-label="เมนูผู้ใช้งาน"
              >
                <Avatar
                  size={38}
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

                <div className="hidden max-w-[180px] sm:block">
                  <div className="truncate text-sm font-semibold text-slate-800">
                    {displayName}
                  </div>

                  <div className="truncate text-xs text-slate-400">
                    {employeeCode}
                  </div>
                </div>
              </button>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* ===============================================
          Content
      =============================================== */}

      <main className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-5 sm:px-6 md:pb-8 md:pt-7">
        {children}
      </main>

      {/* ===============================================
          Mobile Bottom Navigation
      =============================================== */}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {visibleNav
            .slice(
              0,
              4
            )
            .map(
              (item) => {
                const active =
                  isActivePath(
                    pathname,
                    item.href
                  );

                return (
                  <button
                    key={
                      item.key
                    }
                    type="button"
                    className={[
                      "flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] transition",

                      active
                        ? "bg-blue-50 font-semibold text-blue-600"
                        : "text-slate-500",
                    ].join(
                      " "
                    )}
                    onClick={() =>
                      router.push(
                        item.href
                      )
                    }
                  >
                    <span className="text-lg">
                      {item.icon}
                    </span>

                    <span className="max-w-full truncate">
                      {item.label}
                    </span>
                  </button>
                );
              }
            )}
        </div>
      </nav>
    </div>
  );
}
