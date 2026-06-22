'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GanttChartSquare, LayoutDashboard, BarChart3, Settings, ChevronLeft, Users, ArrowLeftSquare } from 'lucide-react';

// ... (menuItems and user constants remain the same)
const menuItems = [
  { name: 'Dashboard', href: '/roadmap', icon: LayoutDashboard },
  { name: 'Employee', href: '/roadmap/employee', icon: Users },
  { name: 'Evaluate', href: '/roadmap/evaluate', icon: GanttChartSquare },
    { name: 'Settings', href: '/roadmap/settings', icon: Settings },
  { name: 'Reports', href: '/roadmap/reports', icon: BarChart3 },
  { name: 'Main Website', href: '/admin', icon: ArrowLeftSquare },
];
const user = { name: 'Super Admin', role: 'Super Admin', avatar: 'SA' };


type NavbarProps = {
  isCollapsed: boolean;
  toggleSidebar?: () => void;
  onLinkClick?: () => void; 
};

export default function Navbar({ isCollapsed, toggleSidebar, onLinkClick }: NavbarProps) {
  const pathname = usePathname();

  return (
    <div
      className={`relative flex flex-col bg-gray-900 text-white h-full transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* --- Header --- */}
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-800">
        {/* Show full logo on mobile overlay and expanded desktop */}
        {!isCollapsed && <h1 className="text-2xl font-bold text-white ml-2">Roadmap</h1>}
        {/* Show small logo only on collapsed desktop */}
        {isCollapsed && <div className="hidden md:block p-2 font-bold bg-gray-700 rounded-md">H</div>}
      </div>

      {/* --- Collapse Button (Desktop Only) --- */}
      {toggleSidebar && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 z-10 bg-gray-800 text-white p-1.5 rounded-full border-2 border-gray-900 hover:bg-gray-700 hidden md:block"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      )}

      {/* --- Navigation Links --- */}
      <nav className="grow px-3 pt-4">
        <ul>
          {menuItems.map((item) => (
            <li key={item.name} onClick={onLinkClick}>
              <Link href={item.href} title={isCollapsed ? item.name : ''}>
                <span
                  className={`flex items-center px-3 py-3 my-1 rounded-lg transition-colors
                    ${pathname === item.href ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
                    ${pathname === '/' && item.href === '/' ? 'bg-gray-800 text-white' : ''}
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* ... (User Profile Section) ... */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center">
          <div className="shrink-0 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
            {user.avatar}
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}