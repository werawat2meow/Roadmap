'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const tabs = [
  { label: 'Employee Approval', href: '/leave/settings/approvals' },
  { label: 'Leave Entitlements', href: '/leave/settings/entitlements' },
  { label: 'Restricted Dates', href: '/leave/settings/restricted-dates' },
  { label: 'Annual Holidays', href: '/leave/settings/holidays' },
];

export default function LeaveSettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="w-full max-w-full px-4 py-6">

        <nav className="mb-6 rounded-3xl bg-slate-900/95 p-2 shadow-md">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div>{children}</div>
      </div>
    </main>
  );
}