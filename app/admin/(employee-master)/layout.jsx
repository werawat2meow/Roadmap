"use client";

import { useState } from "react";
import useAuth from "@/hooks/useAuth";
import LoadingOrb from "../../components/LoadingOrb";
import EmployeeMasterSidebar from "./components/EmployeeMasterSidebar";
import EmployeeMasterMobileHeader from "./components/EmployeeMasterMobileHeader";

export default function EmployeeMasterLayout({ children }) {
  const { user, loadingUser } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loadingUser) return <LoadingOrb />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <EmployeeMasterMobileHeader onOpen={() => setMobileOpen(true)} />

      <EmployeeMasterSidebar
        user={user}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

/*

 // สามารถดูได้ได้ว่า คนนี้ มีการเข้า-ออกกี่ครั้ง แต่ละครั้ง เคยอยู่สังกัดใหนบ้างง  เช็คย้อนหลังได้ 

*/