'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// กำหนด Type ใหม่ให้มีแค่ 2 อย่างตามที่ไฟล์แม่ส่งมา
interface PayrollToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function PayrollToolbar({ search, onSearchChange }: PayrollToolbarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full rounded-2xl border-gray-200 pl-11 pr-4 py-2.5 text-sm focus:border-sky-500 focus:ring-sky-500 bg-gray-50/50"
          placeholder="ค้นหาชื่อพนักงาน, รหัส หรือเลขที่บัญชี..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}