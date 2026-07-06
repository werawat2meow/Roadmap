'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from './components/Navbar';
import { Menu, ShieldAlert } from 'lucide-react';
import RoadmapHelpWidget from './components/RoadmapHelpWidget';
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; 

const routePermissionMap: { [key: string]: string } = {
  '/roadmap': 'Dashboard',
  '/roadmap/employee': 'Employee',
  '/roadmap/evaluate': 'Evaluate HR',
  '/roadmap/evaluatemgr': 'Evaluate MGR',
  '/roadmap/reports': 'Reports',
  '/roadmap/executive': 'Executive',
  '/roadmap/payroll': 'Send Account',
  '/roadmap/settings': 'Settings',
};

function RoadmapLayoutContent({ children }: { children: React.ReactNode }) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, loadingUser } = useAuth();

  const toggleDesktopSidebar = () => setIsDesktopCollapsed(!isDesktopCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // เช็กสถานะการ Login
  useEffect(() => {
    if (!loadingUser && !user) {
      router.push('/login');
    }
  }, [user, loadingUser, router]);

  // ดึงข้อมูลสิทธิ์เมนูจาก API
  useEffect(() => {
    // แก้ไขคีย์การดึงค่าไอดีพนักงานให้ตรงกับฐานข้อมูลจริงของคุณ (user.employee_id)
    const empId = user?.employee_id || user?.id;
    if (!empId) return;

    // 🛠️ ถ้าเป็น SUPER_ADMIN ไม่ต้องยิงไปดึงตารางย่อย ให้เปิดทุกเมนูไปเลย
    if (user?.role === 'SUPER_ADMIN' || user?.role_code === 'SUPER_ADMIN') {
      setLoadingPermissions(false);
      return;
    }

    async function fetchPermissions() {
      try {
        const res = await fetch('/roadmap/api/user-access');
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          const myAccess = json.data.find((item: any) => item.employee_id === empId);
          if (myAccess && Array.isArray(myAccess.menus)) {
            setAllowedMenus(myAccess.menus);
          }
        }
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
      } finally {
        setLoadingPermissions(false);
      }
    }

    fetchPermissions();
  }, [user]);

  if (loadingUser || loadingPermissions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F5F2]">
        <p className="text-gray-500 animate-pulse font-medium">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
      </div>
    );
  }

  if (!user) return null;

  // 🛠️ เงื่อนไขการปล่อยสิทธิ์ผ่าน: ถ้าเป็น SUPER_ADMIN หรือหน้าทั่วไปที่ไม่อยู่ใน Permissions Map ให้ปล่อยเข้าได้เลย
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role_code === 'SUPER_ADMIN';
  const requiredPermission = routePermissionMap[pathname];
  
  const hasPermission = isSuperAdmin || !requiredPermission
    ? true 
    : allowedMenus.includes(requiredPermission);

  return (
    <div className="relative min-h-screen bg-[#F9F5F2]">
      <div className="hidden md:block fixed inset-y-0 left-0 z-20">
        <Navbar isCollapsed={isDesktopCollapsed} toggleSidebar={toggleDesktopSidebar} />
      </div>

      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" onClick={toggleMobileMenu}></div>
          <div className="fixed inset-y-0 left-0 z-40 md:hidden">
            <Navbar isCollapsed={false} onLinkClick={toggleMobileMenu} />
          </div>
        </>
      )}

      <div className={`transition-all duration-300 ease-in-out ${isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
        <header className="flex md:hidden items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-10">
          <button onClick={toggleMobileMenu} className="text-gray-700">
            <Menu className="h-6 w-6" />
          </button>
          <div className="text-lg font-bold">Roadmap</div>
          <div className="w-6"></div>
        </header>

        <main className="flex-1">
          {hasPermission ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[80vh]">
              <div className="bg-red-50 p-4 rounded-full text-red-600 mb-4 shadow-sm animate-bounce">
                <ShieldAlert className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-500 max-w-sm mb-6">
                บัญชีของคุณไม่มีสิทธิ์ในการเข้าถึงหน้าใช้งาน{" "}
                <span className="font-semibold text-blue-600">
                  {requiredPermission}
                </span>{" "}
                กรุณาติดต่อผู้ดูแลระบบเพื่อขอเปิดสิทธิ์
              </p>
              <button 
                onClick={() => router.push('/roadmap')} 
                className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition shadow-sm text-sm cursor-pointer"
              >
                กลับสู่หน้าหลัก
              </button>
            </div>
          )}
          <RoadmapHelpWidget />
        </main>
      </div>
    </div>
  );
}

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RoadmapLayoutContent>{children}</RoadmapLayoutContent>
    </AuthProvider>
  );
}
