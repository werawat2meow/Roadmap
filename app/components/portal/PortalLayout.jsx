"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";

import LoadingOrb from "@/app/components/LoadingOrb";

import {
  swalConfirm,
  swalError,
  swalSuccess,
} from "@/components/Swal";

import PortalSidebar from "@/app/admin/components/portal/PortalSidebar";
import PortalTopbar from "@/app/admin/components/portal/PortalTopbar";
import PortalMobileHeader from "@/app/admin/components/portal/PortalMobileHeader";

import {
  PORTAL_SIDEBAR,
} from "@/app/admin/components/portal/portalLayoutConfig";

import { App, ConfigProvider } from "antd";

/* =========================================================
   PortalLayout
   ---------------------------------------------------------
   Layout กลางสำหรับทุกโมดูลที่ต้องใช้ Sidebar/Topbar
   แบบเดียวกัน (admin, recruitment, ...)

   วิธีใช้:
   import PortalLayout from "@/app/components/portal/PortalLayout";

   export default function SomeLayout({ children }) {
     return <PortalLayout>{children}</PortalLayout>;
   }
========================================================= */

export default function PortalLayout({
  children,

  // ปรับแต่งได้ต่อโมดูล
  loginPath = "/login",
  logoutApiPath = "/api/auth/logout",
  userStorageKey = "employee_user",

  logoutConfirmTitle = "ออกจากระบบ?",
  logoutConfirmText = "คุณต้องการออกจากระบบใช่หรือไม่",
  logoutSuccessText = "ออกจากระบบสำเร็จ",
  logoutFailTitle = "ออกจากระบบไม่สำเร็จ",
  logoutFailFallbackText = "ไม่สามารถออกจากระบบได้",
}) {
  const router =
    useRouter();

  const {
    user,
    setUser,
    loadingUser,
  } = useAuth();

  const [
    collapsed,
    setCollapsed,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  /* =======================================================
     Auth Guard
  ======================================================= */

  useEffect(() => {
    if (loadingUser) {
      return;
    }

    if (!user) {
      router.replace(
        loginPath
      );
    }
  }, [
    loadingUser,
    router,
    user,
    loginPath,
  ]);

  /* =======================================================
     Logout
  ======================================================= */

  const handleLogout =
    async () => {
      if (loggingOut) {
        return;
      }

      const result =
        await swalConfirm(
          logoutConfirmTitle,
          logoutConfirmText
        );

      if (
        !result?.isConfirmed
      ) {
        return;
      }

      setLoggingOut(true);

      try {
        const response =
          await fetch(
            logoutApiPath,
            {
              method: "POST",
            }
          );

        const payload =
          await response
            .json()
            .catch(
              () => null
            );

        if (!response.ok) {
          throw new Error(
            payload?.error ||
              logoutFailFallbackText
          );
        }

        if (userStorageKey) {
          localStorage.removeItem(
            userStorageKey
          );
        }

        setUser?.(null);

        await swalSuccess(
          logoutSuccessText
        );

        router.replace(
          loginPath
        );

        router.refresh();
      } catch (error) {
        console.error(
          "PORTAL_LOGOUT_ERROR:",
          error
        );

        await swalError(
          logoutFailTitle,
          error?.message ||
            logoutFailFallbackText
        );
      } finally {
        setLoggingOut(
          false
        );
      }
    };

  /* =======================================================
     Loading
  ======================================================= */

  if (loadingUser) {
    return (
      <LoadingOrb />
    );
  }

  if (!user) {
    return null;
  }

  /* =======================================================
     Layout Variables
  ======================================================= */

  const layoutStyle = {
    "--portal-sidebar-collapsed":
      `${PORTAL_SIDEBAR.collapsed}px`,

    "--portal-sidebar-lg":
      `${PORTAL_SIDEBAR.lg}px`,

    "--portal-sidebar-xl":
      `${PORTAL_SIDEBAR.xl}px`,

    "--portal-sidebar-xxl":
      `${PORTAL_SIDEBAR.xxl}px`,

    "--portal-sidebar-mobile":
      `${PORTAL_SIDEBAR.mobile}px`,
  };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      style={layoutStyle}
      className="
        min-h-screen
        w-full
        bg-slate-50
      "
    >
      <PortalSidebar
        collapsed={
          collapsed
        }
        setCollapsed={
          setCollapsed
        }
        mobileOpen={
          mobileOpen
        }
        setMobileOpen={
          setMobileOpen
        }
      />

      <PortalTopbar
        user={user}
        collapsed={
          collapsed
        }
        loggingOut={
          loggingOut
        }
        onLogout={
          handleLogout
        }
      />

      <PortalMobileHeader
        onOpen={() =>
          setMobileOpen(
            true
          )
        }
      />

      <main
        className={`
          min-h-screen
          min-w-0

          pt-16

          transition-[margin-left]
          duration-300
          ease-in-out

          lg:pt-[76px]

          ${
            collapsed
              ? `
                lg:ml-[var(--portal-sidebar-collapsed)]
              `
              : `
                lg:ml-[var(--portal-sidebar-lg)]

                xl:ml-[var(--portal-sidebar-xl)]

                2xl:ml-[var(--portal-sidebar-xxl)]
              `
          }
        `}
      >
        <ConfigProvider>
          <App>
            {children}
          </App>
        </ConfigProvider>
      </main>
    </div>
  );
}