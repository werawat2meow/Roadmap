"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, ChevronDown, UserPlus, Search, 
  ChevronLeft, ChevronRight 
} from "lucide-react";

// --- Types ---
interface Employee {
  id: number;
  name: string;
  email: string;
  dept: string;
  division: string;
  unit: string;
  level: string;
  has_approval_authority: boolean;
  approver_ids: number[];
}

// --- Mock Data ---
const initialEmployees: Employee[] = [
  { id: 1, name: "Prasert Boonmee", email: "prasert@company.com", dept: "Operations", division: "Management", unit: "Unit A", level: "Director", has_approval_authority: true, approver_ids: [4, 6] },
  { id: 2, name: "Anan Pongchai", email: "anan@company.com", dept: "Engineering", division: "Software", unit: "Unit B", level: "Junior Staff", has_approval_authority: false, approver_ids: [] },
  { id: 3, name: "Malee Traipoom", email: "malee@company.com", dept: "Marketing", division: "Digital", unit: "Unit C", level: "Senior Staff", has_approval_authority: false, approver_ids: [] },
  { id: 4, name: "Suda Wongsa", email: "suda@company.com", dept: "HR", division: "Personnel", unit: "Unit A", level: "Manager", has_approval_authority: true, approver_ids: [] },
  { id: 5, name: "Naree Suwan", email: "naree@company.com", dept: "Finance", division: "Accounting", unit: "Unit B", level: "Mid Level", has_approval_authority: false, approver_ids: [] },
  { id: 6, name: "Somchai Jaidee", email: "somchai@company.com", dept: "Engineering", division: "Software", unit: "Unit C", level: "Senior Staff", has_approval_authority: true, approver_ids: [] },
  { id: 7, name: "Wichai Rakthai", email: "wichai@company.com", dept: "Engineering", division: "Software", unit: "Unit B", level: "Senior Staff", has_approval_authority: true, approver_ids: [] },
  { id: 8, name: "Kanya Srisuk", email: "kanya@company.com", dept: "Marketing", division: "Content", unit: "Unit A", level: "Junior Staff", has_approval_authority: false, approver_ids: [] },
];

export default function LeaveSettingsApprovalsPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  
  // States สำหรับ Search และ Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  
  // States สำหรับ Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // --- Logic การกรองข้อมูล ---
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDept === "All" || emp.dept === filterDept;
      const matchesLevel = filterLevel === "All" || emp.level === filterLevel;
      return matchesSearch && matchesDept && matchesLevel;
    });
  }, [employees, searchTerm, filterDept, filterLevel]);

  // --- Logic การแบ่งหน้า ---
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const currentItems = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Handlers: แก้ปัญหา Cascading Renders โดยการ reset หน้าที่นี่ ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // รีเซ็ตหน้าเมื่อพิมพ์ค้นหา
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterDept(e.target.value);
    setCurrentPage(1); // รีเซ็ตหน้าเมื่อเปลี่ยนแผนก
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterLevel(e.target.value);
    setCurrentPage(1); // รีเซ็ตหน้าเมื่อเปลี่ยนระดับ
  };

  const toggleAuthority = (id: number) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, has_approval_authority: !emp.has_approval_authority } : emp));
  };

  const updateApprovers = (employeeId: number, newApproverIds: number[]) => {
    setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, approver_ids: newApproverIds } : emp));
  };

  return (
    <section className="w-full p-8 space-y-6 min-h-screen bg-slate-50/30">
      {/* Header */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Employee Approval Management</h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">จัดการสายการอนุมัติและสิทธิ์การอนุมัติของพนักงาน</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-grow min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="ค้นหาชื่อ หรือ อีเมลพนักงาน..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
          />
        </div>
        <select 
          className="bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          value={filterDept}
          onChange={handleDeptChange}
        >
          <option value="All">ทุกแผนก</option>
          <option value="Engineering">Engineering</option>
          <option value="HR">HR</option>
          <option value="Marketing">Marketing</option>
          <option value="Operations">Operations</option>
          <option value="Finance">Finance</option>
        </select>
        <select 
          className="bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          value={filterLevel}
          onChange={handleLevelChange}
        >
          <option value="All">ทุกระดับ</option>
          <option value="Director">Director</option>
          <option value="Manager">Manager</option>
          <option value="Senior Staff">Senior Staff</option>
          <option value="Mid Level">Mid Level</option>
          <option value="Junior Staff">Junior Staff</option>
        </select>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-visible">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="w-[30%] px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Employee</th>
              <th className="w-[20%] px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Department</th>
              <th className="w-[15%] px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Level</th>
              <th className="w-[15%] px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">Approval Authority</th>
              <th className="w-[20%] px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">Approvers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentItems.length > 0 ? currentItems.map((emp) => (
              <tr key={emp.id} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2dd4bf] flex items-center justify-center text-slate-900 font-bold text-sm shadow-sm shrink-0">
                    {emp.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-700 text-sm truncate">{emp.name}</p>
                    <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-500 font-medium truncate">
                  {emp.dept} {emp.division && `/ ${emp.division}`}
                </td>
                <td className="px-6 py-5">
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold uppercase">{emp.level}</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center">
                    <input 
                      type="checkbox" 
                      checked={emp.has_approval_authority} 
                      onChange={() => toggleAuthority(emp.id)} 
                      className="w-5 h-5 rounded border-slate-300 accent-[#111827] cursor-pointer" 
                    />
                  </div>
                </td>
                <td className="px-8 py-5">
                  <MultiSelectApprover 
                    options={employees.filter(e => e.has_approval_authority && e.id !== emp.id)}
                    selectedIds={emp.approver_ids}
                    onChange={(newIds) => updateApprovers(emp.id, newIds)}
                  />
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-medium italic">ไม่พบข้อมูลพนักงานที่ค้นหา</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Page {currentPage} of {totalPages || 1}
          </p>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- MultiSelect Component ---
function MultiSelectApprover({ options, selectedIds, onChange }: { options: Employee[], selectedIds: number[], onChange: (ids: number[]) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSelectedNames = () => {
    if (selectedIds.length === 0) return "เลือกผู้อนุมัติ";
    return options.filter(opt => selectedIds.includes(opt.id)).map(opt => opt.name).join(", ");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center justify-between w-full px-4 py-2.5 text-sm border rounded-2xl transition-all shadow-sm bg-white cursor-pointer ${isOpen ? "border-slate-400 ring-4 ring-slate-50" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
        <div className="flex items-center gap-2 truncate pr-2 text-left">
          <UserPlus size={16} className={selectedIds.length > 0 ? "text-[#2dd4bf]" : "text-slate-300"} />
          <span className={`truncate ${selectedIds.length === 0 ? "text-slate-400" : "font-semibold text-slate-700"}`}>{getSelectedNames()}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-200 text-slate-400 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute z-[100] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 italic text-center">ไม่มีพนักงานที่มีสิทธิ์อนุมัติ</div>
              ) : (
                options.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(opt.id)} 
                      onChange={() => {
                        onChange(selectedIds.includes(opt.id) ? selectedIds.filter(i => i !== opt.id) : [...selectedIds, opt.id]);
                      }} 
                      className="w-4 h-4 rounded border-slate-300 accent-[#111827]" 
                    />
                    <span className={`text-sm ${selectedIds.includes(opt.id) ? "font-bold text-slate-900" : "text-slate-600"}`}>{opt.name}</span>
                  </label>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}