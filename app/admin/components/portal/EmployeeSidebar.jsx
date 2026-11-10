"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserPlus,
  X,
} from "lucide-react";

export default function EmployeeSidebar({
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
  onLogout,
  loggingOut,
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="ปิดเมนู"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 text-white transition-[width,transform] duration-300 lg:translate-x-0 ${collapsed ? "w-64 lg:w-20" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex h-20 items-center border-b border-gray-800 ${collapsed ? "justify-between px-6 lg:justify-center lg:px-2" : "justify-between px-6"}`}
        >
          <div className={collapsed ? "lg:hidden" : ""}>
            <div className="text-xl font-bold">Employees</div>
            <div className="text-xs text-gray-400">Management Employees</div>
          </div>
          {collapsed && (
            <span
              aria-hidden="true"
              className="hidden rounded-lg bg-gray-800 px-3 py-2 text-xl font-bold lg:block"
            >
              E
            </span>
          )}
          <button
            type="button"
            aria-label="ปิดเมนู"
            onClick={() => setMobileOpen(false)}
            className="cursor-pointer rounded-lg p-2 hover:bg-gray-800 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>
        <button
          type="button"
          aria-label={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
          title={collapsed ? "ขยายแถบเมนู" : "ย่อแถบเมนู"}
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 z-10 hidden cursor-pointer rounded-full border-2 border-gray-900 bg-gray-800 p-1.5 text-white hover:bg-gray-700 lg:block"
        >
          <ChevronLeft
            size={16}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
        <nav
          className="flex-1 space-y-1 px-3 py-5"
          aria-label="เมนูจัดการพนักงาน"
        >
          <Link
            href="/admin/employees"
            title="Overview"
            onClick={() => setMobileOpen(false)}
            className={`relative flex items-center gap-3 rounded-lg py-3 font-medium transition-colors ${collapsed ? "px-5 lg:justify-center lg:px-0" : "px-5"} ${pathname === "/admin/employees" ? "bg-gray-800 text-white before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-1 before:rounded-r before:bg-emerald-500" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
          >
            <LayoutDashboard size={20} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Overview</span>
          </Link>
          <Link
            href="/admin/employees/list"
            title="Add Employees"
            onClick={() => setMobileOpen(false)}
            className={`relative flex items-center gap-3 rounded-lg py-3 font-medium transition-colors ${collapsed ? "px-5 lg:justify-center lg:px-0" : "px-5"} ${pathname === "/admin/employees/list" ? "bg-gray-800 text-white before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-1 before:rounded-r before:bg-emerald-500" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
          >
            <UserPlus size={20} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Add Employees</span>
          </Link>
          <Link
            href="/admin/employees/settings"
            title="Settings"
            onClick={() => setMobileOpen(false)}
            className={`relative flex items-center gap-3 rounded-lg py-3 font-medium transition-colors ${collapsed ? "px-5 lg:justify-center lg:px-0" : "px-5"} ${pathname === "/admin/employees/settings" ? "bg-gray-800 text-white before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-1 before:rounded-r before:bg-emerald-500" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
          >
            <Settings size={20} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Settings</span>
          </Link>
          <Link
            href="/admin"
            title="Main Website"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg py-3 font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white ${collapsed ? "px-5 lg:justify-center lg:px-0" : "px-5"}`}
          >
            <ArrowLeft size={20} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Main Website</span>
          </Link>
        </nav>
        <div className="border-t border-gray-800 p-3">
          <button
            type="button"
            title="ออกจากระบบ"
            onClick={onLogout}
            disabled={loggingOut}
            className={`flex w-full cursor-pointer items-center gap-3 rounded-lg py-3 text-left text-gray-400 transition-colors hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${collapsed ? "px-5 lg:justify-center lg:px-0" : "px-5"}`}
          >
            <LogOut size={20} className="shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>
              {loggingOut ? "กำลังออกจากระบบ..." : "ออกจากระบบ"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}

export function EmployeeMobileMenuButton({ onClick }) {
  return (
    <button
      type="button"
      aria-label="เปิดเมนู"
      onClick={onClick}
      className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
    >
      <Menu size={22} />
    </button>
  );
}
