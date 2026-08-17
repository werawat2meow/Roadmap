"use client";

import React, { useState } from "react";
import { Trash2, Plus, Calendar, Users } from "lucide-react";

// 1. Interface อ้างอิงจาก model leave_blackouts และ targets
interface RestrictedDate {
  id: number;
  date: string;
  reason: string;
  targetType: "ALL" | "DEPARTMENT" | "DIVISION" | "UNIT";
  targetName: string; // ชื่อแผนกหรือหน่วยที่เลือก
}

const initialData: RestrictedDate[] = [
  { id: 1, date: "2026-12-31", reason: "Year-end closing - no leave allowed", targetType: "ALL", targetName: "All Employees" },
  { id: 2, date: "2026-12-30", reason: "Year-end audit preparation", targetType: "DEPARTMENT", targetName: "Accounting" },
  { id: 3, date: "2026-06-30", reason: "Mid-year financial close", targetType: "DIVISION", targetName: "Finance Division" },
];

export default function LeaveSettingsRestrictedDatesPage() {
  const [restrictedDates, setRestrictedDates] = useState<RestrictedDate[]>(initialData);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newTargetType, setNewTargetType] = useState<RestrictedDate["targetType"]>("ALL");
  const [newTargetName, setNewTargetName] = useState("");

  const handleAdd = () => {
    if (!newDate || !newReason) return;
    const newItem: RestrictedDate = {
      id: Date.now(),
      date: newDate,
      reason: newReason,
      targetType: newTargetType,
      targetName: newTargetType === "ALL" ? "All Employees" : newTargetName,
    };
    setRestrictedDates([newItem, ...restrictedDates]);
    setNewDate("");
    setNewReason("");
    setNewTargetName("");
  };

  const handleDelete = (id: number) => {
    setRestrictedDates(restrictedDates.filter((item) => item.id !== id));
  };

  return (
    <section className="w-full space-y-4">
      {/* Header Section */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Restricted Leave Dates</h2>
        <p className="mt-1 text-sm text-slate-500">กำหนดช่วงเวลาห้ามลา สำหรับบางหน่วยงานหรือพนักงานทั้งหมด</p>
      </div>

      {/* Form Section (Add New) */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
            <input 
              type="date" 
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
            />
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Apply To (Target)</label>
            <select 
              value={newTargetType}
              onChange={(e) => setNewTargetType(e.target.value as any)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all"
            >
              <option value="ALL">All Employees</option>
              <option value="DEPARTMENT">Specific Department</option>
              <option value="DIVISION">Specific Division</option>
              <option value="UNIT">Specific Unit</option>
            </select>
          </div>

          {newTargetType !== "ALL" && (
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dept/Unit Name</label>
              <input 
                type="text" 
                placeholder="e.g. IT, HR"
                value={newTargetName}
                onChange={(e) => setNewTargetName(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
              />
            </div>
          )}

          <div className={`${newTargetType === "ALL" ? "md:col-span-6" : "md:col-span-4"} space-y-2`}>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Reason</label>
            <input 
              type="text" 
              placeholder="e.g. Year-end audit"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
            />
          </div>

          <div className="md:col-span-1">
            <button 
              onClick={handleAdd}
              className="w-full h-[48px] flex items-center justify-center bg-slate-800 text-white rounded-2xl hover:bg-slate-700 transition-all shadow-md active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="space-y-3">
        {restrictedDates.map((item) => (
          <div key={item.id} className="group flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm border border-slate-100 hover:border-blue-100 transition-all">
            <div className="flex items-center gap-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Calendar size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-slate-900">{item.date}</h4>
                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.targetType === 'ALL' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <Users size={12} />
                    {item.targetName}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{item.reason}</p>
              </div>
            </div>
            
            <button 
              onClick={() => handleDelete(item.id)}
              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}