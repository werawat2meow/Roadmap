"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Employee {
  id: string;
  employeeCode: string;
  approverId?: number | null;
  name: string;
  email: string;
  dept: string;
  division: string;
  unit: string;
  level: string;
  firstNameTh?: string;
  lastNameTh?: string;
  firstNameEn?: string | null;
  lastNameEn?: string | null;
  citizenId?: string | null;
  departmentId?: string | null;
  divisionId?: string | null;
  unitId?: string | null;
  has_approval_authority: boolean;
  approver_ids: number[];
  weeklyHoliday?: string;
  workStartTime?: string;
  workEndTime?: string;
}

const weekDays = [
  { value: "0", label: "อา" },
  { value: "1", label: "จ" },
  { value: "2", label: "อ" },
  { value: "3", label: "พ" },
  { value: "4", label: "พฤ" },
  { value: "5", label: "ศ" },
  { value: "6", label: "ส" },
];

function parseWeeklyHoliday(value?: string) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatWeeklyHoliday(value?: string) {
  const selected = parseWeeklyHoliday(value);

  if (selected.length === 0) return "ยังไม่ตั้งค่า";

  return selected
    .map((day) => weekDays.find((item) => item.value === day)?.label || day)
    .join(", ");
}

export default function LeaveSettingsApprovalsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [workConfigEmployee, setWorkConfigEmployee] = useState<Employee | null>(
    null,
  );
  const [selectedDaysOff, setSelectedDaysOff] = useState<string[]>([]);
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [workEndTime, setWorkEndTime] = useState("18:00");
  const [savingWorkConfig, setSavingWorkConfig] = useState(false);

  const loadEmployees = async () => {
    try {
      const res = await fetch("/leave/api/approvals", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "โหลดข้อมูลพนักงานไม่สำเร็จ");
      }

      setEmployees(json.data || []);
    } catch (error: any) {
      console.error("Load approval employees failed:", error);
      alert(error.message || "โหลดข้อมูลพนักงานไม่สำเร็จ");
    }
  };
  const openWorkConfig = (employee: Employee) => {
    setWorkConfigEmployee(employee);
    setSelectedDaysOff(parseWeeklyHoliday(employee.weeklyHoliday));
    setWorkStartTime(employee.workStartTime || "09:00");
    setWorkEndTime(employee.workEndTime || "18:00");
  };
  const toggleDayOff = (value: string) => {
    setSelectedDaysOff((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };
  const saveWorkConfig = async () => {
    if (!workConfigEmployee) return;

    try {
      setSavingWorkConfig(true);

      const res = await fetch("/leave/api/employee-configs", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: workConfigEmployee.id,
          weeklyHoliday: selectedDaysOff,
          workStartTime,
          workEndTime,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "บันทึกการตั้งค่าไม่สำเร็จ");
      }

      setWorkConfigEmployee(null);
      await loadEmployees();
    } catch (error: any) {
      console.error("Save work config failed:", error);
      alert(error.message || "บันทึกการตั้งค่าไม่สำเร็จ");
    } finally {
      setSavingWorkConfig(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function fetchEmployees() {
      try {
        // setLoading(true);

        const res = await fetch("/leave/api/approvals", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "โหลดข้อมูลพนักงานไม่สำเร็จ");
        }

        if (mounted) {
          setEmployees(json.data || []);
        }
      } catch (error: any) {
        console.error("Load approval employees failed:", error);

        if (mounted) {
          alert(error.message || "โหลดข้อมูลพนักงานไม่สำเร็จ");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchEmployees();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const keyword = searchTerm.toLowerCase();

      const matchesSearch =
        emp.name.toLowerCase().includes(keyword) ||
        emp.email.toLowerCase().includes(keyword) ||
        emp.employeeCode.toLowerCase().includes(keyword);

      const matchesDept = filterDept === "All" || emp.dept === filterDept;
      const matchesLevel = filterLevel === "All" || emp.level === filterLevel;

      return matchesSearch && matchesDept && matchesLevel;
    });
  }, [employees, searchTerm, filterDept, filterLevel]);

  const departments = useMemo(() => {
    return Array.from(
      new Set(employees.map((emp) => emp.dept).filter(Boolean)),
    ).sort();
  }, [employees]);

  const levels = useMemo(() => {
    return Array.from(
      new Set(employees.map((emp) => emp.level).filter(Boolean)),
    ).sort();
  }, [employees]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const currentItems = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterDept(e.target.value);
    setCurrentPage(1);
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterLevel(e.target.value);
    setCurrentPage(1);
  };

  const toggleAuthority = async (employee: Employee) => {
    const nextValue = !employee.has_approval_authority;

    try {
      setSavingId(employee.id);

      const res = await fetch("/leave/api/approvals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "toggle-authority",
          employee,
          enabled: nextValue,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "บันทึกสิทธิ์อนุมัติไม่สำเร็จ");
      }

      await loadEmployees();
    } catch (error: any) {
      console.error("Toggle authority failed:", error);
      alert(error.message || "บันทึกสิทธิ์อนุมัติไม่สำเร็จ");
    } finally {
      setSavingId(null);
    }
  };

  const updateApprovers = async (
    employeeId: string,
    newApproverIds: number[],
  ) => {
    try {
      setSavingId(employeeId);

      const res = await fetch("/leave/api/approvals", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update-approvers",
          employeeId,
          approverIds: newApproverIds,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "บันทึกผู้อนุมัติไม่สำเร็จ");
      }

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId
            ? { ...emp, approver_ids: newApproverIds }
            : emp,
        ),
      );
    } catch (error: any) {
      console.error("Update approvers failed:", error);
      alert(error.message || "บันทึกผู้อนุมัติไม่สำเร็จ");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="w-full p-8 space-y-6 min-h-screen bg-slate-50/30">
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">
          Employee Approval Management
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          จัดการสายการอนุมัติและสิทธิ์การอนุมัติของพนักงาน
        </p>
      </div>

      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-center">
        <div className="relative flex-grow min-w-[300px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="ค้นหาชื่อ รหัส หรืออีเมลพนักงาน..."
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
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          className="bg-slate-50 border-none rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
          value={filterLevel}
          onChange={handleLevelChange}
        >
          <option value="All">ทุกระดับ</option>
          {levels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-x-auto overflow-y-visible">
        <table className="w-full min-w-[1400px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="w-[300px] px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Employee
              </th>

              <th className="w-[260px] px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Department
              </th>

              <th className="w-[160px] px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Level
              </th>

              <th className="w-[220px] px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Work Schedule
              </th>

              <th className="w-[170px] px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                Approval Authority
              </th>

              <th className="w-[280px] px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Approvers
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-20 text-center text-slate-400 font-medium"
                >
                  กำลังโหลดข้อมูลพนักงาน...
                </td>
              </tr>
            ) : currentItems.length > 0 ? (
              currentItems.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/30 transition-colors"
                >
                  <td className="px-8 py-5 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2dd4bf] flex items-center justify-center text-slate-900 font-bold text-sm shadow-sm shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-700 text-sm truncate">
                        {emp.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {emp.employeeCode}
                        {emp.email ? ` • ${emp.email}` : ""}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-500 font-medium truncate">
                    {emp.dept}
                    {emp.division && ` / ${emp.division}`}
                  </td>

                  <td className="px-6 py-5">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold uppercase">
                      {emp.level}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          หยุด: {formatWeeklyHoliday(emp.weeklyHoliday)}
                        </p>
                        <p className="text-xs font-semibold text-slate-400">
                          {emp.workStartTime || "09:00"} -{" "}
                          {emp.workEndTime || "18:00"}
                        </p>
                      </div>

                      <button
                        onClick={() => openWorkConfig(emp)}
                        className="cursor-pointer rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-900 shadow-sm transition hover:bg-amber-500"
                      >
                        ตั้งค่า
                      </button>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={emp.has_approval_authority}
                        onChange={() => toggleAuthority(emp)}
                        disabled={savingId === emp.id}
                        className="w-5 h-5 rounded border-slate-300 accent-[#111827] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </td>

                  <td className="px-8 py-5">
                    <MultiSelectApprover
                      options={employees.filter(
                        (e) =>
                          e.has_approval_authority &&
                          e.id !== emp.id &&
                          e.approverId,
                      )}
                      selectedIds={emp.approver_ids}
                      onChange={(newIds) => updateApprovers(emp.id, newIds)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-20 text-center text-slate-400 font-medium italic"
                >
                  ไม่พบข้อมูลพนักงานที่ค้นหา
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between rounded-b-3xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Page {currentPage} of {totalPages || 1}
          </p>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      {workConfigEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  ตั้งค่าวันหยุดประจำสัปดาห์
                </h3>
                <p className="text-sm font-semibold text-slate-500">
                  {workConfigEmployee.employeeCode} - {workConfigEmployee.name}
                </p>
              </div>

              <button
                onClick={() => setWorkConfigEmployee(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-500">
                  วันหยุดประจำสัปดาห์
                </label>

                <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((day) => {
                    const active = selectedDaysOff.includes(day.value);

                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDayOff(day.value)}
                        className={`rounded-xl border px-3 py-2 text-sm font-bold transition ${
                          active
                            ? "border-rose-500 bg-rose-50 text-rose-600"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    เวลาเข้างาน
                  </label>
                  <input
                    type="time"
                    value={workStartTime}
                    onChange={(event) => setWorkStartTime(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    เวลาเลิกงาน
                  </label>
                  <input
                    type="time"
                    value={workEndTime}
                    onChange={(event) => setWorkEndTime(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-50"
                  />
                </div>
              </div>

              <button
                onClick={saveWorkConfig}
                disabled={savingWorkConfig}
                className="w-full rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {savingWorkConfig ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MultiSelectApprover({
  options,
  selectedIds,
  onChange,
}: {
  options: Employee[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getSelectedNames = () => {
    if (selectedIds.length === 0) return "เลือกผู้อนุมัติ";

    return options
      .filter((opt) => opt.approverId && selectedIds.includes(opt.approverId))
      .map((opt) => opt.name)
      .join(", ");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-4 py-2.5 text-sm border rounded-2xl transition-all shadow-sm bg-white cursor-pointer ${
          isOpen
            ? "border-slate-400 ring-4 ring-slate-50"
            : "border-slate-200 text-slate-600 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2 truncate pr-2 text-left">
          <UserPlus
            size={16}
            className={
              selectedIds.length > 0 ? "text-[#2dd4bf]" : "text-slate-300"
            }
          />
          <span
            className={`truncate ${
              selectedIds.length === 0
                ? "text-slate-400"
                : "font-semibold text-slate-700"
            }`}
          >
            {getSelectedNames()}
          </span>
        </div>

        <ChevronDown
          size={16}
          className={`transition-transform duration-200 text-slate-400 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-[100] w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 italic text-center">
                  ไม่มีพนักงานที่มีสิทธิ์อนุมัติ
                </div>
              ) : (
                options.map((opt) => {
                  const approverId = opt.approverId!;

                  return (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(approverId)}
                        onChange={() => {
                          onChange(
                            selectedIds.includes(approverId)
                              ? selectedIds.filter((id) => id !== approverId)
                              : [...selectedIds, approverId],
                          );
                        }}
                        className="w-4 h-4 rounded border-slate-300 accent-[#111827]"
                      />
                      <span
                        className={`text-sm ${
                          selectedIds.includes(approverId)
                            ? "font-bold text-slate-900"
                            : "text-slate-600"
                        }`}
                      >
                        {opt.name}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
