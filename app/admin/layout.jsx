"use client";

import {
  useEffect,
  useState,
} from "react";

import AdminActivityPageTracker from "./components/portal/AdminActivityPageTracker";
import {
  useRouter,
  usePathname,
} from "next/navigation";

import {
  useAuth,
} from "@/contexts/AuthContext";

import LoadingOrb from "@/app/components/LoadingOrb";

import { authLogoutConfirm, authSuccess, authError } from "@/components/AuthSwal";

import PortalSidebar from "./components/portal/PortalSidebar";
import PortalTopbar from "./components/portal/PortalTopbar";
import PortalMobileHeader from "./components/portal/PortalMobileHeader";
import PortalGuidedTour from "./components/portal/PortalGuidedTour";
import EmployeeSidebar, { EmployeeMobileMenuButton } from "./components/portal/EmployeeSidebar";

import {
  PORTAL_SIDEBAR,
} from "./components/portal/portalLayoutConfig";

/* =========================================================
   Component
========================================================= */

export default function AdminLayout({children,}) {
  const router = useRouter();
  const pathname = usePathname();

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
     Mobile Sidebar Responsive

     เมื่อขยายหน้าจอกลับเข้า Desktop (lg >= 1024px)
     ให้ปิด Mobile Sidebar / Overlay อัตโนมัติ
  ======================================================= */

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(min-width: 1024px)"
      );

    const handleChange = (
      event
    ) => {
      if (event.matches) {
        setMobileOpen(false);
      }
    };

    /*
     * เช็กทันทีตอน Layout mount
     * กัน state Mobile Drawer ค้างใน Desktop
     */
    if (mediaQuery.matches) {
      setMobileOpen(false);
    }

    mediaQuery.addEventListener(
      "change",
      handleChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleChange
      );
    };
  }, []);

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

  /* =========================================================
    Hide Scrollbar — All Admin Pages

    ซ่อน Scrollbar ทุกหน้าภายใน /admin
    แต่ยังเลื่อนขึ้น-ลงได้ตามปกติ
  ========================================================= */

  useEffect(() => {
    if (pathname !== "/admin" && !pathname?.startsWith("/admin/")) {
      return;
    }

    const style = document.createElement("style");

    style.setAttribute(
      "data-admin-hide-scrollbar",
      "true"
    );

    style.textContent = `
      html,
      body {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `;

    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, [pathname]);

  /* =======================================================
     Logout
  ======================================================= */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    const confirmed = await authLogoutConfirm();

    if (!confirmed) {
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

      await authSuccess(
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

      await authError(
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

  if (pathname === "/admin") {
    return (
      <div className="min-h-screen bg-[#f4f7fb]">
        <AdminActivityPageTracker />
        <header className="flex min-h-[72px] items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#132d4f] text-lg font-bold text-white">H</span>
            <div>
              <p className="font-bold leading-5 text-[#132d4f]">HRMS Enterprise</p>
              <p className="text-xs text-slate-500">เลือกระบบที่ต้องการใช้งาน</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} disabled={loggingOut}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            {loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
          </button>
        </header>
        {children}
      </div>
    );
  }

  if (pathname === "/admin/employees" || pathname?.startsWith("/admin/employees/")) {
    return (
      <div className="min-h-screen bg-[#f9f5f2]">
        <AdminActivityPageTracker />
        <EmployeeSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={handleLogout} loggingOut={loggingOut} />
        <div className={`min-w-0 transition-[margin-left] duration-300 ${collapsed ? "lg:ml-20" : "lg:ml-64"}`}>
          <div className="p-3 lg:hidden"><EmployeeMobileMenuButton onClick={() => setMobileOpen(true)} /></div>
          <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    );
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
        Guided Tour
      =================================================== */}  
      <PortalGuidedTour />
      
      {/* ===================================================
        Activity Log - Page View Tracking
      =================================================== */}
      <AdminActivityPageTracker />
      
      {/* ===================================================
          Sidebar
      =================================================== */}

      <PortalSidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={
          setCollapsed
        }
        mobileOpen={
          mobileOpen
        }
        setMobileOpen={
          setMobileOpen
        }
        loggingOut={
          loggingOut
        }
        onLogout={
          handleLogout
        }
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
