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

import PortalSidebar from "./components/portal/PortalSidebar";
import PortalTopbar from "./components/portal/PortalTopbar";
import PortalMobileHeader from "./components/portal/PortalMobileHeader";

import {
  PORTAL_SIDEBAR,
} from "./components/portal/portalLayoutConfig";

/* =========================================================
   Component
========================================================= */

export default function AdminLayout({
  children,
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
        "/login"
      );
    }
  }, [
    loadingUser,
    router,
    user,
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
          "ออกจากระบบ?",
          "คุณต้องการออกจากระบบใช่หรือไม่"
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
            "/api/auth/logout",
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
              "ไม่สามารถออกจากระบบได้"
          );
        }

        localStorage.removeItem(
          "employee_user"
        );

        setUser?.(null);

        await swalSuccess(
          "ออกจากระบบสำเร็จ"
        );

        router.replace(
          "/login"
        );

        router.refresh();
      } catch (error) {
        console.error(
          "ADMIN_LOGOUT_ERROR:",
          error
        );

        await swalError(
          "ออกจากระบบไม่สำเร็จ",
          error?.message ||
            "ไม่สามารถออกจากระบบได้"
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

     ใช้ CSS Variables เพื่อให้ Sidebar / Topbar / Content
     อ้างอิงขนาดชุดเดียวกันจาก portalLayoutConfig.js
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
      {/* ===================================================
          Sidebar
      =================================================== */}

      <PortalSidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      />

      {/* ===================================================
          Desktop Topbar
      =================================================== */}

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

      {/* ===================================================
          Mobile Header
      =================================================== */}

      <PortalMobileHeader
        onOpen={() =>
          setMobileOpen(
            true
          )
        }
      />

      {/* ===================================================
          Main Content
      =================================================== */}

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
        {children}
      </main>
    </div>
  );
}