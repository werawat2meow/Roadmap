'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import FilterDropdown from './FilterDropdown'; // เราจะใช้ FilterDropdown ที่สร้างไว้

type SearchBarProps = {
  placeholder: string;
  onSearch: (term: string) => void;
  onFilter?: (filters: any) => void; // ทำให้ onFilter เป็น optional
  filterOptions?: { departments: string[], statuses: string[] }; // ตัวเลือกสำหรับ Filter
};

export default function SearchBar({ placeholder, onSearch, onFilter, filterOptions }: SearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterRef]);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-full sm:flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder} // <-- ใช้ placeholder จาก props
          onChange={(e) => onSearch(e.target.value)}
          className="text-black w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none"
        />
      </div>
      
      {/* แสดงปุ่ม Filter ก็ต่อเมื่อมีฟังก์ชัน onFilter ส่งเข้ามา */}
      {onFilter && (
        <div className="relative w-full sm:w-auto" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
          {isFilterOpen && filterOptions && (
            <FilterDropdown
              // สมมติว่า FilterDropdown ถูกปรับให้รับ options ได้
              departments={filterOptions.departments}
              statuses={filterOptions.statuses}
              onApplyFilters={onFilter}
              onClose={() => setIsFilterOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}