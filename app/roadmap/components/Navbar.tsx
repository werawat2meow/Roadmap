'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; 
import { GanttChartSquare, LayoutDashboard, BarChart3, ClipboardCheck, Crown, Banknote, Settings, ChevronLeft, Users, ArrowLeftSquare, Lock } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/roadmap', icon: LayoutDashboard },
  { name: 'Employee', href: '/roadmap/employee', icon: Users },
  { name: 'Evaluate HR', href: '/roadmap/evaluate', icon: GanttChartSquare },
  { name: 'Evaluate MGR', href: '/roadmap/evaluatemgr', icon: ClipboardCheck },
  { name: 'Reports', href: '/roadmap/reports', icon: BarChart3 },
  { name: 'Executive', href: '/roadmap/executive', icon: Crown },
  { name: 'Send Account', href: '/roadmap/payroll', icon: Banknote },
  { name: 'Settings', href: '/roadmap/settings', icon: Settings },
  { name: 'Main Website', href: '/admin', icon: ArrowLeftSquare },
];

type NavbarProps = {
  isCollapsed: boolean;
  toggleSidebar?: () => void;
  onLinkClick?: () => void; 
};

export default function Navbar({ isCollapsed, toggleSidebar, onLinkClick }: NavbarProps) {
  const pathname = usePathname();
  const { user, loadingUser } = useAuth();
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);

  useEffect(() => {
    const empId = user?.employee_id || user?.id;
    if (!empId) return;

    if (user?.role === 'SUPER_ADMIN' || user?.role_code === 'SUPER_ADMIN') {
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
        console.error(err);
      }
    }
    fetchPermissions();
  }, [user]);

  const getAvatarFallback = (name?: string | null) => {
    if (!name) return '??';
    return name.trim().split(/\s+/).map(n => n).join('').toUpperCase().slice(0, 2);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role_code === 'SUPER_ADMIN';

  return (
    <div className={`relative flex flex-col bg-gray-900 text-white h-full transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-800">
        {!isCollapsed && <h1 className="text-2xl font-bold text-white ml-2">Roadmap</h1>}
        {isCollapsed && <div className="hidden md:block p-2 font-bold bg-gray-700 rounded-md">R</div>}
      </div>

      {toggleSidebar && (
        <button onClick={toggleSidebar} className="absolute -right-3 top-16 z-10 bg-gray-800 text-white p-1.5 rounded-full border-2 border-gray-900 hover:bg-gray-700 hidden md:block">
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      )}

      <nav className="grow px-3 pt-4">
        <ul>
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/');
            
            // ตรวจเช็กว่าเมนูนี้ได้รับสิทธิ์หรือไม่
            const isMenuAllowed = item.name === 'Main Website' || isSuperAdmin || allowedMenus.includes(item.name);

            return (
              <li key={item.name} onClick={onLinkClick} className="relative">
                {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-md z-10" />}
                <Link href={item.href} title={isCollapsed ? item.name : ''}>
                  <span 
                    className={`flex items-center py-3 my-1 rounded-lg transition-colors relative group
                      ${isCollapsed ? 'justify-center px-3' : 'pl-6 pr-3'} 
                      ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
                      ${!isMenuAllowed ? 'opacity-50 hover:opacity-80' : ''} 🛠️ เมนูไหนไม่มีสิทธิ์จะจางลงเล็กน้อย
                    `}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate grow">{item.name}</span>}
                    
                    {/* 🔒 แสดงไอคอนแม่กุญแจเล็กๆ ด้านหลังเมนูที่ไม่มีสิทธิ์เข้าถึง (เฉพาะตอนไม่ย่อจอ) */}
                    {!isMenuAllowed && !isCollapsed && (
                      <Lock className="h-3.5 w-3.5 text-gray-500 shrink-0 ml-1" />
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center">
          <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white overflow-hidden select-none">
            {getAvatarFallback(user?.full_name || user?.name || user?.username)}
          </div>
          {!isCollapsed && (
            <div className="ml-3 overflow-hidden">
              {loadingUser && !user ? (
                <p className="text-sm text-gray-500 animate-pulse">Loading...</p>
              ) : (
                <>
                  <p className="text-sm font-semibold text-white truncate" title={user?.full_name || user?.name}>
                    {user?.full_name || user?.name || 'Guest'}
                  </p>
                  <p className="text-xs text-gray-400 truncate" title={user?.role || 'User'}>
                    {user?.role || 'User'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
