'use client';

import { Check, X } from 'lucide-react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  LayoutDashboard,
  Users,
  Target,
  ClipboardCheck,
  TrendingUp,
  Gift,
  BarChart3,
  Settings,
} from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff' | 'ยังไม่กำหนด';
  menus: string[];
};

type Props = {
  users: User[];
  selectedUserId: string;
  selectedUser: User;
  menuOptions: string[];
  onSelectUser: (id: string) => void;
  onUpdateUser: (user: User) => void;
};

const roleIcons = {
  Admin: Shield,
  Manager: ShieldCheck,
  Staff: ShieldAlert,
  'ยังไม่กำหนด': ShieldOff,
};

const menuIconMap: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  Employee: Users,
  Evaluate: ClipboardCheck,
  Settings: Settings,
  Reports: BarChart3,
  Executive: Gift,
};

const menuIconStyles: Record<string, string> = {
  Dashboard: 'text-cyan-700',
  Employee: 'text-orange-700',
  Evaluate: 'text-amber-700',
  Settings: 'text-rose-700',
  Reports: 'text-emerald-700',
  Executive: 'text-violet-700',
};

const menuIconBgStyles: Record<string, string> = {
  Dashboard: 'bg-cyan-100',
  Employee: 'bg-orange-100',
  Evaluate: 'bg-amber-100',
  Settings: 'bg-rose-100',
  Reports: 'bg-emerald-100',
  Executive: 'bg-violet-100',
};


const roleOptions: User['role'][] = ['Admin', 'Manager', 'Staff'];

export default function AccessPermissionsPanel({
  users,
  selectedUserId,
  selectedUser,
  menuOptions,
  onSelectUser,
  onUpdateUser,
}: Props) {
  const counts = {
    Admin: users.filter((user) => user.role === 'Admin').length,
    Manager: users.filter((user) => user.role === 'Manager').length,
    Staff: users.filter((user) => user.role === 'Staff').length,
    unassigned: users.filter((user) => user.role === 'ยังไม่กำหนด').length,
  };

  const handleRoleChange = (role: User['role']) => {
    onUpdateUser({ ...selectedUser, role });
  };

  const handleToggleMenu = (menu: string) => {
    const menus = selectedUser.menus.includes(menu)
      ? selectedUser.menus.filter((item) => item !== menu)
      : [...selectedUser.menus, menu];
    onUpdateUser({ ...selectedUser, menus });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 border-red-100">
            <Shield className="h-4 w-4" />
            Admin
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{counts.Admin}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border-blue-100">
            <ShieldCheck className="h-4 w-4" />
            Manager
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{counts.Manager}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-slate-600 bg-slate-100 border-slate-200">
            <ShieldAlert className="h-4 w-4" />
            Staff
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{counts.Staff}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-amber-700 bg-amber-50 border-amber-100">
            <ShieldOff className="h-4 w-4" />
            ยังไม่กำหนด
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{counts.unassigned}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          {users.map((user) => {
            const isSelected = user.id === selectedUserId;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onSelectUser(user.id)}
                className={`w-full rounded-3xl border p-5 text-left transition ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-100 text-blue-700 font-semibold">
                      {user.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {user.role}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {user.menus.length}/{menuOptions.length} เมนู
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">ชื่อพนักงาน</p>
              <h2 className="text-2xl font-semibold text-slate-900">{selectedUser.name}</h2>
              <p className="text-sm text-slate-500">{selectedUser.email}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selectedUser.role === role
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 mb-4">กำหนดเมนู</p>
              <div className="grid gap-3 lg:grid-cols-2">
                {menuOptions.map((menu) => {
                  const Icon = menuIconMap[menu];
                  const active = selectedUser.menus.includes(menu);

                  return (
                    <button
                      key={menu}
                      type="button"
                      onClick={() => handleToggleMenu(menu)}
                      className={`flex items-center gap-3 rounded-3xl border px-5 py-4 text-left text-sm font-semibold transition ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                            active
                            ? `bg-cyan-200 ${menuIconStyles[menu]}`
                            : `${menuIconBgStyles[menu]} ${menuIconStyles[menu]}`
                          }`}
                        >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span>{menu}</span>

                      <span className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition
                        ${active ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-slate-100 text-slate-500'}"
                      >
                        {active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onUpdateUser(selectedUser)}
                className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}