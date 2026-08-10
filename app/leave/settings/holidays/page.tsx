"use client";

import React, { useState } from "react";
import { Trash2, Plus, PartyPopper, CalendarDays } from "lucide-react";

// 1. Interface ให้ตรงกับ model leave_holidays ใน Prisma
interface Holiday {
  id: number;
  date: string;
  title: string;
}

// ข้อมูลตัวอย่างตามภาพ
const initialData: Holiday[] = [
  { id: 1, title: "วันขึ้นปีใหม่", date: "01/01/2569" },
  { id: 2, title: "วันมาฆบูชา", date: "03/03/2569" },
  { id: 3, title: "วันจักรี", date: "06/04/2569" },
];

export default function LeaveSettingsHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>(initialData);
  const [newDate, setNewDate] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = () => {
    if (!newDate || !newTitle) return;
    
    const newItem: Holiday = {
      id: Date.now(),
      title: newTitle,
      date: newDate,
    };

    // เพิ่มใหม่ไว้ด้านบน และเรียงตามวันที่ (Optional)
    setHolidays([newItem, ...holidays]);
    setNewDate("");
    setNewTitle("");
  };

  const handleDelete = (id: number) => {
    if (confirm("ต้องการลบวันหยุดนี้ใช่หรือไม่?")) {
      setHolidays(holidays.filter((item) => item.id !== id));
    }
  };

  return (
    <section className="w-full space-y-4">
      {/* Header Section */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Annual Holidays</h2>
        <p className="mt-1 text-sm text-slate-500">กำหนดวันหยุดประจำปีของบริษัท</p>
      </div>

      {/* Form Section - สำหรับเพิ่มวันหยุดใหม่ */}
      <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          <div className="md:col-span-3 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
            <input 
              type="date" 
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer" 
            />
          </div>

          <div className="md:col-span-8 space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Holiday Name</label>
            <input 
              type="text" 
              placeholder="e.g. New Year's Day"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all" 
            />
          </div>

          <div className="md:col-span-1">
            <button 
              onClick={handleAdd}
              className="w-full h-[48px] flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* List Section - รายการวันหยุด */}
      <div className="space-y-3">
        {holidays.map((item) => (
          <div 
            key={item.id} 
            className="group relative flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm border border-slate-100 hover:border-emerald-100 transition-all"
          >
            <div className="flex items-center gap-6">
              {/* Icon วันหยุด */}
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 group-hover:scale-110 transition-transform">
                <PartyPopper size={22} />
              </div>
              
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                <div className="flex items-center gap-2 text-slate-400">
                  <CalendarDays size={14} />
                  <span className="text-sm font-medium">{item.date}</span>
                </div>
              </div>
            </div>
            
            {/* ปุ่มถังขยะแบบเด่นเหมือนหน้ากำหนดสิทธิ์ */}
            <button 
              onClick={() => handleDelete(item.id)}
              className="flex items-center justify-center w-10 h-10 border border-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-100 transition-all cursor-pointer"
              title="ลบวันหยุด"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}