'use client';
import { useEffect, useMemo, useState } from 'react';
import { swalSuccess, swalError } from '../../../components/Swal';
import { Check, Crown, Banknote, X } from 'lucide-react';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  LayoutDashboard,
  Users,
  ClipboardCheck,
  BarChart3,
  GanttChartSquare,
  Settings,
} from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Executive' | 'ยังไม่กำหนด';
  menus: string[];
};

type Props = {
  users: User[];
  selectedUserId: string;
  selectedUser: User;
  menuOptions: string[];
  onSelectUser: (id: string) => void;
  onUpdateUser: (user: User) => void | Promise<void>;
};

const menuIconMap: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  Employee: Users,
  'Evaluate HR': GanttChartSquare,
  'Evaluate MGR': ClipboardCheck,
  Settings: Settings,
  Reports: BarChart3,
  Executive: Crown,
  'Send Account': Banknote,
};

const menuIconStyles: Record<string, string> = {
  Dashboard: 'text-cyan-700',
  Employee: 'text-amber-700',
  'Evaluate HR': 'text-pink-700',
  'Evaluate MGR': 'text-orange-700',
  Settings: 'text-rose-700',
  Reports: 'text-blue-700',
  Executive: 'text-violet-700',
  'Send Account': 'text-green-700',
};

const menuIconBgStyles: Record<string, string> = {
  Dashboard: 'bg-cyan-100',
  Employee: 'bg-amber-100',
  'Evaluate HR': 'bg-pink-100',
  'Evaluate MGR': 'bg-orange-100',
  Settings: 'bg-rose-100',
  Reports: 'bg-blue-100',
  Executive: 'bg-violet-100',
  'Send Account': 'bg-green-100',
};

const roleOptions: User['role'][] = ['Admin', 'Manager', 'Executive', 'ยังไม่กำหนด'];

export default function AccessPermissionsPanel({
  users,
  selectedUserId,
  selectedUser,
  menuOptions,
  onSelectUser,
  onUpdateUser,
}: Props) {
  const [draftUser, setDraftUser] = useState<User>(selectedUser);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraftUser(selectedUser);
  }, [selectedUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateUser(draftUser);
      swalSuccess('บันทึกสำเร็จ');
    } catch (error){
      swalError('บันทึกไม่สำเร็จ', 'กรุณาลองอีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const counts = {
    Admin: users.filter((user) => user.role === 'Admin').length,
    Manager: users.filter((user) => user.role === 'Manager').length,
    Executive: users.filter((user) => user.role === 'Executive').length,
    unassigned: users.filter((user) => user.role === 'ยังไม่กำหนด').length,
  };

  const handleRoleChange = (role: User['role']) => {
    setDraftUser((prev) => ({ ...prev, role }));
  };

  const handleToggleMenu = (menu: string) => {
    setDraftUser((prev) => {
      const menus = prev.menus.includes(menu)
        ? prev.menus.filter((item) => item !== menu)
        : [...prev.menus, menu];
      return { ...prev, menus };
    });
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
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold text-violet-700 bg-violet-50 border-violet-100">
            <Crown className="h-4 w-4" />
            Executive
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">{counts.Executive}</p>
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
              <h2 className="text-2xl font-semibold text-slate-900">{draftUser.name}</h2>
              <p className="text-sm text-slate-500">{draftUser.email}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    draftUser.role === role
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
                  const Icon = menuIconMap[menu] ?? LayoutDashboard;
                  const iconStyle = menuIconStyles[menu] ?? 'text-slate-700';
                  const iconBgStyle = menuIconBgStyles[menu] ?? 'bg-slate-100';
                  const active = draftUser.menus.includes(menu);

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
                          active ? `bg-cyan-200 ${iconStyle}` : `${iconBgStyle} ${iconStyle}`
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span>{menu}</span>

                      <span
                        className={`ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                          active ? 'border-white/20 bg-white/10 text-white' : 'border-slate-200 bg-slate-100 text-slate-500'
                        }`}
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
                onClick={handleSave}
                disabled={isSaving}
                className={`relative z-10 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 
                  ${isSaving ? 'cursor-not-allowed bg-slate-400' : 'cursor-pointer'}`}
              >
                {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}