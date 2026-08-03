'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardCheck, BarChart3, Settings, ChevronLeft, ArrowLeftSquare, UserCheck } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', href: '/leave', icon: LayoutDashboard },
  { name: 'Approvals', href: '/leave/approvals', icon: ClipboardCheck },
  { name: 'Reports', href: '/leave/reports', icon: BarChart3 },
    { name: 'Eligibility', href: '/leave/eligibility', icon: UserCheck },
  { name: 'Settings', href: '/leave/settings', icon: Settings },
  { name: 'Main Website', href: '/admin', icon: ArrowLeftSquare },
];

type NavbarProps = {
  isCollapsed: boolean;
  toggleSidebar?: () => void;
  onLinkClick?: () => void;
};

export default function Navbar({ isCollapsed, toggleSidebar, onLinkClick }: NavbarProps) {
  const pathname = usePathname();

  return (
    <div className={`relative flex flex-col bg-gray-900 text-white h-full transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-800">
        {!isCollapsed ? (
          <h1 className="text-2xl font-bold text-white ml-2">Leave</h1>
        ) : (
          <div className="hidden md:block p-2 font-bold bg-gray-700 rounded-md">L</div>
        )}
      </div>

      {toggleSidebar && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 z-10 bg-gray-800 text-white p-1.5 rounded-full border-2 border-gray-900 hover:bg-gray-700 hidden md:block"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      )}

      <nav className="grow px-3 pt-4">
        <ul>
          {menuItems.map((item) => {
            const isActive = item.href === '/leave' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <li key={item.name} onClick={onLinkClick} className="relative">
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-md z-10" />
                )}
                <Link href={item.href} title={isCollapsed ? item.name : ''}>
                  <span
                    className={`flex items-center py-3 my-1 rounded-lg transition-colors relative group ${isCollapsed ? 'justify-center px-3' : 'pl-6 pr-3'} ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span className="ml-3 truncate grow">{item.name}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}