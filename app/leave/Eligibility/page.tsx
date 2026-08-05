"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, X, Calendar } from "lucide-react";

// --- Mock Data (ข้อมูลเดิม) ---
const employeeEligibility = [
  { id: 1, name: "Somchai Jaidee", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Somchai", dept: "Engineering", division: "Software Dev", level: "Senior Staff", subDept: "Software Dev / Backend", leaves: { annual: { total: 15, used: 2 }, sick: { total: 30, used: 0 }, personal: { total: 5, used: 0 } } },
  { id: 2, name: "Suda Wongsa", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suda", dept: "HR", division: "HR Ops", level: "Manager", subDept: "People Operations", leaves: { annual: { total: 18, used: 0 }, sick: { total: 27, used: 0 }, personal: { total: 6, used: 0 } } },
  { id: 3, name: "Anan Pongchai", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anan", dept: "Engineering", division: "Software Dev", level: "Junior Staff", subDept: "Software Dev / Frontend", leaves: { annual: { total: 10, used: 0 }, sick: { total: 30, used: 0 }, personal: { total: 3, used: 0 } } },
  { id: 4, name: "Naree Suwan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naree", dept: "Finance", division: "Accounting", level: "Mid Level", subDept: "Accounts Payable", leaves: { annual: { total: 12, used: 3 }, sick: { total: 30, used: 0 }, personal: { total: 4, used: 0 } } },
  { id: 5, name: "Prasert Boonmee", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prasert", dept: "Operations", division: "Ops Mgmt", level: "Director", subDept: "Supply Chain", leaves: { annual: { total: 20, used: 0 }, sick: { total: 30, used: 0 }, personal: { total: 4, used: 0 } } },
  { id: 6, name: "Malee Traipoom", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Malee", dept: "Marketing", division: "Digital", level: "Senior Staff", subDept: "Digital Marketing", leaves: { annual: { total: 15, used: 0 }, sick: { total: 30, used: 0 }, personal: { total: 5, used: 0 } } },
];

export default function EligibilityPage() {
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);

  const calcRemaining = (leaves: any) => (leaves.annual.total - leaves.annual.used) + (leaves.sick.total - leaves.sick.used) + (leaves.personal.total - leaves.personal.used);
  const calcTotalRights = (leaves: any) => leaves.annual.total + leaves.sick.total + leaves.personal.total;

  return (
    <section className="w-full p-8 space-y-6 min-h-screen relative overflow-hidden">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Check Eligibility</h1>
        <p className="text-slate-500 mt-1 text-sm font-medium">ภาพรวมสิทธิ์วันลาของพนักงานทั้งหมด — <span className="text-slate-400">คลิกที่รายชื่อเพื่อดูสิทธิ์รายคน</span></p>
      </header>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-3">
        <div className="relative flex-grow min-w-[250px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="ค้นหาพนักงาน..." className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium" />
        </div>
        <FilterMini label="แผนกทั้งหมด" />
        <FilterMini label="ฝ่ายทั้งหมด" />
        <FilterMini label="หน่วยทั้งหมด" />
        <FilterMini label="ระดับทั้งหมด" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">พนักงาน</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">สังกัด/แผนก</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">ระดับ</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">ลาพักร้อน</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">ลาป่วย</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">ลากิจ</th>
              <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">รวมคงเหลือ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employeeEligibility.map((emp) => (
              <tr key={emp.id} onClick={() => setSelectedEmp(emp)} className="hover:bg-slate-50/30 transition-colors group cursor-pointer">
                <td className="px-8 py-5 flex items-center gap-3">
                  <img src={emp.avatar} className="w-10 h-10 rounded-full bg-slate-100" alt="" />
                  <span className="font-bold text-slate-700">{emp.name}</span>
                </td>
                <td className="px-8 py-5 text-sm text-slate-500 font-medium">{emp.dept} / {emp.division}</td>
                <td className="px-8 py-5 text-center">
                  <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-bold uppercase">{emp.level}</span>
                </td>
                <td className="px-8 py-5 text-center text-slate-700 font-bold">{emp.leaves.annual.total - emp.leaves.annual.used}</td>
                <td className="px-8 py-5 text-center text-slate-700 font-bold">{emp.leaves.sick.total - emp.leaves.sick.used}</td>
                <td className="px-8 py-5 text-center text-slate-700 font-bold">{emp.leaves.personal.total - emp.leaves.personal.used}</td>
                <td className="px-8 py-5 text-right">
                  <span className="bg-cyan-50 text-cyan-600 px-4 py-1.5 rounded-xl font-bold text-sm">{calcRemaining(emp.leaves)} วัน</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- SIDE DRAWER: เวอร์ชั่น "ตัวใหญ่ เต็มตา ไร้สกรอล์" --- */}
      <AnimatePresence>
        {selectedEmp && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEmp(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[70] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-50">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">สิทธิ์วันลา</h2>
                <button onClick={() => setSelectedEmp(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"><X size={24} /></button>
              </div>

              {/* Body */}
              <div className="p-8 flex-grow flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Profile - กลับมาใช้ขนาดปกติให้ดูดี */}
                  <div className="flex items-center gap-5">
                    <img src={selectedEmp.avatar} className="w-20 h-20 rounded-full bg-slate-100 border-2 border-white shadow-sm" alt="" />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedEmp.name}</h3>
                      <p className="text-slate-500 font-medium">{selectedEmp.dept} · {selectedEmp.level}</p>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedEmp.subDept}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-cyan-600 pt-2">
                    <Calendar size={18} />
                    <h4 className="font-bold uppercase tracking-wider text-xs">สิทธิ์วันลาทั้งหมด</h4>
                  </div>

                  {/* Leave Cards - กลับมาใช้ฟอนต์ใหญ่ แต่ออกแบบให้ประหยัดพื้นที่แนวตั้ง */}
                  <div className="space-y-3">
                    <FinalLeaveCard label="ลาพักร้อน" total={selectedEmp.leaves.annual.total} used={selectedEmp.leaves.annual.used} />
                    <FinalLeaveCard label="ลาป่วย" total={selectedEmp.leaves.sick.total} used={selectedEmp.leaves.sick.used} />
                    <FinalLeaveCard label="ลากิจ" total={selectedEmp.leaves.personal.total} used={selectedEmp.leaves.personal.used} />
                  </div>
                </div>

                {/* Summary Bar - กลับมาใหญ่และเข้มตามภาพแรกที่มึงชอบ แต่อยู่ชิดขอบล่างพอดี */}
                <div className="bg-[#1e293b] rounded-[2rem] p-8 text-white flex justify-between items-center shadow-2xl">
                  <div>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">รวมสิทธิ์ทั้งหมด</p>
                    <h4 className="text-4xl font-extrabold">{calcTotalRights(selectedEmp.leaves)} <span className="text-sm font-normal text-slate-400">วัน</span></h4>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">คงเหลือรวม</p>
                    <h4 className="text-4xl font-extrabold text-cyan-400">{calcRemaining(selectedEmp.leaves)} <span className="text-sm font-normal text-slate-400">วัน</span></h4>
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

// --- Components ---

function FilterMini({ label }: { label: string }) {
  return (
    <button className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all min-w-[150px] shadow-sm cursor-pointer">
      <span className="truncate">{label}</span>
      <ChevronDown size={16} className="text-slate-400 shrink-0" />
    </button>
  );
}

// การ์ดแบบใหม่: ตัวหนังสือใหญ่เท่าเดิม แต่ใช้พื้นที่แนวกว้างช่วยเพื่อให้เตี้ยลง ไม่ต้องสกรอล์
function FinalLeaveCard({ label, total, used }: { label: string, total: number, used: number }) {
  const remaining = total - used;
  return (
    <div className="bg-slate-50/50 rounded-[1.5rem] p-5 border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
      <div className="space-y-1.5">
        <h5 className="font-bold text-slate-800 text-lg leading-none">{label}</h5>
        <div className="flex gap-4 text-xs font-bold">
          <span className="text-slate-400 uppercase tracking-tight">สิทธิ์: <span className="text-slate-700">{total}</span></span>
          <span className="text-slate-400 uppercase tracking-tight">ใช้: <span className="text-red-500">{used}</span></span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-2xl font-black text-emerald-500 leading-none">{remaining}</span>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">คงเหลือ</p>
      </div>
    </div>
  );
} 