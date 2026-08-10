"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  UserMinus,
  Clock,
  Download,
  ChevronDown,
  FileText,
  CheckCircle2,
  X,
  Calendar,
  Check,
  Paperclip,
} from "lucide-react";

// --- Mock Data ---
const stats = [
  { label: "พนักงานทั้งหมด", value: 6, icon: Users, color: "text-cyan-500", bg: "bg-cyan-50" },
  { label: "มาทำงานวันนี้", value: 6, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
  { label: "ลาวันนี้", value: 0, icon: UserMinus, color: "text-red-500", bg: "bg-red-50" },
  { label: "รอยืนยัน", value: 3, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
];

const attendanceOverview = [
  { group: "Engineering", total: 2, present: 2, leave: 0, percent: "100%" },
  { group: "Finance", total: 1, present: 1, leave: 0, percent: "100%" },
  { group: "HR", total: 1, present: 1, leave: 0, percent: "100%" },
  { group: "Marketing", total: 1, present: 1, leave: 0, percent: "100%" },
  { group: "Operations", total: 1, present: 1, leave: 0, percent: "100%" },
];

const approvedRequests = [
  {
    id: 1,
    name: "Naree Suwan",
    dept: "Finance",
    division: "Accounting",
    level: "MID LEVEL",
    type: "ลาพักร้อน",
    dates: "2026-08-03 → 2026-08-05",
    days: 3,
    status: "รอยืนยัน",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Naree",
    reason: "ไปเที่ยวต่างจังหวัดกับครอบครัว",
    totalRights: 15,
    usedDays: 2,
    approver: "Admin",
  },
  {
    id: 2,
    name: "Somchai Jaidee",
    dept: "Engineering",
    division: "Senior Staff",
    level: "SENIOR STAFF",
    type: "ลาพักร้อน",
    dates: "2026-07-26 → 2026-07-27",
    days: 2,
    status: "ยืนยันแล้ว",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Somchai",
    reason: "พักผ่อนประจำปี",
    totalRights: 15,
    usedDays: 2,
    approver: "Admin",
  },
  {
    id: 3,
    name: "Suda Wongsa",
    dept: "HR",
    division: "Personnel",
    level: "MANAGER",
    type: "ลาป่วย",
    dates: "2026-07-25 → 2026-07-27",
    days: 3,
    status: "รอยืนยัน",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suda",
    reason: "เป็นไข้หวัดใหญ่",
    totalRights: 30,
    usedDays: 5,
    approver: "Somchai",
  },
  {
    id: 4,
    name: "Prasert Boonmee",
    dept: "Operations",
    division: "Logistics",
    level: "STAFF",
    type: "ลากิจ",
    dates: "2026-07-20 → 2026-07-22",
    days: 3,
    status: "รอยืนยัน",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Prasert",
    reason: "ไปทำธุระที่ต่างจังหวัด",
    totalRights: 7,
    usedDays: 1,
    approver: "Admin",
  },
];

export default function ReportsPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  return (
    <section className="w-full p-8 space-y-6 min-h-screen relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            พนักงานที่ผ่านการอนุมัติ — <span className="text-slate-400">ยืนยันและตรวจสอบสิทธิ์วันลาคงเหลือ</span>
          </p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all text-sm font-semibold shadow-md cursor-pointer">
          <Download size={18} />
          ส่งออก Excel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
            </div>
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
              <stat.icon size={26} />
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Overview Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">ภาพรวมการมาทำงานวันนี้</h3>
          <button className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 hover:text-slate-700 transition-colors cursor-pointer">
            จัดตามแผนก <ChevronDown size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">กลุ่ม</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">ทั้งหมด</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">มาทำงาน</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">ลา</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">มาทำงาน %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {attendanceOverview.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-8 py-5 font-bold text-slate-700">{item.group}</td>
                  <td className="px-8 py-4 text-center text-slate-500 font-medium">{item.total}</td>
                  <td className="px-8 py-4 text-center text-emerald-500 font-bold">{item.present}</td>
                  <td className="px-8 py-4 text-center text-red-400 font-bold">{item.leave}</td>
                  <td className="px-8 py-4 text-right text-slate-500 font-bold">{item.percent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approved List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold text-slate-800 text-lg">รายการที่อนุมัติแล้ว {approvedRequests.length} รายการ</h3>
          <div className="flex flex-wrap gap-2">
            <FilterMini label="แผนกทั้งหมด" />
            <FilterMini label="ฝ่ายทั้งหมด" />
            <FilterMini label="หน่วยทั้งหมด" />
            <FilterMini label="ระดับทั้งหมด" />
            <FilterMini label="สถานะยืนยันทั้งหมด" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">พนักงาน</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">แผนก</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">ประเภท</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">วันที่</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">วัน</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center">สถานะ</th>
                <th className="px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {approvedRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <img src={req.avatar} alt="" className="w-12 h-12 rounded-full bg-slate-100 shadow-sm" />
                      <span className="font-bold text-slate-700 text-base">{req.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{req.dept}</td>
                  <td className="px-8 py-5 text-sm text-slate-600 font-semibold">{req.type}</td>
                  <td className="px-8 py-5 text-sm text-slate-400 font-mono tracking-tight">{req.dates}</td>
                  <td className="px-8 py-5 text-center text-slate-700 font-bold text-base">{req.days} วัน</td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                        req.status === "รอยืนยัน" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setSelectedEmployee(req)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                      >
                        <FileText size={18} /> ดูสิทธิ์
                      </button>
                      {req.status === "รอยืนยัน" && (
                        <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#14b8a6] text-white rounded-2xl hover:bg-[#0d9488] transition-all cursor-pointer shadow-md active:scale-95">
                          <CheckCircle2 size={18} /> ยืนยัน
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- SIDE DRAWER: รายละเอียด & สิทธิ์วันลา --- */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[70] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">รายละเอียด & สิทธิ์วันลา</h2>
                <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 cursor-pointer">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-10">
                <div className="flex items-center gap-5">
                  <img src={selectedEmployee.avatar} alt="" className="w-20 h-20 rounded-full bg-slate-100 shadow-sm" />
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedEmployee.name}</h3>
                    <p className="text-slate-500 font-medium">{selectedEmployee.dept} · {selectedEmployee.division}</p>
                    <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">{selectedEmployee.level}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-8 border-t border-slate-50 pt-8">
                  <DetailBox label="ประเภทการลา" value={selectedEmployee.type} />
                  <DetailBox label="จำนวนวัน" value={`${selectedEmployee.days} วัน`} />
                  <DetailBox label="วันที่ลา" value={selectedEmployee.dates} />
                  <DetailBox label="ผู้อนุมัติ" value={selectedEmployee.approver} />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#14b8a6]">
                    <Calendar size={20} />
                    <h4 className="font-bold uppercase tracking-wider text-sm">สิทธิ์วันลาคงเหลือ</h4>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-2 shadow-sm">
                    <div className="flex justify-between items-center p-4">
                      <span className="text-slate-500 font-bold">สิทธิ์ทั้งหมด</span>
                      <span className="text-slate-800 font-bold">{selectedEmployee.totalRights} วัน</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border-t border-slate-50">
                      <span className="text-slate-500 font-bold">ใช้ไปแล้ว</span>
                      <span className="text-red-500 font-bold">{selectedEmployee.usedDays} วัน</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-slate-50/50 rounded-[1.5rem] mt-2">
                      <span className="text-slate-700 font-extrabold text-lg">คงเหลือ</span>
                      <span className="text-[#14b8a6] font-extrabold text-2xl">{selectedEmployee.totalRights - selectedEmployee.usedDays} วัน</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  {selectedEmployee.status === 'ยืนยันแล้ว' ? (
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-lg">
                      <Check size={24} className="stroke-[3px]" /> ยืนยันแล้ว
                    </div>
                  ) : (
                    <button className="w-full py-4 bg-[#14b8a6] text-white font-bold rounded-2xl hover:bg-[#0d9488] transition-all shadow-lg shadow-teal-100 active:scale-95 cursor-pointer">
                      ยืนยันรายการนี้
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

// --- Sub-components ---
function FilterMini({ label }: { label: string }) {
  return (
    <button className="flex items-center justify-between gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-all min-w-[150px] shadow-sm cursor-pointer">
      <span className="truncate">{label}</span>
      <ChevronDown size={16} className="text-slate-400 shrink-0" />
    </button>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-lg font-bold text-slate-800">{value}</p>
    </div>
  );
}