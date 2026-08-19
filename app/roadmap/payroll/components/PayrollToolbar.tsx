'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Filter, RotateCcw, Search } from 'lucide-react';

interface PayrollToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  level: string;
  status: string;
  departments: string[];
  levels: string[];
  statuses: string[];
  onDepartmentChange: (value: string) => void;
  onLevelChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function PayrollToolbar({
  search,
  onSearchChange,
  department,
  level,
  status,
  departments,
  levels,
  statuses,
  onDepartmentChange,
  onLevelChange,
  onStatusChange,
}: PayrollToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    onDepartmentChange('');
    onLevelChange('');
    onStatusChange('');
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full sm:flex-grow">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาชื่อพนักงาน, รหัส หรือเลขที่บัญชี..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-black outline-none focus:border-transparent focus:ring-2 focus:ring-gray-400"
        />
      </div>

      <div className="relative w-full sm:w-auto" ref={filterRef}>
        <button
          type="button"
          onClick={() => setIsFilterOpen((open) => !open)}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 sm:w-auto"
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </button>

        {isFilterOpen && (
          <div className="absolute right-0 top-full z-50 mt-3 w-80 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-700">ตัวกรองข้อมูล</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-500"
              >
                <RotateCcw className="h-3 w-3" />
                ล้างทั้งหมด
              </button>
            </div>

            <div className="max-h-[480px] space-y-4 overflow-y-auto p-5">
              <FilterField
                label="แผนก"
                value={department}
                onChange={onDepartmentChange}
                options={departments}
                placeholder="ทุกแผนก"
              />
              <FilterField
                label="ระดับพนักงาน (Level P)"
                value={level}
                onChange={onLevelChange}
                options={levels}
                placeholder="ทุก Level"
              />
              <FilterField
                label="สถานะบัญชี"
                value={status}
                onChange={onStatusChange}
                options={statuses}
                placeholder="ทุกสถานะ"
              />
            </div>

            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10" />
          </div>
        )}
      </div>
    </div>
  );
}

function FilterField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="ml-1 block text-[11px] font-black uppercase tracking-[0.05em] text-slate-400">
        {label}
      </label>
      <div className="group relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}
