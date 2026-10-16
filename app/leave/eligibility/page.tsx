"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface LeaveBalance {
  total: number;
  used: number;
  base?: number;
  carryForward?: number;
}

interface EmployeeEligibility {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  avatar: string;
  dept: string;
  division: string;
  unit: string;
  level: string;
  leaves: {
    annual: LeaveBalance;
    sick: LeaveBalance;
    business: LeaveBalance;
    holiday: LeaveBalance;
    vacation: LeaveBalance;
    birthday: LeaveBalance;
    ordain: LeaveBalance;
    maternity: LeaveBalance;
    unpaid: LeaveBalance;
  };
}

export default function EligibilityPage() {
  const [employees, setEmployees] = useState<EmployeeEligibility[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeEligibility | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterDivision, setFilterDivision] = useState("All");
  const [filterUnit, setFilterUnit] = useState("All");
  const [filterLevel, setFilterLevel] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const getRemaining = (leave: LeaveBalance) => leave.total - leave.used;

  const calcTableRemaining = (leaves: EmployeeEligibility["leaves"]) =>
    getRemaining(leaves.annual) +
    getRemaining(leaves.sick) +
    getRemaining(leaves.business);

  const getQuotaLeaves = (leaves: EmployeeEligibility["leaves"]) => [
    leaves.annual,
    leaves.sick,
    leaves.business,
    leaves.holiday,
    leaves.vacation,
    leaves.birthday,
    leaves.ordain,
    leaves.maternity,
  ];

  const calcAllRemaining = (leaves: EmployeeEligibility["leaves"]) =>
    getQuotaLeaves(leaves).reduce((sum, leave) => sum + getRemaining(leave), 0);

  const calcAllRights = (leaves: EmployeeEligibility["leaves"]) =>
    getQuotaLeaves(leaves).reduce((sum, leave) => sum + leave.total, 0);

  const getLeaveCards = (leaves: EmployeeEligibility["leaves"]) => [
    {
      label: "ลาพักร้อน",
      data: leaves.annual,
    },
    {
      label: "ลาป่วย",
      data: leaves.sick,
    },
    {
      label: "ลากิจ",
      data: leaves.business,
    },
    {
      label: "วันหยุดประจำปี",
      data: leaves.holiday,
    },
    {
      label: "ลาพักผ่อน",
      data: leaves.vacation,
    },
    {
      label: "ลาวันเกิด",
      data: leaves.birthday,
    },
    {
      label: "ลาบวช",
      data: leaves.ordain,
    },
    {
      label: "ลาคลอด",
      data: leaves.maternity,
    },
    {
      label: "ลาไม่รับค่าจ้าง",
      data: leaves.unpaid,
    },
  ];

  useEffect(() => {
    let mounted = true;

    async function fetchEligibility() {
      try {
        const res = await fetch("/leave/api/eligibility", {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "โหลดข้อมูลสิทธิ์วันลาไม่สำเร็จ");
        }

        if (mounted) {
          setEmployees(json.data || []);
        }
      } catch (error: any) {
        console.error("Load eligibility failed:", error);

        if (mounted) {
          alert(error.message || "โหลดข้อมูลสิทธิ์วันลาไม่สำเร็จ");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchEligibility();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const keyword = searchTerm.toLowerCase();

    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(keyword) ||
        emp.employeeCode.toLowerCase().includes(keyword) ||
        emp.email.toLowerCase().includes(keyword);

      const matchesDept = filterDept === "All" || emp.dept === filterDept;
      const matchesDivision =
        filterDivision === "All" || emp.division === filterDivision;
      const matchesUnit = filterUnit === "All" || emp.unit === filterUnit;
      const matchesLevel = filterLevel === "All" || emp.level === filterLevel;

      return (
        matchesSearch &&
        matchesDept &&
        matchesDivision &&
        matchesUnit &&
        matchesLevel
      );
    });
  }, [
    employees,
    searchTerm,
    filterDept,
    filterDivision,
    filterUnit,
    filterLevel,
  ]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const currentItems = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <section className="w-full p-8 space-y-6 min-h-screen relative overflow-hidden">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Check Eligibility
        </h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">
          ภาพรวมสิทธิ์วันลาของพนักงานทั้งหมด —{" "}
          <span className="text-slate-400">
            คลิกที่รายชื่อเพื่อดูสิทธิ์รายคน
          </span>
        </p>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-3">
        <div className="relative flex-grow min-w-[250px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="ค้นหาพนักงาน..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 text-black border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => {
            setFilterDept(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-600"
        >
          <option value="All">แผนกทั้งหมด</option>
          {Array.from(
            new Set(employees.map((emp) => emp.dept).filter(Boolean)),
          ).map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                พนักงาน
              </th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                สังกัด/แผนก
              </th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                ระดับ
              </th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                ลาพักร้อน
              </th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                ลาป่วย
              </th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">
                ลากิจ
              </th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">
                รวมคงเหลือ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-20 text-center text-slate-400 font-medium"
                >
                  กำลังโหลดข้อมูลสิทธิ์วันลา...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-20 text-center text-slate-400 font-medium"
                >
                  ไม่พบข้อมูลพนักงาน
                </td>
              </tr>
            ) : (
              currentItems.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => setSelectedEmp(emp)}
                  className="hover:bg-slate-50/30 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-5 flex items-center gap-3">
                    <img
                      src={emp.avatar}
                      className="w-10 h-10 rounded-full bg-slate-100"
                      alt=""
                    />
                    <span className="font-bold text-slate-700">{emp.name}</span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                    {emp.dept} / {emp.division}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold uppercase">
                      {emp.level}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center text-slate-700 font-bold">
                    {getRemaining(emp.leaves.annual)}
                  </td>

                  <td className="px-8 py-5 text-center text-slate-700 font-bold">
                    {getRemaining(emp.leaves.sick)}
                  </td>

                  <td className="px-8 py-5 text-center text-slate-700 font-bold">
                    {getRemaining(emp.leaves.business)}
                  </td>

                  <td className="px-8 py-5 text-right">
                    <span className="bg-cyan-50 text-cyan-600 px-4 py-1.5 rounded-xl font-bold text-sm">
                      {calcTableRemaining(emp.leaves)} วัน
                    </span>
                  </td>
                </tr>
              ))
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

      {/* --- SIDE DRAWER: เวอร์ชั่น "ตัวใหญ่ เต็มตา ไร้สกรอล์" --- */}
      <AnimatePresence>
        {selectedEmp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmp(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[70] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-50">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  สิทธิ์วันลา
                </h2>
                <button
                  onClick={() => setSelectedEmp(null)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Body */}
              <div className="p-8 flex-grow flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Profile - กลับมาใช้ขนาดปกติให้ดูดี */}
                  <div className="flex items-center gap-5">
                    <img
                      src={selectedEmp.avatar}
                      className="w-20 h-20 rounded-full bg-slate-100 border-2 border-white shadow-sm"
                      alt=""
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {selectedEmp.name}
                      </h3>
                      <p className="text-slate-500 font-medium">
                        {selectedEmp.dept} · {selectedEmp.level}
                      </p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {selectedEmp.division}
                        {selectedEmp.unit ? ` / ${selectedEmp.unit}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-cyan-600 pt-2">
                    <Calendar size={18} />
                    <h4 className="font-bold uppercase tracking-wider text-xs">
                      สิทธิ์วันลาทั้งหมด
                    </h4>
                  </div>

                  {/* Leave Cards - กลับมาใช้ฟอนต์ใหญ่ แต่ออกแบบให้ประหยัดพื้นที่แนวตั้ง */}
                  <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
                    {getLeaveCards(selectedEmp.leaves).map((item) => (
                      <FinalLeaveCard
                        key={item.label}
                        label={item.label}
                        total={item.data.total}
                        used={item.data.used}
                        base={item.data.base}
                        carryForward={item.data.carryForward}
                      />
                    ))}
                  </div>
                </div>

                {/* Summary Bar - กลับมาใหญ่และเข้มตามภาพแรกที่มึงชอบ แต่อยู่ชิดขอบล่างพอดี */}
                <div className="bg-[#1e293b] rounded-[2rem] p-8 text-white flex justify-between items-center shadow-2xl">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                      รวมสิทธิ์ทั้งหมด
                    </p>
                    <h4 className="text-4xl font-extrabold">
                      {calcAllRights(selectedEmp.leaves)}{" "}
                      <span className="text-sm font-normal text-slate-400">
                        วัน
                      </span>
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
                      คงเหลือรวม
                    </p>
                    <h4 className="text-4xl font-extrabold text-cyan-400">
                      {calcAllRemaining(selectedEmp.leaves)}{" "}
                      <span className="text-sm font-normal text-slate-400">
                        วัน
                      </span>
                    </h4>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
function FinalLeaveCard({
  label,
  total,
  used,
  base,
  carryForward,
}: {
  label: string;
  total: number;
  used: number;
  base?: number;
  carryForward?: number;
}) {
  const remaining = total - used;

  return (
    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="font-bold text-slate-800 text-sm leading-tight truncate">
            {label}
          </h5>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-bold">
            <span className="text-slate-400">
              สิทธิ์: <span className="text-slate-700">{base ?? total}</span>
            </span>

            {/* {carryForward ? (
              <span className="text-slate-400">
                ยกมา: <span className="text-blue-500">{carryForward}</span>
              </span>
            ) : null} */}

            {carryForward != null && (
              <span className="text-slate-400">
                ยกมา: <span className="text-blue-500">{carryForward}</span>
              </span>
            )}

            <span className="text-slate-400">
              ใช้: <span className="text-red-500">{used}</span>
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-2xl font-black text-emerald-500 leading-none">
            {remaining}
          </span>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
            คงเหลือ
          </p>
        </div>
      </div>
    </div>
  );
}
